#ai-shopping-search/backend/chat/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import ChatSession, ChatMessage
from .serializers import ChatMessageSerializer, ChatSessionSerializer
from .utils import query_algolia_agent

User = get_user_model()

class ChatView(APIView):
    """
    API for handling chat messages with Algolia Agent.
    """

    def get_user_from_request(self, request):
        """
        Helper to get Real User OR Guest User based on header/data
        """
        if request.user.is_authenticated:
            return request.user

        # For guests: look for guest_id coming from frontend
        # The frontend sends guest_id which maps to username in our new system
        guest_username = request.data.get('guest_id') or request.headers.get('X-Guest-Id')

        if guest_username:
            # Try to find the existing guest or create a new record
            user, created = User.objects.get_or_create(
                username=guest_username,
                defaults={'is_guest': True} # The Manager will handle the rest of defaults
            )
            return user

        # If no identifier found, create a brand new guest
        return User.objects.create_guest()

    def post(self, request):
        user = self.get_user_from_request(request)

        message_text = request.data.get('message')
        session_id = request.data.get('session_id')

        if not message_text:
            return Response({"error": "Message is required"}, status=400)

        # 1. Session Management
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user=user)
            except ChatSession.DoesNotExist:
                session = ChatSession.objects.create(user=user, title=message_text[:30])
        else:
            session = ChatSession.objects.create(user=user, title=message_text[:30])

        # 2. Save User Message
        ChatMessage.objects.create(
            session=session,
            role=ChatMessage.Role.USER,
            content=message_text
        )

        # 3. Send to Algolia
        algolia_response = query_algolia_agent(message_text, session.id)

        # 4. Process Response
        ai_content = "Sorry, I couldn't reach the shopping agent right now."
        products = []

        if algolia_response:
            # Adapt keys based on actual Algolia response structure
            ai_content = algolia_response.get('answer', ai_content)
            products = algolia_response.get('hits', [])

        # 5. Save AI Response
        agent_msg = ChatMessage.objects.create(
            session=session,
            role=ChatMessage.Role.ASSISTANT,
            content=ai_content,
            metadata={"products": products} if products else None
        )

        # 6. Return Response
        return Response({
            "session_id": session.id,
            "guest_id": user.username, # Important for frontend to persist
            "message": agent_msg.content,
            "products": products,
            "created_at": agent_msg.created_at
        })
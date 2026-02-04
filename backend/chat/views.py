#ai-shopping-search/backend/chat/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import ChatSession, ChatMessage
from .serializers import ChatMessageSerializer, ChatSessionSerializer
# from .utils import query_algolia_agent

User = get_user_model()
class ChatView(APIView):
    """GET for retrieving chat history, POST for sending messages to Algolia Agent,
    DELETE for clearing history."""
    def get_user(self, request):
        """Helper to get Real User OR Guest User based on header/data"""
        if request.user.is_authenticated:
            return request.user
    # For guests: look for guest_id coming from frontend
    guest_id  = request.headers.get('guest_id') or request.data.get('guest_id')
   if guest_id:
       try:
           user = User.objects.get(username=guest_id, is_guest=True)
            return user, False
       except User.DoesNotExist:
              pass
       # If no identifier found, create a brand new guest
       new_guest = User.objects.create_guest()
       return new_guest, True
   def post(self, request):
       """handle thee cases 1- new guest 2-existing guest 3-authenticated user"""
        content = request.data.get('message', '').strip()
        #to prevent  deduplication later
        client_message_id = request.data.get('client_message_id')
        provided_session_id = request.data.get('session_id')
        if not content:
            return Response({"error": "Message content is required"}, status=400)
        #  identify get  user
        user, is_new_user = self.get_user(request)
        session = None
        if provided_session_id:
            session = ChatSession.objects.filter(id=provided_session_id, user=user).first()
        if not session:
            session_title = content[:50]  + "..." if len(content) > 50 else content
            session = ChatSession.objects.create(user=user, title=session_title)
            # save user message  to Ensure  not lose it
        ChatMessage.objects.create(
            session=session, role=ChatMessage.role.USER, content=content,
            status=ChatMessage.Status.COMPLETED, client_message_id=client_message_id
        )
        # update session last message time
        # session.last_message_at = ChatMessage.objects.filter(session=session).latest('created_at').created_at
        session.last_message_at = timezone.now()
        session.save(update_fields=['last_message_at'])
        def save_ai_response(ai_content, products):
            # identify Generator (streaming core)
            # it will save while streaming to frontend
            initial_data = { "type":"meta", "guest_id": user.guest_id,
            "session_id": session.id, "is_new_user": is_new_user }
            yield f"data: {json.dumps(initial_data)}\n\n"
            # will used later to collect full answer save to psql
            full_agent_answer = ""
            collected_hits = []
            try:
                #stablish connection with algolia and pass data
                for chunk in query_algolia_streaming(content, session.id):
                    # decode bytes to string so ChatView can process it
                    decoded_line = chunk.decode('utf-8')
                    yield f"{chunk}\n\n
                    if chunk.strip().startswith("data: "):
                    # extract actual data payload
                    # we delete "data: " prefix to get pure json
                        try:
                            clean_json = chunk.replace("data: ", "").strip()
                            if clean_json: == ["DONE"]:
                                continue
                            data = json.loads(clean_json)
                            if data.get("type:") == "text_delta":
                                full_agent_answer = data.fet("delta", "")
                            # collect hits "products"
                            elif dat.get("type") == "tool-output-available":
                                output = data.get("output", {})




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
'''
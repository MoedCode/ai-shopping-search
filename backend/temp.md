```py
#ai-shopping-search/backend/chat/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.http import StreamingHttpResponse
from django.utils import timezone
import json
from .models import ChatSession, ChatMessage
from .serializers import ChatMessageSerializer, ChatSessionSerializer
from .utils import query_algolia_streaming

User = get_user_model()

class ChatView(APIView):
    """GET for retrieving chat history, POST for sending messages to Algolia Agent,
    DELETE for clearing history."""

    def get_user(self, request):
        """Helper to get Real User OR Guest User based on header/data"""
        if request.user.is_authenticated:
            return request.user, False
        
        # For guests: look for guest_id coming from frontend
        guest_id = request.headers.get('X-Guest-Id') or request.data.get('guest_id')
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
        # to prevent deduplication later
        client_message_id = request.data.get('client_message_id')
        provided_session_id = request.data.get('session_id')
        
        if not content:
            return Response({"error": "Message content is required"}, status=400)
        
        # identify get user
        user, is_new_user = self.get_user(request)
        session = None
        
        if provided_session_id:
            session = ChatSession.objects.filter(id=provided_session_id, user=user).first()
        
        if not session:
            session_title = content[:50] + "..." if len(content) > 50 else content
            session = ChatSession.objects.create(user=user, title=session_title)
        
        # save user message to Ensure not lose it
        ChatMessage.objects.create(
            session=session, role=ChatMessage.Role.USER, content=content,
            status=ChatMessage.Status.COMPLETED, client_message_id=client_message_id
        )
        
        # update session last message time
        session.last_message_at = timezone.now()
        session.save(update_fields=['last_message_at'])

        def event_stream():
            # identify Generator (streaming core)
            # it will save while streaming to frontend
            guest_identifier = user.username if hasattr(user, 'username') else str(user.id)
            initial_data = { "type": "meta", "guest_id": guest_identifier,
                             "session_id": str(session.id), "is_new_user": is_new_user }
            yield f"data: {json.dumps(initial_data)}\n\n"
            
            # will used later to collect full answer save to psql
            full_agent_answer = ""
            collected_hits = []
            
            try:
                # stablish connection with algolia and pass data
                for chunk in query_algolia_streaming(content, session.id):
                    # decode bytes to string so ChatView can process it
                    decoded_line = chunk
                    yield f"{decoded_line}\n\n"
                    
                    if decoded_line.strip().startswith("data: "):
                        # extract actual data payload
                        # we delete "data: " prefix to get pure json
                        try:
                            clean_json = decoded_line.replace("data: ", "").strip()
                            if clean_json == "[DONE]":
                                continue
                            data = json.loads(clean_json)
                            if data.get("type") == "text_delta":
                                full_agent_answer += data.get("delta", "")
                            # collect hits "products"
                            elif data.get("type") == "tool-output-available":
                                output = data.get("output", {})
                                full_agent_answer += output.get("text", "")
                            elif data.get("type") == "tools-output-available":
                                output = data.get("output", {})
                                if "hits" in output:
                                    collected_hits = output["hits"]
                        except json.JSONDecodeError:
                            continue
                
                # After streaming is done, save the AI response
                if full_agent_answer or collected_hits:
                    ChatMessage.objects.create(
                        session=session,
                        role=ChatMessage.Role.ASSISTANT,
                        content=full_agent_answer,
                        metadata={"products": collected_hits},
                        status=ChatMessage.Status.COMPLETED
                    )
                session.last_message_at = timezone.now()
                session.save(update_fields=['last_message_at'])
            except Exception as e:
                # if an error happen while stream send error message tp the front 
                error_data = {"type": "error", "message": "connection interrupted"}
                yield f"data: {json.dumps(error_data)}\n\n"
                # save a filed message tp psql
                ChatMessage.objects.create(
                    session=session,
                    role=ChatMessage.Role.ASSISTANT,
                    content="Sorry, I encountered an error while processing your request.",
                    status=ChatMessage.Status.FAILED
                )

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['X-Accel-Buffering'] = 'no'
        response['Cache-Control'] = 'no-cache'
        return response

    def get(self, request):
        """get chat session"""
        user, _ = self.get_user(request)
        session_id = request.query_params.get('session_id', '')
        if not session_id:
            session_id = request.data.get('session_id', '')
        
        if not session_id:
            return Response({"error": "Session ID required"}, status=400)
        
        try:
            session = ChatSession.objects.get(id=session_id, user=user)
            messages = session.messages.all().order_by('created_at')
            serialized_messages = ChatMessageSerializer(messages, many=True)
            return Response(serialized_messages.data)
        except ChatSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=404)

    def get_session(self, request):
        user, _ = self.get_user(request)
        session_id = request.query_params.get('session_id', '') or request.data.get('session_id', '')
        
        try:
            session = ChatSession.objects.get(id=session_id, user=user)
        except ChatSession.DoesNotExist:
            return False, "Session not found"
        return True, session
    
    def patch(self, request):
        found, session = self.get_session(request)
        if not found:
            return Response({"error": session}, status=404)
        session_title = request.data.get('session_title')
        session.title = session_title
        session.save()
        return Response({"message": "Session title updated", "data": session_title}, status=200)

    def delete(self, request):
        found, session = self.get_session(request)
        if not found:
            return Response({"error": session}, status=404)
        session.delete()
        return Response({"message": "Session deleted"}, status=200)
    ```
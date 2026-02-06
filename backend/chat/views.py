#ai-shopping-search/backend/chat/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.http import StreamingHttpResponse
from django.utils import timezone
import json
import uuid
from .models import ChatSession, ChatMessage
from .serializers import ChatMessageSerializer, ChatSessionSerializer, ChatSessionSummarySerializer
from .utils import query_algolia_streaming

User = get_user_model()

def debug_log_agent_response(session_id, full_answer, hits):
    """
    Overwrites 'agent_log.json' with the latest agent response for debugging.
    """
    log_data = {
        "timestamp": str(timezone.now()),
        "session_id": str(session_id),
        "agent_response_text": full_answer,
        "products_hits": hits
    }
    
    try:
        # 'w' mode ensures the file is overwritten (truncated) every time
        with open('agent_log.json', 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=4, ensure_ascii=False)
        print("DEBUG: Agent response dumped to agent_log.json")
    except Exception as e:
        print(f"DEBUG ERROR: Failed to write log file: {e}")
class ChatView(APIView):
    """
    API View to handle Chat Sessions and Messages.
    Supports:
    - GET: Retrieve chat history.
    - POST: Send a message (Streaming Response) & Deduplication logic.
    - DELETE: Clear chat history.
    """

    def get_old(self, request):
        """Retrieve Chat History"""
        user, _ = self.get_user(request)
        if not user:
            return Response({"error": "User not found"}, status=404)

    
        session_id = request.query_params.get('session_id') or request.data.get('session_id')
        
        if not session_id:
            try:
                all_sessions = ChatSession.objects.filter(user=user).order_by('-created_at')
                serialized_sessions = ChatSessionSerializer(all_sessions, many=True)
                return Response({"guest_id":user.guest_id,"messages": serialized_sessions.data})
            except ChatSession.DoesNotExist:
                return Response({"error": "No sessions found"}, status=404)
            # return Response({"error": "Session ID required"}, status=400)
        
        try:
            session = ChatSession.objects.get(id=session_id, user=user)
            messages = session.messages.all().order_by('created_at')
            serialized_messages = ChatMessageSerializer(messages, many=True)
            return Response(serialized_messages.data )
        except ChatSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=404)

    def get(self, request):
            """Retrieve Chat History OR List of Sessions"""
            user, _ = self.get_user(request)
            session_id = request.query_params.get('session_id') or request.data.get('session_id')
            
            # الحالة 1: جلب رسائل جلسة محددة
            if session_id:
                try:
                    session = ChatSession.objects.get(id=session_id, user=user)
                    messages = session.messages.all().order_by('created_at')
                    serialized_messages = ChatMessageSerializer(messages, many=True)
                    return Response(serialized_messages.data)
                except ChatSession.DoesNotExist:
                    return Response({"error": "Session not found"}, status=404)
            
            # الحالة 2: جلب قائمة الجلسات (للقائمة الجانبية)
            else:
                sessions = ChatSession.objects.filter(user=user).order_by('-last_message_at')
                serializer = ChatSessionSummarySerializer(sessions, many=True)
                return Response(serializer.data)
    def get_user(self, request):
        """Helper to get Real User OR Guest User based on header/data"""
        if request.user.is_authenticated:
            return request.user, False
    
        # Priority: Header > Body
        guest_id = request.headers.get('X-Guest-Id') or request.data.get('guest_id')
        
        if guest_id:
            try:
                # We assume the frontend stores the 'username' of the guest as the ID
                user = User.objects.get(username=guest_id, is_guest=True)
                return user, False
            except User.DoesNotExist:
                pass
        
        # If no identifier found, create a brand new guest
        new_guest = User.objects.create_guest()
        return new_guest, True

    def post(self, request):
        """
        Handle incoming messages.
        - Creates/Retrieves Session.
        - Saves User Message (with deduplication support via client_message_id).
        - Streams back the AI response.
        """
        content = request.data.get('message', '').strip()
        client_message_id = request.data.get('client_message_id')
        provided_session_id = request.data.get('session_id')
        
        if not content:
            return Response({"error": "Message content is required"}, status=400)
        
        # 1. Identify User
        user, is_new_user = self.get_user(request)
        session = None
        
        # 2. Retrieve or Create Session
        if provided_session_id:
            session = ChatSession.objects.filter(id=provided_session_id, user=user).first()
        
        if not session:
            # Create title from first 50 chars
            session_title = content[:50] + "..." if len(content) > 50 else content
            session = ChatSession.objects.create(user=user, title=session_title)
        
        # 3. Validate & Map client_message_id -> external_id
        # We ensure it is a valid UUID, otherwise we let Django auto-generate one.
        valid_external_id = None
        if client_message_id:
            try:
                valid_external_id = uuid.UUID(str(client_message_id))
            except ValueError:
                pass # Invalid UUID string from frontend; ignore it.

        # 4. Save User Message
        # Note: We map 'client_message_id' (Frontend) to 'external_id' (Database)
        user_message_kwargs = {
            "session": session,
            "role": ChatMessage.Role.USER,
            "content": content,
            "status": ChatMessage.Status.COMPLETED
        }
        
        if valid_external_id:
            # Check for deduplication: If message already exists, don't create new one
            # This is optional but good practice if frontend retries requests
            if not ChatMessage.objects.filter(external_id=valid_external_id).exists():
                 user_message_kwargs["external_id"] = valid_external_id
                 ChatMessage.objects.create(**user_message_kwargs)
        else:
            ChatMessage.objects.create(**user_message_kwargs)
        
        # Update session timestamp
        session.last_message_at = timezone.now()
        session.save(update_fields=['last_message_at'])

        # 5. Generator Function for Streaming Response
        def event_stream():
            guest_identifier = user.username if hasattr(user, 'username') else str(user.id)
            
            # Send Meta Data first (Frontend needs this to track session/guest)
            initial_data = { 
                "type": "meta", 
                "guest_id": guest_identifier,
                "session_id": str(session.id), 
                "is_new_user": is_new_user 
            }
            yield f"data: {json.dumps(initial_data)}\n\n"
            
            full_agent_answer = ""
            collected_hits = []
            
            try:
                # Stream content from Algolia Utils
                for chunk in query_algolia_streaming(content, session.id):
                    # chunk is already a decoded string from utils
                    yield f"{chunk}\n\n"
                    
                    # Accumulate data for saving to DB later
                    if chunk.strip().startswith("data: "):
                        try:
                            clean_json = chunk.replace("data: ", "").strip()
                            if clean_json == "[DONE]":
                                continue
                            data = json.loads(clean_json)
                            
                            if data.get("type") == "text-delta":
                                full_agent_answer += data.get("delta", "")
                            
                            elif data.get("type") in ["tool-output-available", "tools-output-available"]:
                                output = data.get("output", {})
                                full_agent_answer += output.get("text", "") # Append tool text if any
                                if "hits" in output:
                                    collected_hits = output["hits"]
                        except json.JSONDecodeError:
                            continue
                
                # 6. Save Assistant Response to DB
                # Only save if we got something back
                if full_agent_answer or collected_hits:
                    ChatMessage.objects.create(
                        session=session,
                        role=ChatMessage.Role.ASSISTANT,
                        content=full_agent_answer,
                        metadata={"products": collected_hits},
                        status=ChatMessage.Status.COMPLETED
                    )
                
                # Update timestamp again
                session.last_message_at = timezone.now()
                session.save(update_fields=['last_message_at'])
                debug_log_agent_response(session.id, full_agent_answer, collected_hits)
            except Exception as e:
                # Handle Stream Interruptions
                error_data = {"type": "error", "message": "connection interrupted"}
                yield f"data: {json.dumps(error_data)}\n\n"
                
                ChatMessage.objects.create(
                    session=session,
                    role=ChatMessage.Role.ASSISTANT,
                    content="Sorry, I encountered an error while processing your request.",
                    status=ChatMessage.Status.FAILED
                )

        # 7. Return Streaming Response
        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['X-Accel-Buffering'] = 'no' # Disable Nginx buffering
        response['Cache-Control'] = 'no-cache'
        return response



    def patch(self, request):
        """Update Session Title (Renamed from 'update' to 'patch' for DRF compatibility)"""
        found, session = self.get_session(request)
        if not found:
            return Response({"error": session}, status=404)
        
        session_title = request.data.get('session_title')
        if session_title:
            session.title = session_title
            session.save()
            return Response({"message": "Session title updated", "data": session_title}, status=200)
        return Response({"message": "No title provided"}, status=400)

    def delete(self, request):
        """Delete a Session"""
        found, session = self.get_session(request)
        if not found:
            return Response({"error": session}, status=404)
        session.delete()
        return Response({"message": "Session deleted"}, status=200)

    def get_session(self, request):
        """Internal helper to fetch session"""
        user, _ = self.get_user(request)
        session_id = request.query_params.get('session_id') or request.data.get('session_id')
        
        try:
            session = ChatSession.objects.get(id=session_id, user=user)
            return True, session
        except ChatSession.DoesNotExist:
            return False, "Session not found"
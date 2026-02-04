import json
from django.utils import timezone
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model

from .models import ChatSession, ChatMessage
from .serializers import ChatMessageSerializer
from .utils import query_algolia_streaming  # تأكد أن هذه الدالة موجودة في utils.py

User = get_user_model()

class ChatView(APIView):
    """
    The Core Chat Handler using Streaming Responses.
    Handles: Guest Creation -> Session Creation -> Message Saving -> AI Streaming.
    """

    # لا نحتاج لـ permission classes لأننا ندير الـ Guest يدوياً
    authentication_classes = []
    permission_classes = []

    def get_or_create_user(self, request):
        """
        Logic to resolve identity:
        1. Authenticated User -> Return user.
        2. Guest ID in Header -> Return existing guest.
        3. No ID -> Create NEW Guest.
        """
        # 1. مسجل دخول بالفعل
        if request.user.is_authenticated:
            return request.user, False

        # 2. البحث عن Guest ID في الهيدر أو البودي
        guest_id = request.headers.get('X-Guest-Id') or request.data.get('guest_id')

        if guest_id:
            try:
                user = User.objects.get(username=guest_id, is_guest=True)
                return user, False
            except User.DoesNotExist:
                pass # إذا كان الآيدي غير صالح، ننشئ واحد جديد

        # 3. إنشاء ضيف جديد
        new_guest = User.objects.create_guest()
        return new_guest, True

    def post(self, request):
        # 1. استخراج البيانات
        content = request.data.get('message', '').strip()
        client_message_id = request.data.get('client_message_id') # للمنع التكرار مستقبلاً
        provided_session_id = request.data.get('session_id')

        if not content:
            return Response({"error": "Message content is required"}, status=400)

        # 2. تحديد هوية المستخدم (User Resolution)
        user, is_new_user = self.get_or_create_user(request)

        # 3. إدارة الجلسة (Session Management)
        session = None
        if provided_session_id:
            session = ChatSession.objects.filter(id=provided_session_id, user=user).first()

        # إذا لم توجد جلسة، ننشئ واحدة جديدة
        if not session:
            # عنوان الجلسة يكون أول 50 حرف من الرسالة
            session_title = content[:50] + "..." if len(content) > 50 else content
            session = ChatSession.objects.create(user=user, title=session_title)

        # 4. حفظ رسالة المستخدم (User Message Persistence)
        # نحفظها فوراً قبل بدء الاتصال مع الـ Agent لضمان عدم ضياعها
        ChatMessage.objects.create(
            session=session,
            role=ChatMessage.Role.USER,
            content=content,
            status=ChatMessage.Status.COMPLETED, # رسالة المستخدم دائماً مكتملة
            # يمكن إضافة client_message_id هنا في الـ metadata لو أردت
        )

        # تحديث توقيت آخر نشاط للجلسة
        session.last_message_at = timezone.now()
        session.save(update_fields=['last_message_at'])

        # 5. تعريف الـ Generator (The Streaming Core)
        # هذه الدالة ستعمل أثناء إرسال الرد للمتصفح
        def event_stream():
            # أ) إرسال الـ Meta Data أولاً (هامة جداً للفرونت)
            # الفرونت سيأخذ الـ guest_id ويحفظه في الكوكيز
            initial_data = {
                "type": "meta",
                "guest_id": user.username,
                "session_id": str(session.id),
                "is_new_user": is_new_user
            }
            yield f"data: {json.dumps(initial_data)}\n\n"

            # ب) متغيرات لتجميع الرد الكامل (للحفظ في الـ DB لاحقاً)
            full_agent_answer = ""
            collected_hits = []

            try:
                # ج) فتح الاتصال مع Algolia وتمرير البيانات
                # query_algolia_streaming يجب أن تكون generator يرجع سطور raw data
                for chunk in query_algolia_streaming(content, session.id):

                    # 1. تمرير (Pass-through) للمتصفح فوراً
                    yield f"{chunk}\n\n"

                    # 2. التنصت (Snooping) على البيانات لتجميعها
                    if chunk.strip().startswith("data:"):
                        try:
                            # نحذف كلمة "data: " لنحصل على الـ JSON
                            clean_json = chunk.replace("data: ", "").strip()
                            if clean_json == "[DONE]":
                                continue

                            data = json.loads(clean_json)

                            # تجميع النص
                            if data.get("type") == "text-delta":
                                full_agent_answer += data.get("delta", "")

                            # تجميع المنتجات (Hits)
                            elif data.get("type") == "tool-output-available":
                                output = data.get("output", {})
                                if "hits" in output:
                                    collected_hits = output["hits"]

                        except json.JSONDecodeError:
                            continue

                # د) بعد انتهاء الـ Stream بنجاح: حفظ رد الأيجنت في الـ DB (مرة واحدة)
                if full_agent_answer or collected_hits:
                    ChatMessage.objects.create(
                        session=session,
                        role=ChatMessage.Role.ASSISTANT,
                        content=full_agent_answer,
                        metadata={"products": collected_hits},
                        status=ChatMessage.Status.COMPLETED
                    )
                    # تحديث وقت الجلسة مرة أخرى
                    session.last_message_at = timezone.now()
                    session.save(update_fields=['last_message_at'])

            except Exception as e:
                # هـ) في حالة حدوث خطأ أثناء الـ Stream
                # نرسل رسالة خطأ للفرونت
                error_data = {"type": "error", "message": "Connection interrupted"}
                yield f"data: {json.dumps(error_data)}\n\n"

                # ونسجل المحاولة الفاشلة في الـ DB
                ChatMessage.objects.create(
                    session=session,
                    role=ChatMessage.Role.ASSISTANT,
                    content="Sorry, I encountered an error while processing your request.",
                    status=ChatMessage.Status.FAILED
                )

        # 6. إرجاع استجابة من نوع Streaming
        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['X-Accel-Buffering'] = 'no'  # هام لـ Nginx عشان ما يوقفش الـ Stream
        response['Cache-Control'] = 'no-cache'
        return response

    def get(self, request):
        """
        استرجاع تاريخ المحادثة لجلسة معينة.
        """
        user, _ = self.get_or_create_user(request)
        session_id = request.query_params.get('session_id')

        if not session_id:
            return Response({"error": "Session ID required"}, status=400)

        try:
            session = ChatSession.objects.get(id=session_id, user=user)
            # ترتيب الرسائل من الأقدم للأحدث
            messages = session.messages.all().order_by('created_at')
            serializer = ChatMessageSerializer(messages, many=True)
            return Response(serializer.data)
        except ChatSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=404)
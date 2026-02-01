```py
# backend/chat/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import ChatSession, ChatMessage
from accounts.models import User
from .utils import query_algolia_agent # الدالة التي كتبناها بالأعلى

class ChatView(APIView):
    """
    Main entry point for Chat.
    Handles: User Msg -> DB -> Algolia -> DB -> Response
    """

    def post(self, request):
        # 1. استخراج البيانات والتحقق من المستخدم
        # نعتمد على Middleware لجلب المستخدم أو نستخدم التوكن
        user = request.user
        message_text = request.data.get('message')
        session_id = request.data.get('session_id')

        if not message_text:
            return Response({"error": "Message is required"}, status=400)

        # 2. إدارة الجلسة (Session Management)
        # إذا لم يرسل session_id، ننشئ جلسة جديدة
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user=user)
            except ChatSession.DoesNotExist:
                return Response({"error": "Invalid session"}, status=404)
        else:
            session = ChatSession.objects.create(user=user, title=message_text[:30])

        # 3. حفظ رسالة المستخدم (User Message) - Linear Structure
        ChatMessage.objects.create(
            session=session,
            role=ChatMessage.Role.USER,
            content=message_text
        )

        # 4. الاتصال بـ Algolia Agent (The Bridge)
        algolia_response = query_algolia_agent(message_text, session.id)

        if not algolia_response:
            # حالة الفشل (Fallback)
            return Response(
                {"error": "Agent is sleeping... try again later!"},
                status=503
            )

        # 5. تحليل رد Algolia
        # (هنا نفترض شكل الرد بناءً على معايير Algolia)
        # عادة يحتوي على "answer" (النص) و "hits" (المنتجات)
        ai_text = algolia_response.get('answer', 'Here is what I found...')
        products = algolia_response.get('hits', [])

        # 6. حفظ رد الـ Agent مع الميتاداتا
        agent_msg = ChatMessage.objects.create(
            session=session,
            role=ChatMessage.Role.ASSISTANT,
            content=ai_text,
            metadata={"products": products} # نخزن المنتجات هنا بمرونة
        )

        # 7. الرد النهائي للفرونت إند
        return Response({
            "session_id": session.id,
            "message": agent_msg.content,
            "products": products, # نرسل المنتجات منفصلة ليسهل عرضها
            "created_at": agent_msg.created_at
        }, status=200)
```
























تحليلك للكود ممتاز لأنك تسأل عن "الأسا


س" (Foundation) قبل البناء. الهيكلة التي وضعتها (فصل رسالة المستخدم عن رد الـ AI في جدولين مختلفين) هو أسلوب "تقليدي" كان يستخدم في أنظمة المنتديات القديمة أو الـ Ticket Systems، لكنه **لا يعتبر Best Practice** في عالم الـ Generative AI والـ Chatbots الحديثة.

إليك التحليل الفني العميق للأخطاء الهيكلية ولماذا يجب تغييرها، بناءً على معايير الصناعة (مثل طريقة هيكلة OpenAI API، و WhatsApp، وغيرها):

### 1. المشكلة الأولى: الفصل بين `UserMessage` و `AgentResponse`

**الكود الحالي:** لديك جدول لرسائل المستخدم وجدول لردود الـ Agent.
**المشكلة (The Time-Series Problem):**

* **التعقيد في الاسترجاع:** لكي تعرض المحادثة كاملة في الفرونت إند، ستحتاج لاستدعاء الجدولين ثم دمجهم (Merge) ثم ترتيبهم حسب الوقت. هذا مكلف جداً على قاعدة البيانات (Database Query Complexity).
* **تسلسل غير منطقي:** أحياناً المستخدم يرسل رسالتين متتاليتين دون رد، أو الـ Agent يرسل رداً ثم يرسل "تعديلاً" أو "اقتراحاً" آخر. الفصل بين الجداول يفترض دائماً نمط (سؤال -> جواب -> سؤال -> جواب)، وهذا يكسر مرونة المحادثة الطبيعية.

**✅ الحل القياسي (Industry Standard):**
استخدم جدولاً **واحداً** اسمه `ChatMessage` مع حقل يحدد "الدور" (Role).

* هذا يطابق تماماً هيكلة الـ LLMs (مثل GPT-4) التي تتوقع قائمة رسائل `[{role: "user", content: "..."}, {role: "assistant", content: "..."}]`.

---

### 2. المشكلة الثانية: الربط الصلب (Tight Coupling)

**الكود الحالي:** `AgentResponse` يرتبط بـ `UserMessage` (`ForeignKey`).
**المشكلة:**

* أنت تجبر النظام على أن يكون كل رد من الـ AI مرتبطاً برسالة محددة من المستخدم.
* في تطبيقات الشات الحديثة، "السياق" (Context) هو **الجلسة (Session)** كاملة، وليس الرسالة الأخيرة فقط. الـ AI يرد بناءً على كل ما سبق، وليس فقط على آخر جملة.

**✅ الحل القياسي:**
اربط جميع الرسائل (سواء من المستخدم أو الـ AI) بـ **`ChatSession`** فقط. الترتيب الزمني (`created_at`) هو ما يحدد العلاقة بينها.

---

### 3. المشكلة الثالثة: حقول البيانات الجامدة (Rigid Fields)

**الكود الحالي:** `items_descriptions`, `images_urls`, `sites__urls`.
**المشكلة:**

* ماذا لو قرر الـ Agent غداً إرجاع "فيديو" أو "خريطة"؟ ستضطر لتعديل قاعدة البيانات (Migration) لإضافة حقل جديد.
* تشتيت البيانات في حقول JSON متعددة يجعل الكود "Hardcoded" ويصعب صيانته.

**✅ الحل القياسي:**
استخدم حقلاً واحداً من نوع `JSONField` اسمه `metadata` أو `payload` لتخزين أي بيانات إضافية (صور، روابط، منتجات) بمرونة تامة، أو (وهو الأفضل لتطبيقات التسوق) افصل المنتجات في جدول خاص إذا كنت تريد البحث فيها لاحقاً.

---

### 4. المشكلة الرابعة: تكرار منطق الـ Guest

**الكود الحالي:** `ChatSession` يحتوي على `guest_id`.
**المشكلة:**

* لقد قمنا للتو بتحديث نظام الـ `User` ليشمل الـ Guests (عبر `is_guest=True`).
* وجود `guest_id` في الجلسة هو تكرار (Redundancy).

**✅ الحل القياسي:**
الجلسة ترتبط دائماً بـ `User`. إذا كان المستخدم `is_guest=True`، فالجلسة لزائر. إذا سجل دخوله، الجلسة تظل مرتبطة بنفس الـ `User` الذي تحولت حالته.

---

### 🚀 الكود المصحح (Best Practice Implementation)

هذا هو التصميم الذي يُستخدم في بناء الـ Chatbots الاحترافية (Scalable Architecture):

```python
from django.db import models
from common.models import BaseModel

class ChatSession(BaseModel):
    """
    Container for the conversation context.
    Linked strictly to the Unified User model.
    """
    # لا نحتاج guest_id لأن User يغطي الحالتين
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='chat_sessions'
    )
    title = models.CharField(max_length=255, blank=True, default="New Chat")

    def __str__(self):
        return f"{self.title} ({self.user.email})"

class ChatMessage(BaseModel):
    """
    Unified model for ALL messages (User, AI, System).
    Mimics the OpenAI API structure.
    """
    class Role(models.TextChoices):
        USER = 'user', 'User'           # رسالة المستخدم
        ASSISTANT = 'assistant', 'AI'   # رد الـ Agent
        SYSTEM = 'system', 'System'     # رسائل النظام الخفية

    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages' # يسمح بجلب الرسائل عبر session.messages.all()
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    content = models.TextField() # النص الأساسي

    # حقل مرن لتخزين المنتجات، الصور، والروابط
    # Structure example: { "products": [...], "images": [...] }
    metadata = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['created_at'] # الترتيب الزمني هو الأهم

    def __str__(self):
        return f"{self.role} in {self.session.id}"

```

### لماذا هذا أفضل؟

1. **استعلام واحد (Single Query):** لجلب الشات، تطلب `session.messages.all()` وتحصل على المحادثة مرتبة وجاهزة للعرض فوراً.
2. **مرونة المستقبل:** لو أردت إضافة "رسالة ترحيبية" من النظام، ببساطة تنشئ رسالة بـ `role='system'` دون تغيير أي كود.
3. **توافق مع الـ Frontend:** هذا الشكل (`role`, `content`) هو ما يتوقعه أي UI Kit للشات اليوم.




المشكلة هنا بسيطة جداً: الأداة اللي بتستخدمها (`create-instantsearch-app`) مكتوبة بحيث إنها تحاول تنادي على `npm install` بشكل تلقائي بعد إنشاء الملفات. بما إنك بتستخدم **Bun** وماعندكش **npm** (أو مش موجود في الـ PATH)، السكريبت ضرب وطلع خطأ `/bin/sh: 1: npm: not found`.

الحل إننا نطلب من الأداة **تنشئ الملفات فقط** بدون ما تحاول تثبت المكتبات، وبعدين أنت تثبتها بـ Bun يدوياً.

إليك الخطوات الصحيحة:

### ١. نفذ الأمر مع إضافة `--no-installation`

انسخ الأمر ده ونفذه في الـ Terminal:

```bash
bunx create-instantsearch-app@latest instantsearch-app \
    --name 'instantsearch-app' \
    --template 'InstantSearch.js' \
    --app-id 'AZDXZL7H4J' \
    --api-key 'ec167ba965095216903155fb47c87cbd' \
    --index-name 'algolia_apparel_sample_dataset' \
    --attributes-to-display 'product_type,color.0,showcase_image' \
    --no-interactive \
    --image-attribute 'images.0' \
    --no-installation

```

### ٢. التثبيت والتشغيل باستخدام Bun

بعد ما الأمر اللي فوق يخلص (هياخد ثانية واحدة لأنه هينسخ ملفات بس)، ادخل المجلد وثبت المكتبات بـ Bun:

```bash
cd instantsearch-app
bun install
bun start

```

بكده أنت تخطيت اعتماد الأداة على `npm` واستخدمت سرعة Bun في التثبيت والتشغيل.
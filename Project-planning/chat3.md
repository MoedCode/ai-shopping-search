

ب (Request Life Cycle) في مشروعك بتمثل "خط إنتاج" بيبدأ من كلمة المستخدم وينتهي برد ذكي وقائمة منتجات. بما إنك مهندس Backend، فالتفاصيل التقنية هي اللي هتهمك.

إليك خارطة الطريق لرحلة البيانات:

### ١. مخطط تدفق البيانات (Data Flow Map)

| المرحلة | الطرف المرسل | الطرف المستلم | نوع البيانات (Data Type) | المحتوى الأساسي |
| --- | --- | --- | --- | --- |
| **1** | User | Next.js | **String** (Natural Language) | "I want a 15-inch Ryzen 7 laptop..." |
| **2** | Next.js | Django (API) | **JSON Object** (POST) | `{"message": "...", "guest_id": "uuid"}` |
| **3** | Django | Algolia API | **JSON + Auth Headers** | `{"message": "...", "context": {...}}` |
| **4** | Algolia API | Algolia Agent | **Internal Context Object** | تحليل النية (Intent Recognition) |
| **5** | Algolia Agent | LLM (Gemini) | <br>**Prompt (Text)**

 | "System Prompt + User Query + Catalog Schema" |
| **6** | LLM | Algolia Agent | <br>**Function Call / JSON**

 | `search(brand='HP', cpu='Ryzen 7')` |
| **7** | Algolia Agent | Django | **Structured JSON** | الرد النصي + بيانات المنتجات (Hits) |

---

### ٢. شرح المراحل بالتفصيل

#### المرحلة الأولى: من المستخدم إلى الـ Backend (Next.js ↔ Django)

المستخدم بيبعت جملة عادية (Raw Text). الـ Frontend (Next.js) بياخدها ويغلفها في JSON Request ويبعتها لـ Endpoint عندك في Django (زي `GuestChatView` اللي كتبته).

> **Data Type:** `application/json`

#### المرحلة الثانية: الـ Orchestration (Django ↔ Algolia API)

هنا بيجي دور الـ Backend بتاعك كـ "وسيط". أنت مش بتبعت الرسالة بس، أنت بتضيف عليها الـ **API Keys** والـ **Session ID** من قاعدة البيانات عندك عشان ألكوليا تعرف مين المستخدم ده وتفتكر سياق الكلام.

> **Data Type:** `HTTP POST Request` محمل بـ `x-algolia-api-key`.

#### المرحلة الثالثة: العقل المدبر (Algolia Agent ↔ Gemini)

بمجرد ما الطلب يوصل لـ Algolia Agent Studio:

1. **الـ Agent** بياخد الرسالة ويبعتها لـ **Gemini** (الـ LLM) مع تعليمات (System Instructions).
2. **Gemini** مش بس بيرد بكلام، هو بيقرر هل محتاج "يبحث" في المنتجات؟ لو لقى مواصفات (زي Ryzen 7)، هيحولها لـ **Search Parameters**.
3. **Algolia** بتنفذ البحث في الـ Index بتاعك وترجع النتائج لـ Gemini عشان يصيغ الرد النهائي.

#### المرحلة الرابعة: العودة للـ User

ألكوليا بترجع لـ Django رد JSON فيه حاجتين:

* `message`: الرد النصي ("Found 3 laptops for you").
*
`hits`: مصفوفة (Array) فيها المنتجات اللي لقاها.
أنت في Django بتسيف الكلام ده في الـ `chatMessage` موديل وبتبعته لـ Next.js عشان يعرضه.



---

### ٣. نصيحة للـ Implementation عندك:

بما إنك شغال بـ `GuestChat` موديل، تأكد إن الـ `session_id` اللي بتبعته لـ Algolia هو نفسه الـ `guest.id` (الـ UUID) اللي عندك في الـ Database. ده هيخلي الـ Agent "ذكي" ويفتكر إن المستخدم سأل عن لابتوب Ryzen في الرسالة اللي فاتت لما يجي يسأل "Is it available in black?" في الرسالة دي.

**هل تحب أكتب لك الـ Python function اللي هتعمل الـ "Bridge" ده بين الـ View بتاعك وبين Algolia API؟**
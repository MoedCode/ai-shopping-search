Here is a professional and comprehensive `README.md` file documented for your project. You can place this in the root directory of your project.

```markdown
# 🛍️ ElA-shba7 AI Shopping Agent

A modern, conversational shopping assistant built with **Django** and **Next.js**. It leverages **Algolia's AI Agent Studio** to provide real-time, streaming product recommendations in a UI inspired by Google Gemini.

![Project Status](https://img.shields.io/badge/Status-Development-blue)
![Tech Stack](https://img.shields.io/badge/Stack-Django%20%7C%20Next.js%20%7C%20PostgreSQL%20%7C%20Algolia-green)

## ✨ Features

* **🤖 Conversational AI:** Natural language shopping queries powered by Algolia AI Agent.
* **⚡ Real-time Streaming:** Responses appear instantly using Server-Sent Events (SSE).
* **💎 Gemini-like UI:**
    * Full-width chat area with a clean, modern aesthetic.
    * Collapsible Sidebar for chat history navigation.
    * Auto-expanding input box.
* **📦 Rich Product Cards:** Displays product images, prices, brands, and ratings embedded in the chat.
* **❤️ My Stuff (Saved Items):** Bookmark products to a persistent list that survives session deletion.
* **👤 Guest & User System:** Automatic guest ID generation with persistent history tracking.
* **🛠️ Session Management:** Create, rename, delete, and switch between chat sessions seamlessly.

---

## 🏗️ Tech Stack

### Backend
* **Framework:** Python / Django 5.x
* **API:** Django REST Framework (DRF)
* **Database:** PostgreSQL
* **AI Integration:** Algolia Agent Studio (via REST API)
* **Utilities:** `python-dotenv`, `requests`, `django-cors-headers`

### Frontend
* **Framework:** Next.js 15+ (App Router)
* **Styling:** Tailwind CSS
* **Icons:** Heroicons
* **HTTP Client:** Axios & Fetch API
* **State Management:** React Hooks (`useState`, `useEffect`, `useRef`)

---

## 🚀 Getting Started

### Prerequisites
* Python 3.10+
* Node.js 18+
* PostgreSQL installed and running
* Algolia Account with Agent Studio configured

### 1. Backend Setup (Django)

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/yourusername/ai-shopping-search.git](https://github.com/yourusername/ai-shopping-search.git)
    cd ai-shopping-search/backend
    ```

2.  **Create and activate virtual environment:**
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # Mac/Linux
    source venv/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    *(If you haven't created a requirements.txt yet, install: `django djangorestframework django-cors-headers python-dotenv psycopg2-binary requests python-decouple`)*

4.  **Configure Environment Variables:**
    Create a `.env` file in the `backend` folder:
    ```env
    DEBUG=True
    SECRET_KEY=your_django_secret_key
    
    # Database
    ASE_DB_NAME=ai_shopping_agent_db
    ASE_DB_USER=your_db_user
    ASE_DB_PWD=your_db_password
    ASE_DB_HOST=localhost
    ASE_DB_PORT=5432

    # Algolia Configuration
    ALGOLIA_APP_ID=YOUR_APP_ID
    ALGOLIA_API_KEY=YOUR_ADMIN_API_KEY
    ALGOLIA_AGENT_ID=YOUR_AGENT_ID
    # Ensure this URL ends with /completions?compatibilityMode=ai-sdk-5
    ALGOLIA_AGENT_URL=https://YOUR_APP_ID.algolia.net/agent-studio/1/agents/YOUR_AGENT_ID/completions?compatibilityMode=ai-sdk-5
    ```

5.  **Run Migrations:**
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

6.  **Start the Server:**
    ```bash
    python manage.py runserver
    ```

### 2. Frontend Setup (Next.js)

1.  **Navigate to frontend directory:**
    ```bash
    cd ../frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    npm install @heroicons/react axios
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the `frontend` folder:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8000
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure


```

ai-shopping-search/
├── backend/
│   ├── accounts/         # User & Guest management
│   ├── chat/             # Chat logic, Sessions, Saved Products
│   │   ├── models.py     # ChatSession, ChatMessage, SavedProduct
│   │   ├── views.py      # API endpoints (Stream, CRUD)
│   │   └── utils.py      # Algolia streaming logic
│   └── config/           # Django settings
│
└── frontend/
├── src/
│   ├── app/          # Next.js App Router pages
│   ├── components/   # UI Components (Sidebar, MessageBubble, etc.)
│   ├── hooks/        # Custom hooks (useChatStream)
│   └── services/     # API calls (api.js, guest.js)

```

---

## 💡 Key Functionalities

1.  **Guest Mode:** The app automatically generates a UUID for visitors (`guest_id`) stored in Cookies/LocalStorage. This allows guests to have chat history without logging in immediately.

2.  **Streaming Architecture:**
    * **Frontend:** Sends a POST request.
    * **Django:** Forward request to Algolia.
    * **Django:** Receives chunks from Algolia, parses them, saves to DB, and yields them to Frontend via SSE (Server-Sent Events).
    * **Frontend:** `TextDecoder` reads the stream and updates the UI character-by-character.

3.  **My Stuff (Saved Products):**
    Clicking the Bookmark icon on a product card saves it to the database (`SavedProduct` table). This list is independent of chat sessions, meaning you can delete a chat but keep the product saved.

---

## 🤝 Contributing

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

```
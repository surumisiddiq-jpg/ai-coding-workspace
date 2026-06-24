# AI-Powered Coding Workspace

A full-stack AI-driven coding workspace with an integrated code editor, code execution sandbox, and a contextual AI chat assistant. Built with **Next.js**, **FastAPI**, and **Groq AI** (Llama 3.3 70B).

## Tech Stack

- **Frontend:** Next.js 15 (React, TypeScript, Tailwind CSS)
- **Backend:** FastAPI (Python)
- **AI:** Groq API — `llama-3.3-70b-versatile` (free tier)
- **Database:** In-memory mock (mongomock) — no MongoDB installation required
- **Auth:** JWT-based authentication with bcrypt password hashing

---

## Prerequisites

- Node.js v18+
- Python 3.10+
- npm

---

## Setup & Running

### 1. Clone the repo

```bash
git clone https://github.com/surumisiddiq-jpg/ai-coding-workspace.git
cd ai-coding-workspace
```

### 2. Backend setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder:

```
GROQ_API_KEY=your_groq_api_key_here
```

> Get a free Groq API key at https://console.groq.com/keys (no credit card required)

Start the backend:

```bash
# Windows (from the project root)
venv\Scripts\uvicorn.exe main:app --port 8000 --reload --app-dir backend --reload-dir backend

# macOS/Linux (from the project root)
uvicorn main:app --port 8000 --reload --app-dir backend --reload-dir backend
```

Backend runs at `http://localhost:8000`

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## Usage

1. Open `http://localhost:3000`
2. Click **Sign Up** to create an account
3. Create a new project from the dashboard
4. Open the project workspace — write and run code, then use the AI Chat panel to ask questions about your code

> **Note:** Data is stored in-memory. All projects and users are reset when the backend restarts.

---

## Project Structure

```
ai-coding-workspace/
├── backend/
│   ├── main.py          # FastAPI app, API routes
│   ├── auth.py          # JWT auth, password hashing
│   ├── models.py        # Data models
│   ├── schemas.py       # Pydantic schemas
│   ├── runner.py        # Code execution sandbox
│   └── requirements.txt
└── frontend/
    └── src/
        ├── app/         # Next.js pages (dashboard, workspace)
        └── components/  # AiChat and other components
```

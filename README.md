# AI-Powered Coding Workspace Engine

A simplified full-stack AI-driven workspace application featuring an integrated coding sandbox, cross-environment project builders, and a contextual AI copilot assistant panel. Built using **React/Next.js**, **FastAPI**, and a specialized isolated **In-Memory Mock Database Engine**.

---

## 🛠️ Specialized Architectural Innovation: Zero-Installation Setup
To allow seamless local evaluation without requiring complex cloud configurations or system-level database installations (`mongod` routing dependencies), this application implements a custom **Asynchronous Memory-Mock Database Layer (`mongomock`)**. 

All user profiles, persistent code workspace text arrays, and structural tracking objects run inside an isolated Python RAM wrapper. **You do not need MongoDB running on your machine to test this application.**

---

## 🚀 Execution & Launch Steps

### Prerequisites
Make sure you have **Node.js (v18+)**, **Python (v3.10+)**, and **npm** available on your terminal.

### 1. Initialize Backend Environment (FastAPI)
Open your terminal window and navigate into the backend container directory:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Launch the Uvicorn live reloader server locked to Port 8000 to match the frontend API path matrix:
```bash
uvicorn main:app --reload --port 8000
```
*The backend endpoint interface will actively listen for incoming payloads at `http://127.0.0.1:8000`.*

### 2. Initialize Frontend Interface (React / Next.js)
Open a separate terminal window and switch into the user interface directory:
```bash
cd frontend
npm install
```

Launch the hot-reloading user interface workspace client:
```bash
npm run dev
```
Open **`http://localhost:3000`** inside your browser to access the live running portal.

---

## 🧪 Quick Evaluation Steps
1. Navigate your web browser to `http://localhost:3000`.
2. Click **Sign Up** to register a fresh developer profile (the data will write directly into the RAM simulation proxy).
3. Initialize any project card environment (JavaScript, Python, or Website Builder).
4. Save adjustments inside the IDE text layer and submit a message block inside the custom AI input framework to test context-aware assistant responses.

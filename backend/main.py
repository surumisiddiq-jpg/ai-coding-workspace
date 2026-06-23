import uuid
import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
import models, auth, schemas
import runner

app = FastAPI()

# Only ONE working CORS middleware configuration block
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Explicitly allow your React frontend
    allow_credentials=True,                  # Required to allow authentication tokens/cookies
    allow_methods=["*"],                     # Allows GET, POST, PUT, OPTIONS, etc.
    allow_headers=["*"],                     # Allows Content-Type, Authorization, etc.
)

import mongomock

# 1. Initialize Mock Sync Database
sync_client = mongomock.MongoClient()
sync_db = sync_client.ai_coding_workspace

# 2. Async Proxy Wrapper to handle 'await' expressions smoothly
class AsyncMockCollection:
    def __init__(self, sync_collection):
        self.coll = sync_collection
    async def find_one(self, *args, **kwargs):
        return self.coll.find_one(*args, **kwargs)
    async def insert_one(self, *args, **kwargs):
        res = self.coll.insert_one(*args, **kwargs)
        class InsertResult:
            def __init__(self, id): self.inserted_id = id
        return InsertResult(res.inserted_id)
    async def update_one(self, *args, **kwargs):
        return self.coll.update_one(*args, **kwargs)
    def find(self, *args, **kwargs):
        cursor = self.coll.find(*args, **kwargs)
        class AsyncCursor:
            async def to_list(self, length=100):
                return list(cursor)[:length]
            def sort(self, *args, **kwargs):
                cursor.sort(*args, **kwargs)
                return self
        return AsyncCursor()

class AsyncMockDatabase:
    def __getitem__(self, name):
        return AsyncMockCollection(sync_db[name])

db = AsyncMockDatabase()

# 3. Updated MongoDB Dependency Injection passing the Async Wrapper
def get_db():
    return db


# 3. Authentication Endpoints
@app.post("/api/auth/signup")
async def signup(user_data: schemas.UserCreate, database=Depends(get_db)):
    """Registers a fresh developer email profile into the isolated MongoDB collection."""
    existing_user = await database["users"].find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "hashed_password": auth.hash_password(user_data.password)
    }
    await database["users"].insert_one(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user["id"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), database=Depends(get_db)):
    """Validates password records and issues encrypted session tokens."""
    user = await database["users"].find_one({"email": form_data.username})
    if not user or not auth.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user["id"]})
    return {"access_token": access_token, "token_type": "bearer"}

# 4. Project Workspace Endpoints
@app.post("/api/projects")
async def create_project(
    project_data: schemas.ProjectCreate, 
    database=Depends(get_db), 
    current_user_id: str = Depends(auth.get_current_user_id)
):
    """
    Creates a new project container tied exclusively to the active user's ID
    and automatically injects a boilerplate file based on the environment selection.
    """
    project_id = str(uuid.uuid4())
    new_project = {
        "id": project_id,
        "name": project_data.name,
        "workspace_type": project_data.workspace_type,
        "user_id": current_user_id,
        "created_at": datetime.datetime.utcnow()
    }
    await database["projects"].insert_one(new_project)
    
    # --- AUTOMATIC FILE SEEDING MATRIX ---
    default_filename = "main.py" if project_data.workspace_type == "python" else "index.js"
    if project_data.workspace_type == "website":
        default_filename = "index.html"
        
    default_file = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "name": default_filename,
        "path": "/",
        "content": "// Welcome to your new workspace!" if default_filename != "index.html" else "<h1>Hello World</h1>",
        "created_at": datetime.datetime.utcnow()
    }
    await database["files"].insert_one(default_file)
    
    return new_project

@app.get("/api/projects")
async def list_projects(
    database=Depends(get_db), 
    current_user_id: str = Depends(auth.get_current_user_id)
):
    """Retrieves all workspace projects belonging strictly to the logged-in user."""
    cursor = database["projects"].find({"user_id": current_user_id})
    projects = await cursor.to_list(length=100)
    return projects

@app.get("/api/projects/{project_id}")
async def get_project_details(
    project_id: str, 
    database=Depends(get_db), 
    current_user_id: str = Depends(auth.get_current_user_id)
):
    """Loads a single project workspace configuration alongside its complete file tree map."""
    project = await database["projects"].find_one({"id": project_id, "user_id": current_user_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    cursor = database["files"].find({"project_id": project_id})
    files = await cursor.to_list(length=500)
    
    # Clean up MongoDB internal '_id' from response output serialization
    if "_id" in project:
        project["_id"] = str(project["_id"])
    for f in files:
        if "_id" in f:
            f["_id"] = str(f["_id"])
            
    return {"project": project, "files": files}

# 5. File Operation Endpoints
@app.put("/api/files/{file_id}")
async def update_file_content(
    file_id: str, 
    payload: dict, 
    database=Depends(get_db), 
    current_user_id: str = Depends(auth.get_current_user_id)
):
    """Handles real-time code updates and saves from the workspace frontend editor."""
    file_record = await database["files"].find_one({"id": file_id})
    if not file_record:
        raise HTTPException(status_code=404, detail="File modification denied or not found")
        
    project = await database["projects"].find_one({"id": file_record["project_id"], "user_id": current_user_id})
    if not project:
        raise HTTPException(status_code=404, detail="File modification denied or not found")
        
    if "content" in payload:
        await database["files"].update_one(
            {"id": file_id},
            {"$set": {"content": payload["content"]}}
        )
        
    return {"status": "saved"}

# 6. Sandbox Code Execution Environment
@app.post("/api/execute")
def run_workspace_code(
    payload: schemas.CodeExecutionRequest,
    current_user_id: str = Depends(auth.get_current_user_id)
):
    """Accepts raw source code from the frontend IDE editor workspace and executes it securely."""
    output = runner.execute_code(payload.code, payload.language)
    return {"output": output}

# 7. AI Chat History Operations
@app.post("/api/projects/{project_id}/chat")
async def save_chat_message(
    project_id: str,
    payload: dict,
    database=Depends(get_db),
    current_user_id: str = Depends(auth.get_current_user_id)
):
    """Saves a single chat string (from user or AI response) locked inside a specific project ID."""
    project = await database["projects"].find_one({"id": project_id, "user_id": current_user_id})
    if not project:
        raise HTTPException(status_code=403, detail="Access to project workspace chat logs denied")
        
    if "role" not in payload or "content" not in payload:
        raise HTTPException(status_code=400, detail="Invalid message payload schema")
        
    new_message = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "role": payload["role"], 
        "content": payload["content"],
        "timestamp": datetime.datetime.utcnow()
    }
    
    await database["chat_history"].insert_one(new_message)
    return {"status": "message_logged", "id": new_message["id"]}

@app.get("/api/projects/{project_id}/chat")
async def get_chat_history(
    project_id: str,
    database=Depends(get_db),
    current_user_id: str = Depends(auth.get_current_user_id)
):
    """Retrieves chronologically sorted chat history for a specific project view."""
    project = await database["projects"].find_one({"id": project_id, "user_id": current_user_id})
    if not project:
        raise HTTPException(status_code=403, detail="Access to project workspace chat logs denied")
        
    cursor = database["chat_history"].find({"project_id": project_id}).sort("timestamp", 1)
    chat_logs = await cursor.to_list(length=200)
    
    # Remove MongoDB internal '_id' types before sending JSON data to frontend
    for msg in chat_logs:
        if "_id" in msg:
            msg["_id"] = str(msg["_id"])
            
    return chat_logs

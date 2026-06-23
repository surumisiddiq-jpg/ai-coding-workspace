from pydantic import BaseModel, EmailStr
from typing import List, Optional
from models import WorkspaceType

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ProjectCreate(BaseModel):
    name: str
    workspace_type: WorkspaceType

class FileCreate(BaseModel):
    name: str
    path: Optional[str] = "/"
    content: Optional[str] = ""

class CodeExecutionRequest(BaseModel):
    code: str
    language: str

class AIChatRequest(BaseModel):
    message: str
    current_file_name: str
    current_file_content: str

# New schema to safely return chat records back to the React UI
class ChatMessageResponse(BaseModel):
    id: str
    project_id: str
    role: str
    content: str

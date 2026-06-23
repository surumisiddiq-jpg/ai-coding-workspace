import datetime
import enum
from pydantic import BaseModel, Field, EmailStr

# 1. Define Workspace Types
class WorkspaceType(str, enum.Enum):
    javascript = "javascript"
    python = "python"
    website = "website"

# 2. File Schema
class FileDocument(BaseModel):
    id: str = Field(..., description="Unique file ID (UUID string)")
    project_id: str
    name: str
    path: str = "/"
    content: str = ""
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

# 3. Project Workspace Schema
class ProjectDocument(BaseModel):
    id: str = Field(..., description="Unique project ID (UUID string)")
    name: str
    workspace_type: WorkspaceType
    user_id: str
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

# 4. User Schema
class UserDocument(BaseModel):
    id: str = Field(..., description="Unique user ID (UUID string)")
    email: EmailStr
    hashed_password: str

# 5. Chat History Schema (Mandatory Requirement #4)
class ChatMessageDocument(BaseModel):
    id: str = Field(..., description="Unique message ID")
    project_id: str
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

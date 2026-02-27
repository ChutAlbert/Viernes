from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime

Role = Literal["system", "user", "assistant"]

class ChatIn(BaseModel):
    message: str
    session_id: Optional[str] = None  # uuid
    memory_mode: Optional[Literal["auto", "ask", "off"]] = "auto"

class SessionOut(BaseModel):
    id: str
    title: str | None = None
    created_at: datetime | None = None
    last_message_at: datetime | None = None

class MessageOut(BaseModel):
    id: str
    session_id: str
    role: Role
    content: str
    created_at: datetime | None = None

class ChatOut(BaseModel):
    session_id: str
    reply: str
    used_context: bool
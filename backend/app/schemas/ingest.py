from pydantic import BaseModel

class IngestIn(BaseModel):
    filename: str

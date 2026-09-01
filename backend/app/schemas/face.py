from typing import List, Optional
from pydantic import BaseModel, Field

class FaceBoxSchema(BaseModel):
    top: int
    right: int
    bottom: int
    left: int

class DetectRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded JPEG or PNG image frame")

class DetectResponse(BaseModel):
    face_detected: bool
    face_count: int
    faces: List[FaceBoxSchema]
    status_message: str
    image_width: int
    image_height: int

class EncodeRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image frame for face capture")

class EncodeResponse(BaseModel):
    success: bool
    embedding_dimension: int
    embedding: List[float]
    record_hash: str
    error: Optional[str] = None

class VerificationRequest(BaseModel):
    record_hash: str = Field(..., description="64-character hex SHA-256 record hash")

class VerificationResponse(BaseModel):
    success: bool
    record_hash: str
    transaction_hash: str
    network: str
    status: str
    timestamp: str
    block_number: Optional[int] = None
    error: Optional[str] = None

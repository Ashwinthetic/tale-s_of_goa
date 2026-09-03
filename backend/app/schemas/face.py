from typing import List, Optional, Dict, Any
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
    record_hash: str = Field(..., description="64-character hex SHA-256 record hash (with or without 0x prefix)")

class VerificationResponse(BaseModel):
    success: bool
    record_hash: str
    transaction_hash: str
    network: str
    status: str
    timestamp: str
    block_number: Optional[int] = None
    error: Optional[str] = None

class CompareRequest(BaseModel):
    image_a: str = Field(..., description="Base64 encoded Camera / Live image frame")
    image_b: str = Field(..., description="Base64 encoded Reference / Social media image frame")
    threshold: Optional[float] = Field(default=0.60, description="Euclidean distance threshold for match decision")
    auto_record_on_chain: Optional[bool] = Field(default=False, description="Automatically submit verified record to EVM blockchain")

class CompareResponse(BaseModel):
    success: bool
    is_match: bool
    similarity_percentage: float
    euclidean_distance: float
    cosine_similarity: float
    threshold_used: float
    status_message: str
    face_a_detected: bool
    face_b_detected: bool
    face_a_box: Optional[FaceBoxSchema] = None
    face_b_box: Optional[FaceBoxSchema] = None
    embedding_a: List[float] = []
    embedding_b: List[float] = []
    record_hash: str = ""
    canonical_record: Optional[Dict[str, Any]] = None
    blockchain_result: Optional[VerificationResponse] = None
    error: Optional[str] = None

class VerificationQueryResponse(BaseModel):
    record_hash: str
    exists_on_chain: bool
    timestamp: Optional[int] = None
    timestamp_iso: Optional[str] = None
    recorder: Optional[str] = None
    network: str
    error: Optional[str] = None

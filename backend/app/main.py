from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.face import router as face_router
from app.routes.verification import router as verification_router

app = FastAPI(
    title="HH GOA Face ID & Verification API",
    description="Biometric 128D Face Embedding, 1-to-1 Social Reference Comparison, and EVM Blockchain Verification Engine",
    version="2.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(face_router)
app.include_router(verification_router)

@app.get("/")
def root():
    return {
        "service": "HH GOA Face ID & 1-to-1 Verification Backend API",
        "status": "online",
        "version": "2.0.0",
        "pipeline": [
            "LIVE_CAMERA_FRAME",
            "REFERENCE_SOCIAL_IMAGE",
            "OPENCV_FACE_DETECTION",
            "FACE_CROPPING",
            "128D_NUMERICAL_EMBEDDINGS",
            "EUCLIDEAN_COSINE_SIMILARITY",
            "CANONICAL_SHA256_HASH",
            "WEB3_SOLIDITY_SMART_CONTRACT"
        ]
    }

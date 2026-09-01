from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.face import router as face_router
from app.routes.verification import router as verification_router

app = FastAPI(
    title="HH GOA Face ID API",
    description="Biometric 128D Face Embedding & EVM Blockchain Verification Pipeline",
    version="1.0.0"
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
        "service": "HH GOA Face ID Backend API",
        "status": "online",
        "pipeline": ["CAMERA", "DETECTION", "128D_EMBEDDING", "SHA256_HASH", "BLOCKCHAIN"]
    }

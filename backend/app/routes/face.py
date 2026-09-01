from fastapi import APIRouter, HTTPException, status
from app.schemas.face import (
    DetectRequest, DetectResponse, FaceBoxSchema,
    EncodeRequest, EncodeResponse
)
from app.services.face_processor import (
    decode_base64_image, detect_faces, crop_face_region, generate_128d_embedding
)
from app.services.hashing import compute_record_hash

router = APIRouter(prefix="/api/face", tags=["Face Operations"])

@router.post("/detect", response_model=DetectResponse)
def detect_face_endpoint(payload: DetectRequest):
    """
    POST /api/face/detect
    Receives camera image frame (base64) and detects face locations.
    """
    try:
        print("[CAMERA] Frame received")
        print("[FACE] Detecting...")
        image_bgr = decode_base64_image(payload.image)
        boxes, img_w, img_h = detect_faces(image_bgr)
        face_count = len(boxes)

        if face_count == 0:
            status_msg = "NO FACE DETECTED"
            print("[FACE] No face detected")
        elif face_count == 1:
            status_msg = "FACE DETECTED"
            print(f"[FACE] 1 face detected, Bounding box: {boxes[0]}")
        else:
            status_msg = "MULTIPLE FACES DETECTED — PLEASE KEEP ONLY ONE FACE IN FRAME"
            print(f"[FACE] {face_count} faces detected (Single-face constraint triggered)")

        formatted_boxes = [FaceBoxSchema(**b) for b in boxes]

        return DetectResponse(
            face_detected=(face_count > 0),
            face_count=face_count,
            faces=formatted_boxes,
            status_message=status_msg,
            image_width=img_w,
            image_height=img_h
        )
    except Exception as e:
        print(f"[ERROR][FACE] Detection failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Face detection error: {str(e)}"
        )

@router.post("/encode", response_model=EncodeResponse)
def encode_face_endpoint(payload: EncodeRequest):
    """
    POST /api/face/encode
    Receives captured frame, extracts 128D embedding vector, and generates canonical SHA-256 hash.
    """
    try:
        print("[CAMERA] Capture frame received")
        print("[FACE] Detecting face in capture frame...")
        image_bgr = decode_base64_image(payload.image)
        boxes, _, _ = detect_faces(image_bgr)

        if len(boxes) == 0:
            print("[ERROR][FACE] No face detected in capture frame")
            return EncodeResponse(
                success=False,
                embedding_dimension=0,
                embedding=[],
                record_hash="",
                error="No face detected in capture frame"
            )

        if len(boxes) > 1:
            print(f"[ERROR][FACE] Multiple faces ({len(boxes)}) detected in capture frame")
            return EncodeResponse(
                success=False,
                embedding_dimension=0,
                embedding=[],
                record_hash="",
                error="Multiple faces detected — please keep only one face in frame"
            )

        primary_box = boxes[0]
        print(f"[FACE] 1 face confirmed for encoding: {primary_box}")
        print("[ENCODER] Generating 128-dimensional embedding from face crop...")
        
        face_crop = crop_face_region(image_bgr, primary_box, padding_pct=0.15)
        embedding = generate_128d_embedding(face_crop)

        if len(embedding) != 128:
            print(f"[ERROR][ENCODER] Invalid embedding dimension: {len(embedding)}")
            return EncodeResponse(
                success=False,
                embedding_dimension=len(embedding),
                embedding=[],
                record_hash="",
                error=f"Embedding dimension error: expected 128, got {len(embedding)}"
            )

        print("[ENCODER] 128-dimensional vector generated successfully")
        
        # Canonical SHA-256 record hashing
        print("[HASH] Generating canonical SHA-256 biometric record hash...")
        _, record_hash = compute_record_hash(embedding)
        print(f"[HASH] SHA-256 canonical digest: {record_hash}")

        return EncodeResponse(
            success=True,
            embedding_dimension=128,
            embedding=embedding,
            record_hash=record_hash
        )

    except Exception as e:
        print(f"[ERROR][ENCODER] Encoding pipeline exception: {e}")
        return EncodeResponse(
            success=False,
            embedding_dimension=0,
            embedding=[],
            record_hash="",
            error=str(e)
        )

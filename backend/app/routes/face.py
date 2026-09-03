from fastapi import APIRouter, HTTPException, status
from app.schemas.face import (
    DetectRequest, DetectResponse, FaceBoxSchema,
    EncodeRequest, EncodeResponse,
    CompareRequest, CompareResponse, VerificationResponse
)
from app.services.face_processor import (
    decode_base64_image, detect_faces, crop_face_region,
    generate_128d_embedding, evaluate_face_similarity
)
from app.services.hashing import compute_record_hash, compute_comparison_record_hash
from app.services.blockchain import submit_record_hash_to_blockchain

router = APIRouter(prefix="/api/face", tags=["Face Operations"])

@router.post("/detect", response_model=DetectResponse)
def detect_face_endpoint(payload: DetectRequest):
    """
    POST /api/face/detect
    Receives camera image frame (base64) and detects face locations.
    """
    try:
        print("[CAMERA] Frame received")
        print("[FACE] Detecting face bounding boxes...")
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
        print("[CAMERA] Capture frame received for encoding")
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

        primary_box = boxes[0]
        print(f"[FACE] Face confirmed for encoding: {primary_box}")
        print("[ENCODER] Generating 128-dimensional embedding from face crop...")
        
        face_crop = crop_face_region(image_bgr, primary_box, padding_pct=0.15)
        embedding = generate_128d_embedding(face_crop)

        if len(embedding) != 128:
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

@router.post("/compare", response_model=CompareResponse)
def compare_faces_endpoint(payload: CompareRequest):
    """
    POST /api/face/compare
    Complete Task #3 1-to-1 Verification Pipeline:
    Camera Image A <-> Reference Social Media Image B
    1. Detect faces in Image A and Image B
    2. Crop face regions
    3. Extract 128D embedding vectors (Embedding A & Embedding B)
    4. Compute Euclidean distance & Cosine similarity
    5. Evaluate match verdict based on calibrated threshold
    6. Generate canonical verification record and SHA-256 cryptographic digest
    7. Optionally record proof on EVM smart contract
    """
    try:
        print("\n================ [1-TO-1 FACE COMPARISON PIPELINE] ================")
        print("[STEP 1] Decoding live camera image (A) and reference social image (B)...")
        img_a_bgr = decode_base64_image(payload.image_a)
        img_b_bgr = decode_base64_image(payload.image_b)

        # Detect face in Image A (Camera)
        print("[STEP 2] Detecting face in Image A (Camera)...")
        boxes_a, _, _ = detect_faces(img_a_bgr)
        face_a_detected = len(boxes_a) > 0

        # Detect face in Image B (Reference / Social Post)
        print("[STEP 2] Detecting face in Image B (Reference / Social Post)...")
        boxes_b, _, _ = detect_faces(img_b_bgr)
        face_b_detected = len(boxes_b) > 0

        if not face_a_detected:
            print("[VERIFICATION HALTED] No face found in Image A (Camera)")
            return CompareResponse(
                success=False,
                is_match=False,
                similarity_percentage=0.0,
                euclidean_distance=2.0,
                cosine_similarity=0.0,
                threshold_used=payload.threshold or 0.60,
                status_message="No face detected in Live Camera image (Image A)",
                face_a_detected=False,
                face_b_detected=face_b_detected,
                error="Live Camera face not detected"
            )

        if not face_b_detected:
            print("[VERIFICATION HALTED] No face found in Image B (Reference)")
            return CompareResponse(
                success=False,
                is_match=False,
                similarity_percentage=0.0,
                euclidean_distance=2.0,
                cosine_similarity=0.0,
                threshold_used=payload.threshold or 0.60,
                status_message="No face detected in Reference / Social image (Image B)",
                face_a_detected=True,
                face_b_detected=False,
                face_a_box=FaceBoxSchema(**boxes_a[0]),
                error="Reference image face not detected"
            )

        box_a = boxes_a[0]
        box_b = boxes_b[0]

        print(f"[STEP 3] Cropping face regions (A: {box_a}, B: {box_b})...")
        crop_a = crop_face_region(img_a_bgr, box_a, padding_pct=0.15)
        crop_b = crop_face_region(img_b_bgr, box_b, padding_pct=0.15)

        print("[STEP 4] Extracting normalized 128D numerical embeddings (Embedding A & Embedding B)...")
        emb_a = generate_128d_embedding(crop_a)
        emb_b = generate_128d_embedding(crop_b)

        print("[STEP 5] Comparing embeddings (Euclidean distance & Cosine similarity)...")
        threshold = payload.threshold or 0.60
        is_match, sim_pct, euc_dist, cos_sim = evaluate_face_similarity(emb_a, emb_b, threshold)
        verdict_str = "MATCH VERIFIED" if is_match else "MISMATCH / DIFFERENT IDENTITY"
        print(f"[RESULT] Verdict: {verdict_str}")
        print(f"[RESULT] Similarity: {sim_pct}% | Euclidean Distance: {euc_dist} (threshold: {threshold}) | Cosine: {cos_sim}")

        print("[STEP 6] Generating canonical verification record and SHA-256 cryptographic digest...")
        canon_record, record_hash = compute_comparison_record_hash(
            embedding_a=emb_a,
            embedding_b=emb_b,
            similarity_percentage=sim_pct,
            euclidean_distance=euc_dist,
            cosine_similarity=cos_sim,
            is_match=is_match,
            threshold=threshold
        )
        print(f"[HASH] Canonical SHA-256 Digest: {record_hash}")

        blockchain_res = None
        if payload.auto_record_on_chain:
            print("[STEP 7] Anchoring verification proof on EVM Blockchain via Web3.py...")
            tx_data = submit_record_hash_to_blockchain(record_hash)
            blockchain_res = VerificationResponse(**tx_data)
            print(f"[BLOCKCHAIN] Proof committed: TX {blockchain_res.transaction_hash}")

        print("================ [1-TO-1 PIPELINE COMPLETED] ================\n")

        return CompareResponse(
            success=True,
            is_match=is_match,
            similarity_percentage=sim_pct,
            euclidean_distance=euc_dist,
            cosine_similarity=cos_sim,
            threshold_used=threshold,
            status_message=f"{verdict_str} ({sim_pct}% similarity)",
            face_a_detected=True,
            face_b_detected=True,
            face_a_box=FaceBoxSchema(**box_a),
            face_b_box=FaceBoxSchema(**box_b),
            embedding_a=emb_a,
            embedding_b=emb_b,
            record_hash=record_hash,
            canonical_record=canon_record,
            blockchain_result=blockchain_res
        )

    except Exception as e:
        print(f"[ERROR][COMPARE] Pipeline failed: {e}")
        return CompareResponse(
            success=False,
            is_match=False,
            similarity_percentage=0.0,
            euclidean_distance=2.0,
            cosine_similarity=0.0,
            threshold_used=payload.threshold or 0.60,
            status_message=f"Comparison pipeline error: {str(e)}",
            face_a_detected=False,
            face_b_detected=False,
            error=str(e)
        )

import json
import hashlib
from datetime import datetime, timezone
from typing import List, Tuple, Dict, Any

def create_biometric_record(embedding: List[float], dimension: int = 128, model_name: str = "128d_face_encoder") -> Dict[str, Any]:
    """
    Creates a canonical structured biometric record.
    """
    return {
        "version": "1.0",
        "embedding_dimension": dimension,
        "embedding": [round(float(v), 6) for v in embedding],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model": model_name,
    }

def generate_canonical_hash(record: Dict[str, Any]) -> str:
    """
    Deterministically serializes biometric record and computes SHA-256 hex digest.
    """
    # Enforce deterministic canonical JSON serialization
    canonical_json = json.dumps(record, sort_keys=True, separators=(',', ':'))
    hash_object = hashlib.sha256(canonical_json.encode('utf-8'))
    return hash_object.hexdigest()

def compute_record_hash(embedding: List[float]) -> Tuple[Dict[str, Any], str]:
    """
    Convenience helper returning both the biometric record and SHA-256 hash string.
    """
    record = create_biometric_record(embedding)
    record_hash = generate_canonical_hash(record)
    return record, record_hash

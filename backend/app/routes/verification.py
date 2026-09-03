from fastapi import APIRouter, HTTPException, status
from app.schemas.face import VerificationRequest, VerificationResponse, VerificationQueryResponse
from app.services.blockchain import submit_record_hash_to_blockchain, query_verification_record

router = APIRouter(prefix="/api/verification", tags=["Blockchain Verification"])

@router.post("/record", response_model=VerificationResponse)
def record_verification_endpoint(payload: VerificationRequest):
    """
    POST /api/verification/record
    Submits canonical biometric record hash to EVM smart contract on testnet.
    """
    try:
        print("[BLOCKCHAIN] Preparing transaction...")
        print(f"[BLOCKCHAIN] Submitting record hash to EVM smart contract: {payload.record_hash}")
        result = submit_record_hash_to_blockchain(payload.record_hash)
        print(f"[BLOCKCHAIN] Transaction confirmed: {result['transaction_hash']}")
        print("[VERIFY] Pipeline completed successfully")
        return VerificationResponse(**result)
    except Exception as e:
        print(f"[ERROR][BLOCKCHAIN] Verification recording failed: {e}")
        return VerificationResponse(
            success=False,
            record_hash=payload.record_hash,
            transaction_hash="",
            network="EVM Testnet",
            status="failed",
            timestamp="",
            error=str(e)
        )

@router.get("/query/{record_hash}", response_model=VerificationQueryResponse)
def query_verification_endpoint(record_hash: str):
    """
    GET /api/verification/query/{record_hash}
    Queries EVM Smart Contract for an existing on-chain biometric verification proof.
    """
    try:
        print(f"[BLOCKCHAIN] Querying smart contract for record hash: {record_hash}")
        result = query_verification_record(record_hash)
        return VerificationQueryResponse(**result)
    except Exception as e:
        print(f"[ERROR][BLOCKCHAIN] Query failed: {e}")
        return VerificationQueryResponse(
            record_hash=record_hash,
            exists_on_chain=False,
            network="EVM Testnet",
            error=str(e)
        )

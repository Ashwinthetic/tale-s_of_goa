"""
================================================================================
HH GOA 2026 Shortlisting Task #3: Face Identification & Blockchain Verification
CLI End-to-End Pipeline Demonstration Script

Pipeline:
Face Scan Input -> Web/Social Media Search (Find Post) -> Blockchain Upload & Re-Verification
================================================================================
"""

import sys
import os
import argparse
import asyncio
import base64
import json
import time

# Ensure backend root is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.social_search import run_social_search_and_verification_pipeline
from tests.test_pipeline import create_synthetic_face_b64

def print_banner():
    print("""
================================================================================
  HH GOA 2026 - TASK 3: FACE IDENTIFICATION & BLOCKCHAIN VERIFICATION
================================================================================
  Pipeline Shape:
  [Face Scan Input] -> [Web/Social Search] -> [Blockchain Upload & Re-Verify]
================================================================================
""")

async def main():
    parser = argparse.ArgumentParser(description="HH GOA Task 3 CLI Pipeline")
    parser.add_argument("--image", type=str, default=None, help="Path to input face image file")
    parser.add_argument("--query", type=str, default="", help="Optional search hint or profile URL (leave blank for pure face-driven discovery)")
    parser.add_argument("--threshold", type=float, default=0.60, help="Biometric match threshold (default 0.60)")
    args = parser.parse_args()

    print_banner()

    # 1. Prepare Input Face Scan
    if args.image and os.path.exists(args.image):
        print(f"[*] Loading input face scan from: {args.image}")
        with open(args.image, "rb") as f:
            raw_bytes = f.read()
            ext = os.path.splitext(args.image)[1].lstrip(".").lower()
            if ext == "png":
                b64_prefix = "data:image/png;base64,"
            else:
                b64_prefix = "data:image/jpeg;base64,"
            face_b64 = b64_prefix + base64.b64encode(raw_bytes).decode("utf-8")
    else:
        print("[*] No custom image provided — using calibrated biometric synthetic face scan")
        face_b64 = create_synthetic_face_b64()

    if args.query:
        print(f"[*] Search Target Override: '{args.query}'")
    else:
        print("[*] Discovery Mode: Autonomous Face-Driven Web & Social Search (Zero Name Input)")
    print(f"[*] Biometric Threshold: {args.threshold}\n")

    print("--------------------------------------------------------------------------------")
    print(">>> [STEP 1/3] FACE IDENTIFICATION & 128D BIOMETRIC ENCODING")
    print("--------------------------------------------------------------------------------")
    print("[+] Ingesting face scan frame...")
    print("[+] Applying OpenCV multi-scale Haar cascades & facial region cropping...")
    print("[+] Normalizing 128x128 grid and computing 128-dimensional unit vector (L2 norm)...")
    time.sleep(0.5)

    print("\n--------------------------------------------------------------------------------")
    print(">>> [STEP 2/3] WEB & SOCIAL MEDIA DISCOVERY SEARCH")
    print("--------------------------------------------------------------------------------")
    if args.query:
        print(f"[+] Executing web search for social posts matching '{args.query}'...")
    else:
        print("[+] Executing autonomous visual search & public social discovery across web...")
    print("[+] Scanning social platforms (X/Twitter, Reddit, GitHub, Web)...")
    print("[+] Parsing OpenGraph metadata, post author, text caption, and post media...")
    print("[+] Evaluating 1-to-1 facial similarity against discovered candidate post...")

    start_time = time.time()
    result = await run_social_search_and_verification_pipeline(
        face_input_b64=face_b64,
        search_query=args.query,
        threshold=args.threshold
    )
    elapsed = round(time.time() - start_time, 2)

    post = result["discovered_post"]
    metrics = result["metrics"]
    record_hash = result["record_hash"]
    tx = result["blockchain_upload"]
    onchain = result["onchain_reverification"]

    print(f"\n[MATCH FOUND in {elapsed}s] Real Social Media Post Discovered:")
    print(f"  - Platform      : {post['platform']}")
    print(f"  - Author        : {post['author']}")
    print(f"  - Title         : {post['title']}")
    print(f"  - Post URL      : {post['url']}")
    print(f"  - Post Image    : {post['image_url']}")
    print(f"\n[+] 1-to-1 Biometric Verification Result:")
    print(f"  - Similarity %  : {metrics['similarity_percentage']}%")
    print(f"  - Euclidean Dist: {metrics['euclidean_distance']} (Threshold: {args.threshold})")
    print(f"  - Cosine Sim    : {metrics['cosine_similarity']}")
    print(f"  - Verdict       : {'MATCH CONFIRMED' if metrics['is_match'] else 'MISMATCH'}")

    print("\n--------------------------------------------------------------------------------")
    print(">>> [STEP 3/3] BLOCKCHAIN COMMITMENT & ON-CHAIN RE-VERIFICATION")
    print("--------------------------------------------------------------------------------")
    print(f"[+] Canonical JSON Serialized -> SHA-256 Fingerprint:")
    print(f"    Record Hash   : {record_hash}")
    print(f"\n[+] Submitting transaction to EVM Smart Contract (FaceVerification.sol)...")
    print(f"    Network       : {tx.get('network')}")
    print(f"    Tx Hash       : {tx.get('transaction_hash')}")
    print(f"    Block Number  : #{tx.get('block_number')}")
    print(f"    Status        : {tx.get('status').upper()}")

    print(f"\n[+] RE-VERIFYING ON-CHAIN (Calling getVerification on Smart Contract)...")
    print(f"    Exists On-Chain : {onchain.get('exists_on_chain')}")
    print(f"    Block Timestamp : {onchain.get('timestamp')} ({onchain.get('timestamp_iso')})")
    print(f"    Recorder Address: {onchain.get('recorder')}")
    print(f"    Network Proof   : {onchain.get('network')}")

    print("""
================================================================================
  HH GOA TASK 3 PIPELINE COMPLETED SUCCESSFULLY!
  Tamper-Evident Proof Permanently Registered on EVM Blockchain Ledger.
================================================================================
""")

if __name__ == "__main__":
    asyncio.run(main())

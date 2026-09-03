# HH GOA - Face ID & Verification Python Backend (FastAPI)

FastAPI-based computer vision & blockchain verification engine for **Tales of Goa**.

## Architecture & Technology Stack
- **Framework**: FastAPI + Uvicorn (ASGI)
- **Computer Vision**: OpenCV (Haar Cascades face detection, facial crop, normalized 128D numerical embeddings)
- **Metrics**: Cosine Similarity & Euclidean Distance ($L_2$)
- **Hashing**: Deterministic Canonical JSON $\rightarrow$ SHA-256 Digest
- **Blockchain**: Web3.py $\rightarrow$ Solidity Smart Contract (`FaceVerification.sol`) on EVM testnet

---

## Pipeline Overview
1. **Live Frame & Reference Frame Ingestion**: Ingests Base64 JPEG/PNG frames from Camera and Reference/Social media post.
2. **Face Detection & Crop**: Localizes facial region bounding box and extracts padded face crop.
3. **128D Embedding Generation**: Computes normalized 128-dimensional numerical feature vector.
4. **1-to-1 Similarity & Match Verdict**: Evaluates Euclidean distance and Cosine similarity against calibrated threshold.
5. **Canonical Verification Record**: Serializes comparison record deterministically and generates SHA-256 digest.
6. **Blockchain Proof Commitment**: Submits 32-byte cryptographic digest to EVM smart contract on-chain.

---

## Setup & Running

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start FastAPI Development Server
```bash
python run.py
```
*(Or `uvicorn app.main:app --reload --port 8000`)*

### 3. API Documentation
Once running, explore interactive Swagger API docs at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Running Tests
```bash
python -m tests.test_pipeline
```

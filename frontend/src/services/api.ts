export interface FaceBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface DetectResponse {
  face_detected: boolean;
  face_count: number;
  faces: FaceBox[];
  status_message: string;
  image_width: number;
  image_height: number;
}

export interface EncodeResponse {
  success: boolean;
  embedding_dimension: number;
  embedding: number[];
  record_hash: string;
  error?: string;
}

export interface VerificationResponse {
  success: boolean;
  record_hash: string;
  transaction_hash: string;
  network: string;
  status: string;
  timestamp: string;
  block_number?: number;
  error?: string;
}

export interface CompareResponse {
  success: boolean;
  is_match: boolean;
  similarity_percentage: number;
  euclidean_distance: number;
  cosine_similarity: number;
  threshold_used: number;
  status_message: string;
  face_a_detected: boolean;
  face_b_detected: boolean;
  face_a_box?: FaceBox;
  face_b_box?: FaceBox;
  embedding_a: number[];
  embedding_b: number[];
  record_hash: string;
  canonical_record?: any;
  blockchain_result?: VerificationResponse;
  error?: string;
}

export interface VerificationQueryResponse {
  record_hash: string;
  exists_on_chain: boolean;
  timestamp?: number;
  timestamp_iso?: string;
  recorder?: string;
  network: string;
  error?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function detectFace(base64Image: string): Promise<DetectResponse> {
  const res = await fetch(`${API_BASE_URL}/api/face/detect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!res.ok) {
    throw new Error(`Face detection error: ${res.statusText}`);
  }

  return res.json();
}

export async function encodeFace(base64Image: string): Promise<EncodeResponse> {
  const res = await fetch(`${API_BASE_URL}/api/face/encode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!res.ok) {
    throw new Error(`Face encoding error: ${res.statusText}`);
  }

  return res.json();
}

export async function compareFaces(
  imageA: string,
  imageB: string,
  threshold: number = 0.60,
  autoRecordOnChain: boolean = true
): Promise<CompareResponse> {
  const res = await fetch(`${API_BASE_URL}/api/face/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_a: imageA,
      image_b: imageB,
      threshold: threshold,
      auto_record_on_chain: autoRecordOnChain,
    }),
  });

  if (!res.ok) {
    throw new Error(`Face comparison error: ${res.statusText}`);
  }

  return res.json();
}

export async function recordVerification(recordHash: string): Promise<VerificationResponse> {
  const res = await fetch(`${API_BASE_URL}/api/verification/record`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ record_hash: recordHash }),
  });

  if (!res.ok) {
    throw new Error(`Verification submission error: ${res.statusText}`);
  }

  return res.json();
}

export async function queryVerification(recordHash: string): Promise<VerificationQueryResponse> {
  const res = await fetch(`${API_BASE_URL}/api/verification/query/${encodeURIComponent(recordHash)}`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(`Verification query error: ${res.statusText}`);
  }

  return res.json();
}

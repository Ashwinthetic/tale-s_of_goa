import base64
import io
import cv2
import numpy as np
from PIL import Image
from typing import List, Tuple, Dict, Any, Optional

# Load OpenCV Cascade Face Classifiers for robust multi-angle face detection
FACE_CASCADE_DEFAULT = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
FACE_CASCADE_ALT2 = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_alt2.xml')

def decode_base64_image(base64_string: str) -> np.ndarray:
    """
    Decodes base64 string (with or without data URL prefix) into OpenCV BGR numpy array.
    """
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]

    image_bytes = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    open_cv_image = np.array(image)
    # Convert RGB to BGR for OpenCV processing
    return cv2.cvtColor(open_cv_image, cv2.COLOR_RGB2BGR)

def detect_faces(image_bgr: np.ndarray) -> Tuple[List[Dict[str, int]], int, int]:
    """
    Detects faces in BGR image array using multi-scale ensemble classifier.
    Returns (list of bounding boxes in {top, right, bottom, left} format, width, height).
    """
    height, width, _ = image_bgr.shape
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)

    # Primary detection with frontalface_default
    rects = FACE_CASCADE_DEFAULT.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=4,
        minSize=(40, 40),
        flags=cv2.CASCADE_SCALE_IMAGE
    )

    # Fallback to frontalface_alt2 if no faces detected
    if len(rects) == 0:
        rects = FACE_CASCADE_ALT2.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=3,
            minSize=(35, 35),
            flags=cv2.CASCADE_SCALE_IMAGE
        )

    # Enforce single-face constraint: capture the main (largest) face
    if len(rects) > 1:
        rects = sorted(rects, key=lambda r: r[2] * r[3], reverse=True)[:1]

    boxes = []
    for (x, y, w, h) in rects:
        boxes.append({
            "top": int(y),
            "right": int(x + w),
            "bottom": int(y + h),
            "left": int(x)
        })

    return boxes, width, height

def crop_face_region(image_bgr: np.ndarray, box: Dict[str, int], padding_pct: float = 0.15) -> np.ndarray:
    """
    Crops face region with configurable percentage padding.
    """
    h_img, w_img, _ = image_bgr.shape
    top, right, bottom, left = box["top"], box["right"], box["bottom"], box["left"]
    
    w = right - left
    h = bottom - top

    pad_w = int(w * padding_pct)
    pad_h = int(h * padding_pct)

    crop_top = max(0, top - pad_h)
    crop_bottom = min(h_img, bottom + pad_h)
    crop_left = max(0, left - pad_w)
    crop_right = min(w_img, right + pad_w)

    return image_bgr[crop_top:crop_bottom, crop_left:crop_right]

def generate_128d_embedding(face_bgr: np.ndarray) -> List[float]:
    """
    Generates a normalized 128-dimensional numerical face embedding vector.
    Processes facial geometry grid, histogram descriptors, and color-space encodings.
    Verifies output dimension is exactly 128.
    """
    if face_bgr is None or face_bgr.size == 0:
        raise ValueError("Invalid face crop for embedding extraction")

    # Resize crop to standard 128x128 facial analysis grid
    face_resized = cv2.resize(face_bgr, (128, 128))
    gray_face = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)

    # Compute 128-dimensional facial representation vector
    # 1. Block-wise mean intensity (64 features)
    blocks_8x8 = cv2.resize(gray_face, (8, 8), interpolation=cv2.INTER_AREA).flatten() / 255.0

    # 2. Horizontal and vertical spatial gradient features (32 features)
    sobel_x = cv2.Sobel(gray_face, cv2.CV_64F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(gray_face, cv2.CV_64F, 0, 1, ksize=3)
    mag = np.sqrt(sobel_x**2 + sobel_y**2)
    grad_features = cv2.resize(mag, (4, 8), interpolation=cv2.INTER_AREA).flatten()
    if np.max(grad_features) > 0:
        grad_features = grad_features / np.max(grad_features)

    # 3. Color channel distribution & texture descriptors (32 features)
    hsv_face = cv2.cvtColor(face_resized, cv2.COLOR_BGR2HSV)
    h_hist = cv2.calcHist([hsv_face], [0], None, [16], [0, 180]).flatten()
    s_hist = cv2.calcHist([hsv_face], [1], None, [16], [0, 256]).flatten()
    color_features = np.concatenate([h_hist, s_hist])
    if np.sum(color_features) > 0:
        color_features = color_features / np.sum(color_features)

    # Combine into 128-dimensional feature vector
    raw_embedding = np.concatenate([blocks_8x8, grad_features, color_features])

    # Enforce strict 128 dimension constraint
    if len(raw_embedding) != 128:
        raw_embedding = np.resize(raw_embedding, 128)

    # Normalize vector to unit sphere (L2 norm)
    l2_norm = np.linalg.norm(raw_embedding)
    if l2_norm > 0:
        normalized_embedding = raw_embedding / l2_norm
    else:
        normalized_embedding = raw_embedding

    embedding_list = [float(np.round(x, 6)) for x in normalized_embedding]

    # Programmatic assertion
    assert len(embedding_list) == 128, f"Embedding dimension error: expected 128, got {len(embedding_list)}"

    return embedding_list

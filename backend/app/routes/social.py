from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

from app.services.social_search import (
    run_social_search_and_verification_pipeline,
    fetch_post_metadata_and_image
)
from app.services.face_processor import encode_image_to_base64

router = APIRouter(prefix="/api/social", tags=["Social Media Pipeline"])

class SocialSearchRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded input face scan / camera frame")
    query: Optional[str] = Field("", description="Optional search query (e.g. name or social handle)")
    threshold: Optional[float] = Field(0.60, description="Match threshold (default 0.60)")

class FetchUrlRequest(BaseModel):
    url: str = Field(..., description="Social media post or image URL to fetch")

@router.post("/search-and-verify")
async def search_and_verify_endpoint(payload: SocialSearchRequest):
    """
    HH GOA Task #3 - Full Automated Pipeline Endpoint:
    Face Scan Input -> Web/Social Media Search -> Find Matching Post -> Blockchain Commitment & Re-verification.
    """
    try:
        result = await run_social_search_and_verification_pipeline(
            face_input_b64=payload.image,
            search_query=payload.query or "",
            threshold=payload.threshold or 0.60
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Pipeline error: {str(e)}")

@router.post("/fetch")
async def fetch_post_endpoint(payload: FetchUrlRequest):
    """
    Fetches OpenGraph metadata, title, author, and base64 image from any social post or web URL.
    """
    try:
        post = await fetch_post_metadata_and_image(payload.url)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Unable to extract social media post image from {payload.url}. Ensure the link is public."
            )

        b64_img = encode_image_to_base64(post["image_bgr"])

        return {
            "success": True,
            "post_url": post["post_url"],
            "platform": post["platform"],
            "author": post["author"],
            "title": post["title"],
            "description": post["description"],
            "image_url": post["image_url"],
            "image_base64": b64_img
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

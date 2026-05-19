from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from .schemas import ActionDraft
from .service import ActionExtractor, get_extractor

router = APIRouter(tags=["ai"])


class ExtractRequest(BaseModel):
    text: str = Field(min_length=20, max_length=5000)


@router.post("/actions/extract", response_model=ActionDraft)
def extract_action(
    payload: ExtractRequest,
    extractor: ActionExtractor = Depends(get_extractor),
) -> ActionDraft:
    return extractor.extract(payload.text)

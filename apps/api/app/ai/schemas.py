from ..actions.models import ActionBase


class ActionDraft(ActionBase):
    """LLM-extracted action — not persisted, returned for admin review."""

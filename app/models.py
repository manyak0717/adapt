"""Data models and exception definitions for the Procedure Retrieval module.
"""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Custom Exceptions for Standardized Error Handling
# ---------------------------------------------------------------------------

class RetrievalError(Exception):
    """Base exception for all procedural retrieval failures."""
    pass


class NoSearchResultsError(RetrievalError):
    """Raised when search returns zero valid results for a given task query."""
    pass


class WebpageUnavailableError(RetrievalError):
    """Raised when the target webpage cannot be reached or returns an HTTP error status."""
    pass


class ContentParsingError(RetrievalError):
    """Raised when the webpage content cannot be parsed or yields no substantive textual content."""
    pass


class RetrievalTimeoutError(RetrievalError):
    """Raised when web search or webpage retrieval exceeds the configured timeout."""
    pass


# ---------------------------------------------------------------------------
# Pydantic Data Models
# ---------------------------------------------------------------------------

class SourceInfo(BaseModel):
    """Information regarding the source webpage."""
    title: str = Field(..., description="Title of the retrieved webpage")
    url: str = Field(..., description="Canonical URL of the source")
    domain: str = Field(..., description="Network domain (e.g. example.com)")


class RetrievalResult(BaseModel):
    """Standardized output structure for downstream modules (e.g. LLM step extractor)."""
    task_id: str = Field(..., description="Unique identifier for the retrieval task")
    source: SourceInfo = Field(..., description="Source metadata for the webpage")
    raw_text: str = Field(..., description="Cleaned, raw textual content of the webpage")
    retrieval_timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO-8601 timestamp when content was retrieved"
    )

    def to_dict(self) -> dict:
        """Convert model to JSON-serializable dictionary."""
        return self.model_dump()


class RetrievalRequest(BaseModel):
    """Incoming request to retrieve procedural content for a task."""
    task: str = Field(..., min_length=2, description="Natural language task description")
    task_id: Optional[str] = Field(None, description="Optional custom task identifier")


class ProceduralStep(BaseModel):
    """Structured representation of a single procedural step."""
    step_number: int = Field(..., description="1-indexed sequence number of the step")
    instruction: str = Field(..., description="Detailed textual instruction for the step")
    short_instruction: str = Field(..., description="Concise summary or title of the step")
    difficulty: str = Field(default="easy", description="Estimated difficulty: easy, medium, or hard")
    action_type: str = Field(default="action", description="Action category (e.g. navigate, input, select, verify, action)")
    requires_input: bool = Field(default=False, description="True if step requires user data entry or filling forms")
    audio_text: str = Field(..., description="Natural narration script suitable for text-to-speech audio")

    def to_dict(self) -> dict:
        """Convert model to JSON-serializable dictionary."""
        return self.model_dump()

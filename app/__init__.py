"""Procedural Retrieval Module.

Hackathon module responsible for taking a natural-language task,
searching for relevant webpages, fetching content, and returning
raw text with source metadata.
"""

from .models import (
    RetrievalResult,
    SourceInfo,
    RetrievalRequest,
    RetrievalError,
    NoSearchResultsError,
    WebpageUnavailableError,
    ContentParsingError,
    RetrievalTimeoutError,
    ProceduralStep,
)

def __getattr__(name: str):
    if name == "ProcedureRetriever":
        from .main import ProcedureRetriever
        return ProcedureRetriever
    if name in ("StepExtractor", "extract_steps"):
        from .step_extractor import StepExtractor, extract_steps
        if name == "StepExtractor":
            return StepExtractor
        return extract_steps
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")

__all__ = [
    "ProcedureRetriever",
    "StepExtractor",
    "extract_steps",
    "ProceduralStep",
    "RetrievalResult",
    "SourceInfo",
    "RetrievalRequest",
    "RetrievalError",
    "NoSearchResultsError",
    "WebpageUnavailableError",
    "ContentParsingError",
    "RetrievalTimeoutError",
]

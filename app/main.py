"""Main entrypoint for the Procedure Retrieval module.

Orchestrates the retrieval pipeline:
  1. Accepts a natural-language task (e.g. "I want to book a flight").
  2. Searches the web for relevant procedural candidate pages.
  3. Retrieves and extracts readable text from candidate pages.
  4. Returns structured RetrievalResult adhering to the hackathon schema.
"""

import argparse
import json
import logging
import os
import sys
import uuid
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv

from .extractor import extract_content
from .models import (
    ContentParsingError,
    NoSearchResultsError,
    RetrievalError,
    RetrievalResult,
    RetrievalTimeoutError,
    SourceInfo,
    WebpageUnavailableError,
)
from .search import search_webpages

# Load environment variables if present (.env)
load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("procedure_retrieval")


class ProcedureRetriever:
    """Orchestrator for procedural knowledge retrieval."""

    def __init__(
        self,
        search_timeout: Optional[float] = None,
        fetch_timeout: Optional[float] = None,
        max_search_candidates: Optional[int] = None,
    ):
        self.search_timeout = search_timeout or float(
            os.getenv("SEARCH_TIMEOUT_SECONDS", 10.0)
        )
        self.fetch_timeout = fetch_timeout or float(
            os.getenv("FETCH_TIMEOUT_SECONDS", 10.0)
        )
        self.max_candidates = max_search_candidates or int(
            os.getenv("MAX_SEARCH_RESULTS", 5)
        )

    def retrieve(
        self, task: str, task_id: Optional[str] = None
    ) -> RetrievalResult:
        """Run full procedural retrieval pipeline for a natural-language task.

        Args:
            task: Natural language goal or query (e.g. 'I want to book a flight').
            task_id: Optional unique identifier. If not provided, a UUID is generated.

        Returns:
            RetrievalResult matching the standardized schema.

        Raises:
            NoSearchResultsError: If no relevant search results were returned.
            WebpageUnavailableError: If candidate webpages could not be loaded.
            ContentParsingError: If candidate content could not be parsed.
            RetrievalTimeoutError: If the search or fetch exceeded timeout.
        """
        task_str = task.strip()
        if not task_str:
            raise ValueError("Task cannot be empty.")

        resolved_task_id = task_id or f"task_{uuid.uuid4().hex[:10]}"

        logger.info(f"Starting retrieval for task [{resolved_task_id}]: '{task_str}'")

        # 1. Search for candidate pages
        candidates = search_webpages(
            query=task_str,
            max_results=self.max_candidates,
            timeout=self.search_timeout,
        )

        if not candidates:
            raise NoSearchResultsError(f"No search results returned for query: {task_str}")

        logger.info(f"Found {len(candidates)} candidate webpages. Attempting content extraction...")

        last_error: Optional[RetrievalError] = None

        # 2. Iterate through candidates until one successfully parses
        for index, candidate in enumerate(candidates, start=1):
            logger.info(f"[{index}/{len(candidates)}] Inspecting: {candidate.url}")
            try:
                source, raw_text = extract_content(
                    url=candidate.url,
                    timeout=self.fetch_timeout,
                )

                # Use candidate title as fallback if extractor gave bare domain
                if source.title == source.domain and candidate.title:
                    source = SourceInfo(
                        title=candidate.title,
                        url=source.url,
                        domain=source.domain,
                    )

                logger.info(
                    f"Successfully retrieved content from {source.domain} "
                    f"({len(raw_text)} characters)."
                )

                # 3. Assemble and return structured result
                return RetrievalResult(
                    task_id=resolved_task_id,
                    source=source,
                    raw_text=raw_text,
                    retrieval_timestamp=datetime.now(timezone.utc).isoformat(),
                )

            except (WebpageUnavailableError, ContentParsingError, RetrievalTimeoutError) as err:
                logger.warning(
                    f"Failed to extract candidate ({candidate.url}): {err}. Trying next candidate..."
                )
                last_error = err
                continue

        # If all candidates failed, raise the last captured error
        if last_error:
            raise last_error

        raise WebpageUnavailableError(
            f"All {len(candidates)} search candidates failed to yield readable procedural content."
        )


def main():
    """CLI runner for direct execution and testing during hackathon development."""
    parser = argparse.ArgumentParser(
        description="Retrieve procedural webpage content for a natural language task."
    )
    parser.add_argument(
        "task",
        type=str,
        nargs="?",
        default="I want to book a flight",
        help="Natural language task description (e.g. 'I want to book a flight')",
    )
    parser.add_argument(
        "--task-id",
        type=str,
        default=None,
        help="Optional custom task identifier",
    )
    parser.add_argument(
        "--search-timeout",
        type=float,
        default=None,
        help="Timeout in seconds for search",
    )
    parser.add_argument(
        "--fetch-timeout",
        type=float,
        default=None,
        help="Timeout in seconds for page fetching",
    )

    args = parser.parse_args()

    retriever = ProcedureRetriever(
        search_timeout=args.search_timeout,
        fetch_timeout=args.fetch_timeout,
    )

    try:
        result = retriever.retrieve(task=args.task, task_id=args.task_id)
        # Print JSON output to stdout
        print(json.dumps(result.to_dict(), indent=2))
        sys.exit(0)
    except RetrievalError as err:
        logger.error(f"Retrieval failed: {err}")
        print(
            json.dumps(
                {
                    "error": type(err).__name__,
                    "message": str(err),
                },
                indent=2,
            ),
            file=sys.stderr,
        )
        sys.exit(1)
    except Exception as exc:
        logger.exception(f"Unexpected fatal error: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()

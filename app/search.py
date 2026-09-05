"""Web search module for finding relevant procedural webpages.

Uses DuckDuckGo Search (no API key required) to locate high-relevance
guides, articles, and documentation for a given procedural task.
"""

import logging
from typing import List, Optional
from urllib.parse import urlparse
from ddgs import DDGS

from pydantic import BaseModel

from .models import NoSearchResultsError, RetrievalTimeoutError

logger = logging.getLogger(__name__)

# File extensions to ignore as they are binary or media
IGNORED_EXTENSIONS = (
    ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
    ".zip", ".tar", ".gz", ".mp3", ".mp4", ".avi", ".jpg", ".png", ".gif"
)

# Domains / URL patterns that commonly produce irrelevant or non-procedural results
BLOCKED_DOMAINS = {
    "grokipedia.com",
    "youtube.com",
    "www.youtube.com",
}

BLOCKED_URL_PATTERNS = (
    "bing.com/aclick",
    "duckduckgo.com/y.js",
    "duckduckgo.com/l/?",
)

# Words that indicate a page is likely to contain an actual procedure
PROCEDURAL_KEYWORDS = (
    "how to",
    "step",
    "steps",
    "guide",
    "tutorial",
    "instructions",
    "help",
    "support",
    "procedure",
    "book",
    "create",
    "setup",
    "set up",
    "reset",
    "submit",
    "upload",
    "download",
    "pay",
    "order",
    "return",
    "change",
)

class SearchCandidate(BaseModel):
    """Candidate webpage found during web search."""
    title: str
    url: str
    snippet: Optional[str] = ""
    domain: str = ""


def _is_valid_webpage_url(url: str) -> bool:
    """Validate that the URL is a standard HTTP/HTTPS webpage and not a binary asset."""
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        if not parsed.netloc:
            return False
        if _is_blocked_url(url):
            return False
        path = parsed.path.lower()
        if any(path.endswith(ext) for ext in IGNORED_EXTENSIONS):
            return False
        return True
    except Exception:
        return False

def _is_blocked_url(url: str) -> bool:
    """Reject known junk, advertisement, and non-procedural URLs."""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        full_url = url.lower()

        if domain in BLOCKED_DOMAINS:
            return True

        if any(pattern in full_url for pattern in BLOCKED_URL_PATTERNS):
            return True

        return False

    except Exception:
        return True


def _score_candidate(candidate: SearchCandidate, query: str) -> int:
    """Score candidates so procedural pages are preferred."""
    title = candidate.title.lower()
    snippet = candidate.snippet.lower()
    url = candidate.url.lower()

    score = 0

    # Strong signals
    if "how to" in title:
        score += 5

    if any(word in title for word in ("guide", "tutorial", "instructions", "steps")):
        score += 4

    if any(word in url for word in ("/how-to/", "/guide/", "/help/", "/support/")):
        score += 3

    # Procedural language in title/snippet
    for keyword in PROCEDURAL_KEYWORDS:
        if keyword in title:
            score += 2
        elif keyword in snippet:
            score += 1

    # Prefer pages whose title has words from the user's task
    query_words = {
        word.lower()
        for word in query.split()
        if len(word) > 3
    }

    for word in query_words:
        if word in title:
            score += 2

    return score

def _search_html_fallback(
    query: str,
    max_results: int = 5,
    timeout: float = 10.0,
) -> List[SearchCandidate]:
    """Fallback search using DuckDuckGo HTML endpoint via HTTP request."""
    import os
    import httpx
    from bs4 import BeautifulSoup
    from urllib.parse import parse_qs, unquote

    verify_ssl = os.getenv("VERIFY_SSL", "true").lower() in ("true", "1", "yes")
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    candidates: List[SearchCandidate] = []
    try:
        with httpx.Client(timeout=timeout, verify=verify_ssl, follow_redirects=True) as client:
            resp = client.post("https://html.duckduckgo.com/html/", data={"q": query}, headers=headers)
            if resp.status_code != 200:
                return []

            soup = BeautifulSoup(resp.text, "html.parser")
            results = soup.find_all("div", class_="result")

            for res in results:
                # Find title and link
                title_elem = res.find("a", class_="result__url") or res.find("a", class_="result__snippet")
                snippet_elem = res.find("a", class_="result__snippet")

                url = title_elem.get("href") if title_elem else None
                if not url:
                    continue

                # Unwrap DuckDuckGo redirection link if present (/l/?uddg=...)
                if "duckduckgo.com/l/?" in url:
                    parsed_link = urlparse(url)
                    qs = parse_qs(parsed_link.query)
                    if "uddg" in qs:
                        url = unquote(qs["uddg"][0])

                if not _is_valid_webpage_url(url):
                    continue

                parsed = urlparse(url)
                domain = parsed.netloc.lower()
                title_text = res.find("h2", class_="result__title")
                title = title_text.get_text(strip=True) if title_text else domain
                snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""

                candidates.append(
                    SearchCandidate(
                        title=title or domain,
                        url=url,
                        snippet=snippet,
                        domain=domain,
                    )
                )
                if len(candidates) >= max_results:
                    break

    except Exception as exc:
        logger.debug(f"DuckDuckGo HTML fallback search encountered: {exc}")

    return candidates


def search_webpages(
    query: str,
    max_results: int = 5,
    timeout: float = 10.0,
) -> List[SearchCandidate]:
    """Search the web for pages relevant to the procedural task.

    Args:
        query: Natural language query (e.g. 'I want to book a flight').
        max_results: Maximum number of search candidates to retrieve.
        timeout: Search timeout limit in seconds.

    Returns:
        List of SearchCandidate objects.

    Raises:
        NoSearchResultsError: If no valid search results could be found.
        RetrievalTimeoutError: If the search request times out.
    """
    cleaned_query = query.strip()
    if not cleaned_query:
        raise NoSearchResultsError("Empty search query provided.")

    candidates: List[SearchCandidate] = []

    try:
        from ddgs import DDGS

        # Query DuckDuckGo text search
        with DDGS(timeout=int(timeout)) as ddgs:
            raw_results = list(ddgs.text(cleaned_query, max_results=max_results * 2))

        for item in raw_results:
            url = item.get("href") or item.get("link") or item.get("url")
            if not url or not _is_valid_webpage_url(url):
                continue

            parsed = urlparse(url)
            domain = parsed.netloc

            title = item.get("title") or domain
            snippet = item.get("body") or item.get("snippet") or ""

            candidates.append(
                SearchCandidate(
                    title=title.strip(),
                    url=url.strip(),
                    snippet=snippet.strip(),
                    domain=domain.lower(),
                )
            )

            if len(candidates) >= max_results:
                break

    except TimeoutError as exc:
        logger.error(f"Search timed out for query '{cleaned_query}': {exc}")
        raise RetrievalTimeoutError(f"Search timed out after {timeout}s for: {cleaned_query}") from exc
    except Exception as exc:
        error_msg = str(exc).lower()
        if "timeout" in error_msg or "timed out" in error_msg:
            logger.error(f"Search timed out: {exc}")
            raise RetrievalTimeoutError(f"Search timed out: {exc}") from exc
        logger.warning(f"Error executing primary search backend: {exc}")

    # Fallback to direct HTML search if primary returned no candidates
    if not candidates:
        logger.info("Primary search returned 0 results, attempting fallback search...")
        candidates = _search_html_fallback(
            query=cleaned_query,
            max_results=max_results,
            timeout=timeout,
        )



# Rank candidates by procedural relevance
    if not candidates:
        raise NoSearchResultsError(
            f"No valid search results found for query: '{cleaned_query}'"
        )

# Rank candidates by procedural relevance
    candidates.sort(
        key=lambda candidate: _score_candidate(candidate, cleaned_query),
        reverse=True,
    )

    return candidates[:max_results]

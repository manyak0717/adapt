"""Webpage content fetcher and text extractor module.

Fetches HTML from target URLs with robust timeout & error handling,
and extracts clean, boilerplate-free textual content using Trafilatura
with a BeautifulSoup fallback.
"""

import logging
import os
from typing import Optional, Tuple
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

from .models import (
    ContentParsingError,
    RetrievalTimeoutError,
    SourceInfo,
    WebpageUnavailableError,
)

logger = logging.getLogger(__name__)

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# Minimum character count to consider parsed webpage content valid
MIN_CONTENT_LENGTH = 50


def _extract_title_from_soup(soup: BeautifulSoup, fallback: str) -> str:
    """Attempt to find title from og:title, twitter:title, or <title> tag."""
    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        return og_title["content"].strip()

    if soup.title and soup.title.string:
        return soup.title.string.strip()

    h1 = soup.find("h1")
    if h1:
        return h1.get_text(strip=True)

    return fallback


def _clean_with_beautifulsoup(html: str) -> str:
    """Fallback parser: strip tags, scripts, and navigation to get readable text."""
    soup = BeautifulSoup(html, "html.parser")

    # Remove non-content elements
    for tag in soup(["script", "style", "nav", "header", "footer", "aside", "noscript", "svg", "form"]):
        tag.decompose()

    text = soup.get_text(separator="\n", strip=True)
    # Collapse consecutive blank lines
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n\n".join(lines)


def fetch_html(url: str, timeout: float = 10.0, headers: Optional[dict] = None) -> str:
    """Fetch raw HTML for a webpage URL with explicit timeout and error classification.

    Args:
        url: The webpage URL to fetch.
        timeout: Network timeout in seconds.
        headers: Optional custom HTTP headers.

    Returns:
        HTML string of the webpage.

    Raises:
        RetrievalTimeoutError: If the request times out.
        WebpageUnavailableError: For 4xx/5xx status codes or network/connection failures.
    """
    request_headers = {**DEFAULT_HEADERS, **(headers or {})}
    verify_ssl = os.getenv("VERIFY_SSL", "true").lower() in ("true", "1", "yes")

    try:
        with httpx.Client(
            headers=request_headers,
            timeout=timeout,
            follow_redirects=True,
            verify=verify_ssl,
        ) as client:
            response = client.get(url)
            response.raise_for_status()
            return response.text

    except httpx.TimeoutException as exc:
        logger.error(f"Timeout while fetching {url}: {exc}")
        raise RetrievalTimeoutError(f"Request to '{url}' timed out after {timeout} seconds.") from exc

    except (httpx.HTTPStatusError, httpx.RequestError) as exc:
        logger.error(f"Failed to fetch {url}: {exc}")
        raise WebpageUnavailableError(f"Webpage at '{url}' is unavailable or returned an error: {exc}") from exc

    except Exception as exc:
        logger.error(f"Unexpected error retrieving {url}: {exc}")
        raise WebpageUnavailableError(f"Failed to retrieve '{url}': {exc}") from exc


def extract_content(
    url: str,
    html: Optional[str] = None,
    timeout: float = 10.0,
) -> Tuple[SourceInfo, str]:
    """Fetch webpage (if html is not provided) and extract clean textual content and metadata.

    Args:
        url: URL of the webpage.
        html: Optional raw HTML string (bypasses network fetch if provided).
        timeout: Network timeout in seconds if fetching is required.

    Returns:
        Tuple of (SourceInfo, raw_text).

    Raises:
        WebpageUnavailableError: If fetching the webpage fails.
        RetrievalTimeoutError: If network request exceeds timeout.
        ContentParsingError: If content cannot be extracted or is empty.
    """
    if not html:
        html = fetch_html(url=url, timeout=timeout)

    parsed_url = urlparse(url)
    domain = parsed_url.netloc.lower()

    # Attempt extraction via trafilatura (optimized for article/guide text)
    extracted_text: Optional[str] = None
    title = domain

    try:
        import trafilatura
        from trafilatura.meta import extract_metadata

        # Extract metadata for title if available
        meta = extract_metadata(html)
        if meta and meta.title:
            title = meta.title.strip()

        # Extract main body text
        extracted_text = trafilatura.extract(
            html,
            include_comments=False,
            include_tables=True,
            no_fallback=False,
        )
    except Exception as exc:
        logger.debug(f"Trafilatura extraction skipped/failed, falling back to BeautifulSoup: {exc}")

    # Fallback to BeautifulSoup if trafilatura produced nothing
    if not extracted_text or len(extracted_text.strip()) < MIN_CONTENT_LENGTH:
        soup = BeautifulSoup(html, "html.parser")
        if title == domain:
            title = _extract_title_from_soup(soup, fallback=domain)
        extracted_text = _clean_with_beautifulsoup(html)

    # Validate that we have sufficient text
    cleaned_text = (extracted_text or "").strip()
    if not cleaned_text or len(cleaned_text) < MIN_CONTENT_LENGTH:
        raise ContentParsingError(
            f"Webpage at '{url}' could not be parsed into substantive text (content too short or empty)."
        )

    source = SourceInfo(
        title=title,
        url=url,
        domain=domain,
    )

    return source, cleaned_text

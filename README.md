# Procedure Retrieval Module (`procedure-retrieval`)

A clean, modular Python module built for a hackathon. This module accepts a natural-language task (e.g., `"I want to book a flight"`), discovers relevant procedural webpages, extracts the main textual content, and returns structured metadata ready for downstream step extraction and LLM processing.

---

## 📁 Project Structure & File Responsibilities

```text
procedure-retrieval/
├── app/
│   ├── __init__.py      # Package initialization; exposes ProcedureRetriever and core models
│   ├── main.py          # Orchestration pipeline and CLI runner
│   ├── search.py        # Web search integration (DuckDuckGo, zero-API-key)
│   ├── extractor.py     # HTML fetcher and clean article/body text extractor
│   └── models.py        # Pydantic schemas and standardized custom exceptions
├── tests/
│   ├── __init__.py
│   └── test_retrieval.py # Automated test suite (schema, error handling, mock pipeline)
├── .env                 # Local configuration (timeouts, candidate limits)
├── .env.example         # Template for environment configuration
├── .gitignore           # Ignores virtualenv, caches, and sensitive files
├── requirements.txt     # Python dependencies
└── README.md            # Module documentation and usage guide
```

### File Responsibilities in Detail

1. **[`app/models.py`](file:///C:/Users/jain/.gemini/antigravity/scratch/procedure-retrieval/app/models.py)**:
   - **`SourceInfo`**: Holds source metadata (`title`, `url`, `domain`).
   - **`RetrievalResult`**: The standardized contract returned to downstream teammates.
   - **Custom Exceptions**:
     - `NoSearchResultsError`: Raised when the query returns zero search results.
     - `WebpageUnavailableError`: Raised on HTTP 4xx/5xx or network connection issues.
     - `ContentParsingError`: Raised if the target webpage cannot be parsed or has empty content.
     - `RetrievalTimeoutError`: Raised when search or page fetch exceeds configured timeouts.

2. **[`app/search.py`](file:///C:/Users/jain/.gemini/antigravity/scratch/procedure-retrieval/app/search.py)**:
   - Queries DuckDuckGo text search (no external API keys required).
   - Filters out non-web assets (`.pdf`, `.zip`, `.mp4`, etc.).
   - Returns a ranked list of candidate pages (`SearchCandidate`) containing `title`, `url`, and `domain`.

3. **[`app/extractor.py`](file:///C:/Users/jain/.gemini/antigravity/scratch/procedure-retrieval/app/extractor.py)**:
   - Performs resilient HTTP requests using `httpx` with realistic browser headers and redirect handling.
   - Extracts clean, boilerplate-free textual content using **Trafilatura** (stripping ads, navbars, and footers), with an automatic **BeautifulSoup4** fallback.
   - Validates that the extracted text is substantive (rejects blank pages).

4. **[`app/main.py`](file:///C:/Users/jain/.gemini/antigravity/scratch/procedure-retrieval/app/main.py)**:
   - Implements **`ProcedureRetriever`**, which orchestrates the retrieval flow.
   - Includes automatic candidate fallback: if the top search result fails (e.g. 403 or dead link), it automatically falls back to subsequent candidates before giving up.
   - Provides a CLI interface for manual testing and pipeline verification.

5. **[`tests/test_retrieval.py`](file:///C:/Users/jain/.gemini/antigravity/scratch/procedure-retrieval/tests/test_retrieval.py)**:
   - Tests JSON output structure against requirements.
   - Tests error handling (no results, unavailable webpage, timeout, empty HTML).
   - Tests end-to-end retrieval with mocks (fast and offline-friendly).

---

## 📋 Standardized Output Schema

The module outputs JSON adhering to this exact format:

```json
{
  "task_id": "task_4f891b2c",
  "source": {
    "title": "How to Book a Flight: Step-by-Step Guide",
    "url": "https://example.com/how-to-book-a-flight",
    "domain": "example.com"
  },
  "raw_text": "Step 1: Determine your travel dates and destination...\nStep 2: Compare flight prices across major booking engines...",
  "retrieval_timestamp": "2026-09-05T04:45:00.123456+00:00"
}
```

---

## ⚙️ Setup & Installation

### 1. Create a Virtual Environment

```bash
python -m venv .venv

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Linux / macOS
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Variables

A default `.env` file is included with sensible defaults:

```ini
SEARCH_TIMEOUT_SECONDS=10.0
FETCH_TIMEOUT_SECONDS=10.0
MAX_SEARCH_RESULTS=5
LOG_LEVEL=INFO
```

---

## 🚀 Usage

### Option A: Command Line Interface (CLI)

Run directly from your terminal:

```bash
python -m app.main "I want to book a flight"
```

With custom timeouts:

```bash
python -m app.main "How to renew a passport" --search-timeout 8.0 --fetch-timeout 10.0
```

### Option B: As a Python Library in Downstream Modules

Your hackathon teammates working on the LLM or Step Extraction module can import and use `ProcedureRetriever` directly:

```python
from app import ProcedureRetriever, RetrievalError

retriever = ProcedureRetriever()

try:
    result = retriever.retrieve("I want to book a flight")
    print("Retrieved Title:", result.source.title)
    print("Source URL:", result.source.url)
    print("Raw Content Length:", len(result.raw_text))

    # Convert to JSON dictionary for downstream LLM prompt
    payload = result.to_dict()
except RetrievalError as err:
    print(f"Retrieval error occurred: {err}")
```

---

## 🧪 Running Tests

Run the test suite:

```bash
# Using pytest
pytest tests/ -v

# Or using standard python unittest
python -m unittest discover tests
```

---

## 🛡️ Error Handling Reference

| Error | Condition | Exception Class |
| :--- | :--- | :--- |
| **No Search Results** | Search engine returns 0 results for the query | `NoSearchResultsError` |
| **Webpage Unavailable** | 404/500 HTTP errors or connection failure | `WebpageUnavailableError` |
| **Cannot Parse Content**| Page is empty, malformed, or only boilerplate | `ContentParsingError` |
| **Timeout** | Search or page retrieval exceeds timeout | `RetrievalTimeoutError` |

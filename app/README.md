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
│   ├── models.py        # Pydantic schemas and standardized custom exceptions
│   ├── step_extractor.py # Rule-based extraction fallback into structured steps
│   └── ai_step_extractor.py # Gemini-powered step extraction
├── tests/
│   ├── __init__.py
│   ├── test_retrieval.py # Automated test suite (schema, error handling, mock pipeline)
│   ├── test_step_extractor.py # Tests for step extraction and model contracts
│   └── test_tasks.py    # Multi-task benchmark test runner
├── .env                 # Local configuration (timeouts, candidate limits)
├── .env.example         # Template for environment configuration
├── .gitignore           # Ignores virtualenv, caches, and sensitive files
├── requirements.txt     # Python dependencies
└── README.md            # Module documentation and usage guide
```

### File Responsibilities in Detail

1. **[`app/models.py`](file:///c:/Users/manas/OneDrive/Desktop/adapt/app/models.py)**:
   - **`SourceInfo`**: Holds source metadata (`title`, `url`, `domain`).
   - **`RetrievalResult`**: The standardized contract returned to downstream teammates.
   - **`ProceduralStep`**: Normalized step contract with difficulty, action type, audio text.
   - **Custom Exceptions**:
     - `NoSearchResultsError`: Raised when the query returns zero search results.
     - `WebpageUnavailableError`: Raised on HTTP 4xx/5xx or network connection issues.
     - `ContentParsingError`: Raised if the target webpage cannot be parsed or has empty content.
     - `RetrievalTimeoutError`: Raised when search or page fetch exceeds configured timeouts.

2. **[`app/search.py`](file:///c:/Users/manas/OneDrive/Desktop/adapt/app/search.py)**:
   - Queries DuckDuckGo text search (no external API keys required).
   - Filters out non-web assets (`.pdf`, `.zip`, `.mp4`, etc.).
   - Returns a ranked list of candidate pages (`SearchCandidate`) containing `title`, `url`, and `domain`.

3. **[`app/extractor.py`](file:///c:/Users/manas/OneDrive/Desktop/adapt/app/extractor.py)**:
   - Performs resilient HTTP requests using `httpx` with realistic browser headers and redirect handling.
   - Extracts clean, boilerplate-free textual content using **Trafilatura** (stripping ads, navbars, and footers), with an automatic **BeautifulSoup4** fallback.
   - Validates that the extracted text is substantive (rejects blank pages).

4. **[`app/step_extractor.py`](file:///c:/Users/manas/OneDrive/Desktop/adapt/app/step_extractor.py)**:
   - Resilient rule-based extraction that parses headings, numbered lists, and step labels into structured `ProceduralStep` objects.
   - Serves as the high-reliability fallback when external AI models are unavailable or offline.

5. **[`app/ai_step_extractor.py`](file:///c:/Users/manas/OneDrive/Desktop/adapt/app/ai_step_extractor.py)**:
   - Gemini-powered semantic step extraction adhering strictly to the user's task and page evidence.

6. **[`app/main.py`](file:///c:/Users/manas/OneDrive/Desktop/adapt/app/main.py)**:
   - Implements **`ProcedureRetriever`**, which orchestrates the retrieval flow.
   - Includes automatic candidate fallback: if the top search result fails (e.g. 403 or dead link), it automatically falls back to subsequent candidates before giving up.
   - Provides a CLI interface for manual testing and pipeline verification.

7. **[`tests/test_retrieval.py`](file:///c:/Users/manas/OneDrive/Desktop/adapt/tests/test_retrieval.py)**:
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

A default `.env` file can be configured with:

```ini
SEARCH_TIMEOUT_SECONDS=10.0
FETCH_TIMEOUT_SECONDS=10.0
MAX_SEARCH_RESULTS=5
LOG_LEVEL=INFO
GEMINI_API_KEY=your_key_here
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

```python
from app import ProcedureRetriever, RetrievalError

retriever = ProcedureRetriever()

try:
    result = retriever.retrieve("I want to book a flight")
    print("Retrieved Title:", result.source.title)
    print("Source URL:", result.source.url)
    print("Raw Content Length:", len(result.raw_text))

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

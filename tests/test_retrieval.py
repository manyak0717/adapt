"""Unit and integration tests for the Procedure Retrieval module.
"""

import unittest
from unittest.mock import MagicMock, patch

import httpx

from app.extractor import extract_content, fetch_html
from app.main import ProcedureRetriever
from app.models import (
    ContentParsingError,
    NoSearchResultsError,
    RetrievalResult,
    RetrievalTimeoutError,
    SourceInfo,
    WebpageUnavailableError,
)
from app.search import SearchCandidate, search_webpages


class TestModels(unittest.TestCase):
    """Test data models and JSON serialization schema compliance."""

    def test_schema_structure(self):
        source = SourceInfo(
            title="How to Book a Flight: 10 Steps",
            url="https://example.com/book-flight",
            domain="example.com",
        )
        result = RetrievalResult(
            task_id="task_12345",
            source=source,
            raw_text="Step 1: Choose destination. Step 2: Compare prices.",
            retrieval_timestamp="2026-09-05T10:00:00+00:00",
        )

        data = result.to_dict()

        # Verify exact required keys
        self.assertIn("task_id", data)
        self.assertIn("source", data)
        self.assertIn("raw_text", data)
        self.assertIn("retrieval_timestamp", data)

        # Verify source sub-dictionary keys
        self.assertEqual(data["task_id"], "task_12345")
        self.assertEqual(data["source"]["title"], "How to Book a Flight: 10 Steps")
        self.assertEqual(data["source"]["url"], "https://example.com/book-flight")
        self.assertEqual(data["source"]["domain"], "example.com")
        self.assertIn("Step 1", data["raw_text"])
        self.assertEqual(data["retrieval_timestamp"], "2026-09-05T10:00:00+00:00")


class TestSearch(unittest.TestCase):
    """Test search logic and error cases."""

    def test_empty_query_raises_no_results(self):
        with self.assertRaises(NoSearchResultsError):
            search_webpages("")

    @patch("app.search._search_html_fallback", return_value=[])
    def test_no_results_raises_error(self, mock_fallback):
        mock_ddgs_instance = MagicMock()
        mock_ddgs_instance.__enter__.return_value = mock_ddgs_instance
        mock_ddgs_instance.text.return_value = []
        mock_ddgs_class = MagicMock(return_value=mock_ddgs_instance)
        mock_module = MagicMock(DDGS=mock_ddgs_class)

        with patch.dict("sys.modules", {"ddgs": mock_module, "duckduckgo_search": mock_module}):
            with self.assertRaises(NoSearchResultsError):
                search_webpages("unsearchable nonsense query xyz987654")

    def test_search_timeout_raises_retrieval_timeout_error(self):
        mock_ddgs_instance = MagicMock()
        mock_ddgs_instance.__enter__.return_value = mock_ddgs_instance
        mock_ddgs_instance.text.side_effect = TimeoutError("Timed out")
        mock_ddgs_class = MagicMock(return_value=mock_ddgs_instance)
        mock_module = MagicMock(DDGS=mock_ddgs_class)

        with patch.dict("sys.modules", {"ddgs": mock_module, "duckduckgo_search": mock_module}):
            with self.assertRaises(RetrievalTimeoutError):
                search_webpages("how to book a flight", timeout=0.1)


class TestExtractor(unittest.TestCase):
    """Test webpage fetching, parsing, and error conditions."""

    @patch("httpx.Client.get")
    def test_webpage_unavailable_http_error(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
            "404 Not Found",
            request=MagicMock(),
            response=MagicMock(status_code=404),
        )
        mock_get.return_value = mock_resp

        with self.assertRaises(WebpageUnavailableError):
            fetch_html("https://example.com/non-existent-page")

    @patch("httpx.Client.get")
    def test_fetch_timeout_error(self, mock_get):
        mock_get.side_effect = httpx.TimeoutException("Connection timed out")

        with self.assertRaises(RetrievalTimeoutError):
            fetch_html("https://example.com/slow-page")

    def test_content_parsing_error_on_empty_html(self):
        # Empty or tiny HTML containing no substantive text
        empty_html = "<html><head><title>Empty</title></head><body><div></div></body></html>"
        with self.assertRaises(ContentParsingError):
            extract_content("https://example.com/empty", html=empty_html)

    def test_successful_extraction_from_html(self):
        sample_html = """
        <!DOCTYPE html>
        <html>
        <head><title>How to Book a Flight</title></head>
        <body>
            <nav><a href="/">Home</a></nav>
            <main>
                <h1>How to Book a Flight</h1>
                <p>Booking a flight is a simple multi-step process when prepared properly.</p>
                <h2>Step 1: Choose Your Destination and Dates</h2>
                <p>Determine where and when you need to travel before searching for airlines.</p>
                <h2>Step 2: Compare Airfares Online</h2>
                <p>Utilize flight comparison aggregators to find the best available rates.</p>
            </main>
            <footer>Copyright 2026</footer>
        </body>
        </html>
        """
        source, text = extract_content("https://travel.example.com/guide/flights", html=sample_html)
        self.assertEqual(source.domain, "travel.example.com")
        self.assertIn("How to Book a Flight", source.title)
        self.assertIn("Step 1: Choose Your Destination", text)
        self.assertIn("Step 2: Compare Airfares", text)
        self.assertNotIn("Copyright 2026", text)


class TestProcedureRetriever(unittest.TestCase):
    """Test full retriever orchestration."""

    @patch("app.main.search_webpages")
    @patch("app.main.extract_content")
    def test_successful_pipeline_run(self, mock_extract, mock_search):
        mock_search.return_value = [
            SearchCandidate(
                title="How to Book a Flight: Complete Guide",
                url="https://travelguide.com/flights",
                domain="travelguide.com",
            )
        ]
        mock_extract.return_value = (
            SourceInfo(
                title="How to Book a Flight: Complete Guide",
                url="https://travelguide.com/flights",
                domain="travelguide.com",
            ),
            "Step 1: Decide your travel dates.\nStep 2: Compare airlines on price aggregators.",
        )

        retriever = ProcedureRetriever()
        result = retriever.retrieve("I want to book a flight", task_id="test_task_01")

        self.assertEqual(result.task_id, "test_task_01")
        self.assertEqual(result.source.domain, "travelguide.com")
        self.assertIn("Step 1", result.raw_text)
        self.assertTrue(result.retrieval_timestamp)

    @patch("app.main.search_webpages")
    @patch("app.main.extract_content")
    def test_fallback_to_second_candidate_if_first_fails(self, mock_extract, mock_search):
        mock_search.return_value = [
            SearchCandidate(
                title="Broken Link",
                url="https://broken.com/dead",
                domain="broken.com",
            ),
            SearchCandidate(
                title="Working Guide",
                url="https://good.com/guide",
                domain="good.com",
            ),
        ]

        # First candidate fails with WebpageUnavailableError, second succeeds
        mock_extract.side_effect = [
            WebpageUnavailableError("404 Not Found"),
            (
                SourceInfo(
                    title="Working Guide",
                    url="https://good.com/guide",
                    domain="good.com",
                ),
                "Step 1: Search flights. Step 2: Book tickets.",
            ),
        ]

        retriever = ProcedureRetriever()
        result = retriever.retrieve("I want to book a flight")

        self.assertEqual(result.source.url, "https://good.com/guide")
        self.assertIn("Step 1: Search flights", result.raw_text)


if __name__ == "__main__":
    unittest.main()

"""Tests for Procedure Retrieval FastAPI endpoints."""

import unittest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from backend.app.main import app
from app.models import RetrievalResult, SourceInfo


class TestProcedureApiEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_extract_steps_endpoint_rule_based(self):
        payload = {
            "task": "How to book a flight",
            "raw_text": """
            Step 1: Choose your departure airport and destination.
            Select your preferred travel dates.
            
            Step 2: Enter passenger information.
            Provide names and passport details for all travelers.
            
            Step 3: Pay for tickets.
            Enter credit card information to finalize purchase.
            """,
            "use_gemini": False
        }
        response = self.client.post("/procedure/extract-steps", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["task"], "How to book a flight")
        self.assertEqual(data["method"], "rule_based")
        self.assertGreaterEqual(len(data["steps"]), 2)
        self.assertEqual(data["steps"][0]["step_number"], 1)

    @patch("backend.app.main.ProcedureRetriever")
    def test_retrieve_endpoint(self, mock_retriever_cls):
        mock_instance = MagicMock()
        mock_instance.retrieve.return_value = RetrievalResult(
            task_id="test_task_api",
            source=SourceInfo(
                title="How to Book Flights",
                url="https://example.com/flight",
                domain="example.com"
            ),
            raw_text="Step 1: Go to booking site. Step 2: Book.",
            retrieval_timestamp="2026-09-05T00:00:00Z"
        )
        mock_retriever_cls.return_value = mock_instance

        response = self.client.post("/procedure/retrieve", json={"task": "I want to book a flight"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["task_id"], "test_task_api")
        self.assertEqual(data["source"]["domain"], "example.com")

    @patch("backend.app.main.ProcedureRetriever")
    def test_task_from_procedure_endpoint(self, mock_retriever_cls):
        mock_instance = MagicMock()
        mock_instance.retrieve.return_value = RetrievalResult(
            task_id="task_auto",
            source=SourceInfo(
                title="Passport Renewal Guide",
                url="https://example.com/passport",
                domain="example.com"
            ),
            raw_text="""
            1. Fill in the online passport form.
            Make sure all details match your birth certificate.
            
            2. Upload your identity photos.
            Use a neutral background.
            
            3. Submit the payment online.
            Pay the application fee.
            """,
            retrieval_timestamp="2026-09-05T00:00:00Z"
        )
        mock_retriever_cls.return_value = mock_instance

        response = self.client.post("/tasks/from-procedure", json={"task": "renew passport", "use_gemini": False})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["task_id"], "task_auto")
        self.assertEqual(data["extraction_method"], "rule_based")
        self.assertEqual(len(data["steps"]), 3)


if __name__ == "__main__":
    unittest.main()

"""
Tests for GeminiFlashLiteClient with mocked google.genai via sys.modules.

Ensures no live network calls or real google-genai dependency are needed.
"""

import os
import sys
import types
from unittest.mock import MagicMock

import pytest


def _setup_mock_google_genai():
    """Create and install a fake google.genai module tree in sys.modules."""
    mock_google = types.ModuleType("google")
    mock_genai = types.ModuleType("google.genai")
    mock_types = types.ModuleType("google.genai.types")

    class FakeThinkingConfig:
        def __init__(self, thinking_level: str = "minimal"):
            self.thinking_level = thinking_level

    class FakeGenerateContentConfig:
        def __init__(self, thinking_config=None):
            self.thinking_config = thinking_config

    class FakeResponse:
        def __init__(self, text: str):
            self.text = text

    class FakeModels:
        def __init__(self):
            self.last_call = {}
            self.return_text = "Standard rewritten instruction."

        def generate_content(self, model: str, contents: str, config=None):
            self.last_call = {
                "model": model,
                "contents": contents,
                "config": config,
            }
            return FakeResponse(self.return_text)

    class FakeClient:
        def __init__(self, api_key: str):
            self.api_key = api_key
            self.models = FakeModels()

    mock_types.ThinkingConfig = FakeThinkingConfig
    mock_types.GenerateContentConfig = FakeGenerateContentConfig
    mock_genai.Client = FakeClient
    mock_genai.types = mock_types
    mock_google.genai = mock_genai

    sys.modules["google"] = mock_google
    sys.modules["google.genai"] = mock_genai
    sys.modules["google.genai.types"] = mock_types

    return FakeClient


@pytest.fixture(autouse=True)
def setup_genai_environment(monkeypatch):
    """Ensure google.genai is stubbed and environment is clean for each test."""
    # Ensure GEMINI_API_KEY is clean unless explicitly set in a test
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    _setup_mock_google_genai()
    yield


def test_missing_api_key_raises_value_error():
    from step_intelligence.providers.gemini import GeminiFlashLiteClient

    with pytest.raises(ValueError, match="No Gemini API key provided"):
        GeminiFlashLiteClient()


def test_env_var_api_key_is_picked_up(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "env-secret-key-123")
    from step_intelligence.providers.gemini import GeminiFlashLiteClient

    client = GeminiFlashLiteClient()
    assert client._client.api_key == "env-secret-key-123"


def test_explicit_api_key_overrides_env(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "env-key")
    from step_intelligence.providers.gemini import GeminiFlashLiteClient

    client = GeminiFlashLiteClient(api_key="explicit-key-456")
    assert client._client.api_key == "explicit-key-456"


def test_generate_sends_correct_model_and_prompt():
    from step_intelligence.providers.gemini import GeminiFlashLiteClient

    client = GeminiFlashLiteClient(api_key="test-key")
    client._client.models.return_text = "Generated result"

    result = client.generate("Rewrite this instruction")
    assert result == "Generated result"

    last_call = client._client.models.last_call
    assert last_call["model"] == "gemini-3.5-flash-lite"
    assert last_call["contents"] == "Rewrite this instruction"
    assert last_call["config"].thinking_config.thinking_level == "minimal"


def test_generate_custom_model_and_thinking_level():
    from step_intelligence.providers.gemini import GeminiFlashLiteClient

    client = GeminiFlashLiteClient(
        api_key="test-key",
        model_name="custom-model-id",
        thinking_level="high",
    )
    client._client.models.return_text = "Custom output"

    result = client.generate("Custom prompt")
    assert result == "Custom output"

    last_call = client._client.models.last_call
    assert last_call["model"] == "custom-model-id"
    assert last_call["config"].thinking_config.thinking_level == "high"


def test_empty_response_raises_runtime_error():
    from step_intelligence.providers.gemini import GeminiFlashLiteClient

    client = GeminiFlashLiteClient(api_key="test-key")
    client._client.models.return_text = ""

    with pytest.raises(RuntimeError, match="returned an empty response"):
        client.generate("Some prompt")


def test_missing_google_genai_package_raises_import_error(monkeypatch):
    # Simulate google-genai not installed
    monkeypatch.setitem(sys.modules, "google", None)
    monkeypatch.setitem(sys.modules, "google.genai", None)

    from step_intelligence.providers.gemini import GeminiFlashLiteClient

    with pytest.raises(ImportError, match="requires the 'google-genai' package"):
        GeminiFlashLiteClient(api_key="test-key")

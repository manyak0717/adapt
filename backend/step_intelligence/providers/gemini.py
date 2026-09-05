"""
Gemini 3.5 Flash-Lite implementation of the `LLMClient` protocol
(`step_intelligence.step_intelligence.generator.LLMClient`).

Flash-Lite is Google's fastest, lowest-cost 3.5-generation model — a good
fit here since this module only ever asks the LLM to rewrite one short
step instruction at a time (standard / simplified / micro-steps), not do
long-form generation or complex multi-step reasoning.

Nothing else in this package depends on this file. `pipeline.py` only
depends on the `LLMClient` protocol (a single `generate(prompt) -> str`
method), so swapping providers again later means writing a new class here
and passing it in — no changes anywhere else.

Setup
-----
    pip install google-genai

    export GEMINI_API_KEY="your-api-key"   # or pass api_key= explicitly

Usage
-----
    from step_intelligence.step_intelligence.providers.gemini import GeminiFlashLiteClient
    from step_intelligence.pipeline import run_adaptation_pipeline

    llm_client = GeminiFlashLiteClient()
    result = run_adaptation_pipeline(module_input, llm_client=llm_client)
"""

from __future__ import annotations

import os
from typing import Optional


class GeminiFlashLiteClient:
    """LLMClient backed by Gemini 3.5 Flash-Lite (`gemini-3.5-flash-lite`)."""

    MODEL_NAME = "gemini-3.5-flash-lite"

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        thinking_level: str = "minimal",
    ):
        """
        Parameters
        ----------
        api_key:
            Gemini API key. Falls back to the `GEMINI_API_KEY` environment
            variable if omitted.
        model_name:
            Override the model id (defaults to `gemini-3.5-flash-lite`).
        thinking_level:
            One of "minimal" / "low" / "medium" / "high". Defaults to
            "minimal" since instruction rewriting is a lightweight task
            and Flash-Lite is priced/optimized for high-throughput, low-
            latency use — no need to pay for deeper reasoning here. Note:
            Flash-Lite does not support custom temperature/top-p/top-k;
            those settings are intentionally left untouched.
        """
        try:
            from google import genai
            from google.genai import types
        except ImportError as exc:  # pragma: no cover - import guard
            raise ImportError(
                "GeminiFlashLiteClient requires the 'google-genai' package. "
                "Install it with: pip install google-genai"
            ) from exc

        resolved_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not resolved_key:
            raise ValueError(
                "No Gemini API key provided. Pass api_key=... or set the "
                "GEMINI_API_KEY environment variable."
            )

        self._client = genai.Client(api_key=resolved_key)
        self._types = types
        self._model_name = model_name or self.MODEL_NAME
        self._thinking_level = thinking_level

    def generate(self, prompt: str) -> str:
        response = self._client.models.generate_content(
            model=self._model_name,
            contents=prompt,
            config=self._types.GenerateContentConfig(
                thinking_config=self._types.ThinkingConfig(
                    thinking_level=self._thinking_level
                )
            ),
        )
        text = getattr(response, "text", None)
        if not text:
            raise RuntimeError(
                f"Gemini ({self._model_name}) returned an empty response "
                "for this prompt."
            )
        return text.strip()

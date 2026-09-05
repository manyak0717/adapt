"""
Step Intelligence: turns a raw step instruction into three variants using an
LLM. The LLM provider is deliberately abstracted behind `LLMClient` so this
module isn't coupled to a specific vendor/SDK before that decision is made.

To wire in a real provider later, implement `LLMClient.generate` (e.g. an
Anthropic Messages API call or Gemini Client) and pass an instance into
`StepInstructionGenerator` G�� nothing else in this file or in pipeline.py
needs to change.
"""

from __future__ import annotations

import re
from typing import List, Protocol, runtime_checkable

from step_intelligence.models.step_input import StepData
from step_intelligence.models.ui_config_output import StepIntelligenceOutput
from step_intelligence.prompts import (
    MICRO_STEPS_PROMPT,
    SIMPLIFIED_INSTRUCTION_PROMPT,
    STANDARD_INSTRUCTION_PROMPT,
)


@runtime_checkable
class LLMClient(Protocol):
    """Minimal interface any LLM provider integration must satisfy."""

    def generate(self, prompt: str) -> str:
        """Return the raw text completion for `prompt`."""
        ...


class StaticLLMClient:
    """
    Deterministic, network-free stand-in for a real LLM client.

    Used for tests and for local development before an LLM provider is
    wired in. It performs simple, rule-based text transforms rather than
    calling any model, so pipeline behaviour stays fully testable offline.
    """

    def generate(self, prompt: str) -> str:
        if "micro-step" in prompt.lower() or "micro steps" in prompt.lower():
            instruction = _extract_instruction_from_prompt(prompt)
            clauses = re.split(r",| and ", instruction)
            clauses = [c.strip().rstrip(".") for c in clauses if c.strip()]
            if not clauses:
                clauses = [instruction]
            return "\n".join(f"{i + 1}. {c}" for i, c in enumerate(clauses))

        instruction = _extract_instruction_from_prompt(prompt)
        if "plain-language" in prompt.lower() or "simple everyday" in prompt.lower():
            return f"Simple version: {instruction}"
        return instruction


def _extract_instruction_from_prompt(prompt: str) -> str:
    match = re.search(r"Original instruction:\s*(.+)", prompt)
    return match.group(1).strip() if match else prompt.strip()


class StepInstructionGenerator:
    """Generates the three instruction variants for a single step."""

    def __init__(self, llm_client: LLMClient):
        self._llm = llm_client

    def generate(self, step: StepData) -> StepIntelligenceOutput:
        standard = self._llm.generate(
            STANDARD_INSTRUCTION_PROMPT.format(
                title=step.title, raw_instruction=step.raw_instruction
            )
        ).strip()

        simplified = self._llm.generate(
            SIMPLIFIED_INSTRUCTION_PROMPT.format(
                title=step.title, raw_instruction=step.raw_instruction
            )
        ).strip()

        micro_raw = self._llm.generate(
            MICRO_STEPS_PROMPT.format(
                title=step.title, raw_instruction=step.raw_instruction
            )
        ).strip()
        micro_steps = _parse_micro_steps(micro_raw)

        return StepIntelligenceOutput(
            standard_instruction=standard,
            simplified_instruction=simplified,
            micro_steps=micro_steps,
        )


def _parse_micro_steps(raw: str) -> List[str]:
    lines = [line.strip() for line in raw.splitlines() if line.strip()]
    cleaned = []
    for line in lines:
        # Strip a leading "1. " / "1) " / "- " style marker if present.
        stripped = re.sub(r"^\s*(\d+[.)]|-)\s*", "", line)
        if stripped:
            cleaned.append(stripped)
    return cleaned or [raw]

"""
Public entrypoint and orchestrator for the step_intelligence module.

Runs the four sub-engines in order:
  1. Step Intelligence    -> 3 instruction variants (standard, simplified, micro_steps)
  2. Interaction Analysis -> detected behavioural patterns (hesitation, repeated_help, etc.)
  3. Difficulty Engine    -> 0-100 score + support level (LOW / MEDIUM / HIGH) + breakdown
  4. Adaptation Engine    -> deterministic UIConfig (layout, input_mode, instruction_mode)
  5. Active Instruction   -> pre-selected instruction string per ui_config.instruction_mode
"""

from __future__ import annotations

from typing import Optional

from step_intelligence.adaptation_engine.adapter import build_ui_config
from step_intelligence.config import InstructionMode
from step_intelligence.difficulty_engine.scorer import compute_difficulty
from step_intelligence.interaction_analysis.analyzer import analyze_interaction
from step_intelligence.models.step_input import ModuleInput
from step_intelligence.models.ui_config_output import AdaptiveResponse, StepIntelligenceOutput
from step_intelligence.generator import (
    LLMClient,
    StaticLLMClient,
    StepInstructionGenerator,
)


def _select_active_instruction(
    instruction_mode: InstructionMode,
    step_intelligence: StepIntelligenceOutput,
) -> str:
    """Pre-select the single active instruction string to render."""
    if instruction_mode == InstructionMode.STANDARD:
        return step_intelligence.standard_instruction
    if instruction_mode == InstructionMode.SIMPLE:
        return step_intelligence.simplified_instruction
    if instruction_mode == InstructionMode.MICRO_STEPS:
        return "\n".join(
            f"{i + 1}. {step}"
            for i, step in enumerate(step_intelligence.micro_steps)
        )
    return step_intelligence.standard_instruction


def run_adaptation_pipeline(
    module_input: ModuleInput,
    llm_client: Optional[LLMClient] = None,
) -> AdaptiveResponse:
    """
    Run the full end-to-end adaptation pipeline for a single step attempt.

    Parameters
    ----------
    module_input:
        Structured step definition and raw interaction metrics.
    llm_client:
        Optional LLMClient instance (e.g. GeminiFlashLiteClient). Defaults to
        the deterministic offline StaticLLMClient for network-free use.

    Returns
    -------
    AdaptiveResponse:
        Pydantic model containing all generated variants, detected patterns,
        difficulty score + breakdown, ui_config, and the active instruction string.
    """
    client = llm_client if llm_client is not None else StaticLLMClient()

    # 1. Step Intelligence: generate the 3 instruction variants
    generator = StepInstructionGenerator(client)
    step_intel = generator.generate(module_input.step)

    # 2. Interaction Analysis: detect behavioural struggle patterns
    patterns = analyze_interaction(module_input.metrics)

    # 3. Difficulty Engine: compute transparent 0-100 score + support level
    difficulty = compute_difficulty(module_input.metrics)

    # 4. Adaptation Engine: map (field_type, support_level, patterns) -> UIConfig
    ui_config = build_ui_config(
        field_type=module_input.step.field_type,
        support_level=difficulty.support_level,
        patterns=patterns,
    )

    # 5. Pre-select active instruction
    active_instruction = _select_active_instruction(
        ui_config.instruction_mode, step_intel
    )

    return AdaptiveResponse(
        step_id=module_input.step.step_id,
        step_intelligence=step_intel,
        patterns=patterns,
        difficulty=difficulty,
        ui_config=ui_config,
        active_instruction=active_instruction,
    )

"""
Output contract: what this module hands back, ready for the frontend to
consume as-is. Nothing here is React-specific or framework-specific — it is
plain structured JSON via pydantic's `model_dump()` / `model_dump_json()`.
"""

from __future__ import annotations

from typing import Dict, List

from pydantic import BaseModel, Field

from step_intelligence.config import InputMode, InstructionMode, Layout, SupportLevel


class StepIntelligenceOutput(BaseModel):
    standard_instruction: str
    simplified_instruction: str
    micro_steps: List[str]


class DetectedPatterns(BaseModel):
    hesitation: bool = False
    repeated_help: bool = False
    typing_difficulty: bool = False
    navigation_difficulty: bool = False


class DifficultyResult(BaseModel):
    score: float = Field(..., ge=0, le=100)
    support_level: SupportLevel
    breakdown: Dict[str, float] = Field(
        default_factory=dict,
        description="Per-component normalized scores (0-100) that were "
        "combined to produce `score`, keyed by metric name. Kept explicit "
        "for transparency/debuggability.",
    )


class UIConfig(BaseModel):
    layout: Layout
    input_mode: InputMode
    instruction_mode: InstructionMode


class AdaptiveResponse(BaseModel):
    step_id: str
    step_intelligence: StepIntelligenceOutput
    patterns: DetectedPatterns
    difficulty: DifficultyResult
    ui_config: UIConfig
    active_instruction: str = Field(
        ...,
        description="The single instruction string the frontend should "
        "actually render, pre-selected according to ui_config.instruction_mode "
        "(standard_instruction / simplified_instruction, or the micro_steps "
        "joined for display — frontend can still access all three via "
        "step_intelligence if it needs them).",
    )

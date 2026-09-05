"""
step_intelligence: Adaptive UI & Step Intelligence for ADAPT.

Public Entrypoint:
    `run_adaptation_pipeline(module_input, llm_client=None)`
"""

from step_intelligence.config import (
    FieldType,
    InputMode,
    InstructionMode,
    Layout,
    SupportLevel,
)
from step_intelligence.models.step_input import (
    InteractionMetrics,
    ModuleInput,
    StepData,
)
from step_intelligence.models.ui_config_output import (
    AdaptiveResponse,
    DetectedPatterns,
    DifficultyResult,
    StepIntelligenceOutput,
    UIConfig,
)
from step_intelligence.pipeline import run_adaptation_pipeline
from step_intelligence.step_intelligence.generator import (
    LLMClient,
    StaticLLMClient,
    StepInstructionGenerator,
)
from step_intelligence.step_intelligence.providers.gemini import GeminiFlashLiteClient

__all__ = [
    "run_adaptation_pipeline",
    "ModuleInput",
    "StepData",
    "InteractionMetrics",
    "AdaptiveResponse",
    "UIConfig",
    "DifficultyResult",
    "DetectedPatterns",
    "StepIntelligenceOutput",
    "LLMClient",
    "StaticLLMClient",
    "StepInstructionGenerator",
    "GeminiFlashLiteClient",
    "FieldType",
    "SupportLevel",
    "Layout",
    "InputMode",
    "InstructionMode",
]

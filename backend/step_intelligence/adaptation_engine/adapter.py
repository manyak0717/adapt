"""
Adaptation Engine: the only place allowed to decide layout / input_mode /
instruction_mode. Every function here returns a value from the `Layout`,
`InputMode`, or `InstructionMode` enums in config.py — never a free-form
string — so the output is guaranteed valid for the frontend to consume.

The rules below are an explicit, documented first pass. They're written as
small pure functions specifically so the mapping can be tuned or replaced
without touching the rest of the pipeline.
"""

from __future__ import annotations

from step_intelligence.config import (
    FieldType,
    InputMode,
    InstructionMode,
    Layout,
    SupportLevel,
)
from step_intelligence.models.ui_config_output import DetectedPatterns, UIConfig

_INSTRUCTION_ORDER = [
    InstructionMode.STANDARD,
    InstructionMode.SIMPLE,
    InstructionMode.MICRO_STEPS,
]

_BASE_INSTRUCTION_MODE_BY_SUPPORT = {
    SupportLevel.LOW: InstructionMode.STANDARD,
    SupportLevel.MEDIUM: InstructionMode.SIMPLE,
    SupportLevel.HIGH: InstructionMode.MICRO_STEPS,
}

_BASE_INPUT_MODE_BY_FIELD_TYPE = {
    FieldType.DATE: InputMode.DATE_PICKER,
    FieldType.CONFIRMATION: InputMode.YES_NO,
    FieldType.NUMBER: InputMode.NUMBER_SELECTOR,
    FieldType.CHOICE: InputMode.SUGGESTIONS,
    # FREE_TEXT is handled separately below since it has the most
    # support-level-dependent variation.
}


def select_layout(support_level: SupportLevel, patterns: DetectedPatterns) -> Layout:
    """
    HIGH support + compounding navigation/typing struggle -> RECOVERY
    (the user appears stuck, not just slow).
    HIGH support alone                                    -> FOCUSED
    MEDIUM support                                         -> GUIDED
    LOW support                                            -> STANDARD
    """
    if support_level == SupportLevel.HIGH and (
        patterns.navigation_difficulty or patterns.typing_difficulty
    ):
        return Layout.RECOVERY
    if support_level == SupportLevel.HIGH:
        return Layout.FOCUSED
    if support_level == SupportLevel.MEDIUM:
        return Layout.GUIDED
    return Layout.STANDARD


def select_input_mode(
    field_type: FieldType, support_level: SupportLevel, patterns: DetectedPatterns
) -> InputMode:
    """
    Non-free-text fields keep their natural specialized control
    (date picker / yes-no / number selector / suggestions) regardless of
    difficulty — those controls are already the accessible choice.

    Free-text fields escalate based on detected difficulty:
      typing_difficulty + HIGH support -> simplified_keyboard
      typing_difficulty                -> large_keyboard
      HIGH support + repeated_help     -> voice (offer an alternative
                                           modality entirely)
      HIGH support alone               -> large_keyboard
      otherwise                        -> keyboard
    """
    if field_type in _BASE_INPUT_MODE_BY_FIELD_TYPE:
        return _BASE_INPUT_MODE_BY_FIELD_TYPE[field_type]

    # field_type == FieldType.FREE_TEXT
    if patterns.typing_difficulty and support_level == SupportLevel.HIGH:
        return InputMode.SIMPLIFIED_KEYBOARD
    if patterns.typing_difficulty:
        return InputMode.LARGE_KEYBOARD
    if support_level == SupportLevel.HIGH and patterns.repeated_help:
        return InputMode.VOICE
    if support_level == SupportLevel.HIGH:
        return InputMode.LARGE_KEYBOARD
    return InputMode.KEYBOARD


def select_instruction_mode(
    support_level: SupportLevel, patterns: DetectedPatterns
) -> InstructionMode:
    """
    Base mode comes from support level (LOW->standard, MEDIUM->simple,
    HIGH->micro_steps). If repeated_help is also detected, escalate one
    step further (never past micro_steps) since the user has already
    signalled the current instruction level isn't enough.
    """
    base = _BASE_INSTRUCTION_MODE_BY_SUPPORT[support_level]
    if patterns.repeated_help:
        idx = _INSTRUCTION_ORDER.index(base)
        base = _INSTRUCTION_ORDER[min(idx + 1, len(_INSTRUCTION_ORDER) - 1)]
    return base


def build_ui_config(
    field_type: FieldType,
    support_level: SupportLevel,
    patterns: DetectedPatterns,
) -> UIConfig:
    return UIConfig(
        layout=select_layout(support_level, patterns),
        input_mode=select_input_mode(field_type, support_level, patterns),
        instruction_mode=select_instruction_mode(support_level, patterns),
    )

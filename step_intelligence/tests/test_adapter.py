"""
Unit tests for the deterministic adaptation engine.
"""

from step_intelligence.adaptation_engine.adapter import (
    build_ui_config,
    select_input_mode,
    select_instruction_mode,
    select_layout,
)
from step_intelligence.config import (
    FieldType,
    InputMode,
    InstructionMode,
    Layout,
    SupportLevel,
)
from step_intelligence.models.ui_config_output import DetectedPatterns


def _make_patterns(**kwargs) -> DetectedPatterns:
    defaults = {
        "hesitation": False,
        "repeated_help": False,
        "typing_difficulty": False,
        "navigation_difficulty": False,
    }
    defaults.update(kwargs)
    return DetectedPatterns(**defaults)


# ---------------------------------------------------------------------------
# Layout Selection Tests
# ---------------------------------------------------------------------------


def test_layout_low_support():
    patterns = _make_patterns()
    assert select_layout(SupportLevel.LOW, patterns) == Layout.STANDARD


def test_layout_medium_support():
    patterns = _make_patterns()
    assert select_layout(SupportLevel.MEDIUM, patterns) == Layout.GUIDED


def test_layout_high_support_alone():
    patterns = _make_patterns()
    assert select_layout(SupportLevel.HIGH, patterns) == Layout.FOCUSED


def test_layout_high_support_with_navigation_difficulty():
    patterns = _make_patterns(navigation_difficulty=True)
    assert select_layout(SupportLevel.HIGH, patterns) == Layout.RECOVERY


def test_layout_high_support_with_typing_difficulty():
    patterns = _make_patterns(typing_difficulty=True)
    assert select_layout(SupportLevel.HIGH, patterns) == Layout.RECOVERY


def test_layout_high_support_with_both_difficulties():
    patterns = _make_patterns(navigation_difficulty=True, typing_difficulty=True)
    assert select_layout(SupportLevel.HIGH, patterns) == Layout.RECOVERY


# ---------------------------------------------------------------------------
# Instruction Mode Selection Tests
# ---------------------------------------------------------------------------


def test_instruction_mode_low_no_help():
    patterns = _make_patterns(repeated_help=False)
    assert select_instruction_mode(SupportLevel.LOW, patterns) == InstructionMode.STANDARD


def test_instruction_mode_low_with_repeated_help():
    # Escalates from STANDARD to SIMPLE
    patterns = _make_patterns(repeated_help=True)
    assert select_instruction_mode(SupportLevel.LOW, patterns) == InstructionMode.SIMPLE


def test_instruction_mode_medium_no_help():
    patterns = _make_patterns(repeated_help=False)
    assert select_instruction_mode(SupportLevel.MEDIUM, patterns) == InstructionMode.SIMPLE


def test_instruction_mode_medium_with_repeated_help():
    # Escalates from SIMPLE to MICRO_STEPS
    patterns = _make_patterns(repeated_help=True)
    assert select_instruction_mode(SupportLevel.MEDIUM, patterns) == InstructionMode.MICRO_STEPS


def test_instruction_mode_high_no_help():
    patterns = _make_patterns(repeated_help=False)
    assert select_instruction_mode(SupportLevel.HIGH, patterns) == InstructionMode.MICRO_STEPS


def test_instruction_mode_high_with_repeated_help():
    # Stays at MICRO_STEPS (capped)
    patterns = _make_patterns(repeated_help=True)
    assert select_instruction_mode(SupportLevel.HIGH, patterns) == InstructionMode.MICRO_STEPS


# ---------------------------------------------------------------------------
# Input Mode Selection Tests (Specialized & Free Text)
# ---------------------------------------------------------------------------


def test_input_mode_non_free_text_fields_preserve_controls():
    """Non-free-text fields must ignore difficulty patterns and retain their natural controls."""
    high_struggle = _make_patterns(
        hesitation=True,
        repeated_help=True,
        typing_difficulty=True,
        navigation_difficulty=True,
    )

    assert select_input_mode(FieldType.DATE, SupportLevel.HIGH, high_struggle) == InputMode.DATE_PICKER
    assert select_input_mode(FieldType.NUMBER, SupportLevel.HIGH, high_struggle) == InputMode.NUMBER_SELECTOR
    assert select_input_mode(FieldType.CONFIRMATION, SupportLevel.HIGH, high_struggle) == InputMode.YES_NO
    assert select_input_mode(FieldType.CHOICE, SupportLevel.HIGH, high_struggle) == InputMode.SUGGESTIONS


def test_input_mode_free_text_nominal():
    clean = _make_patterns()
    assert select_input_mode(FieldType.FREE_TEXT, SupportLevel.LOW, clean) == InputMode.KEYBOARD
    assert select_input_mode(FieldType.FREE_TEXT, SupportLevel.MEDIUM, clean) == InputMode.KEYBOARD


def test_input_mode_free_text_high_support_alone():
    clean = _make_patterns()
    assert select_input_mode(FieldType.FREE_TEXT, SupportLevel.HIGH, clean) == InputMode.LARGE_KEYBOARD


def test_input_mode_free_text_typing_difficulty_low_or_medium():
    patterns = _make_patterns(typing_difficulty=True)
    assert select_input_mode(FieldType.FREE_TEXT, SupportLevel.LOW, patterns) == InputMode.LARGE_KEYBOARD
    assert select_input_mode(FieldType.FREE_TEXT, SupportLevel.MEDIUM, patterns) == InputMode.LARGE_KEYBOARD


def test_input_mode_free_text_typing_difficulty_high_support():
    patterns = _make_patterns(typing_difficulty=True)
    assert select_input_mode(FieldType.FREE_TEXT, SupportLevel.HIGH, patterns) == InputMode.SIMPLIFIED_KEYBOARD


def test_input_mode_free_text_high_support_with_repeated_help():
    patterns = _make_patterns(repeated_help=True, typing_difficulty=False)
    assert select_input_mode(FieldType.FREE_TEXT, SupportLevel.HIGH, patterns) == InputMode.VOICE


# ---------------------------------------------------------------------------
# Full UIConfig Builder Tests
# ---------------------------------------------------------------------------


def test_build_ui_config_complete():
    patterns = _make_patterns(typing_difficulty=True)
    ui_config = build_ui_config(
        field_type=FieldType.FREE_TEXT,
        support_level=SupportLevel.HIGH,
        patterns=patterns,
    )
    assert ui_config.layout == Layout.RECOVERY
    assert ui_config.input_mode == InputMode.SIMPLIFIED_KEYBOARD
    assert ui_config.instruction_mode == InstructionMode.MICRO_STEPS

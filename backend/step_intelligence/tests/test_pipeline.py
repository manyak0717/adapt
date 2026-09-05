"""
End-to-end integration tests for the full adaptation pipeline.
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
from step_intelligence.pipeline import run_adaptation_pipeline
from step_intelligence.generator import StaticLLMClient


def test_pipeline_low_difficulty_nominal():
    """
    End-to-end run for a nominal attempt:
    - field_type: FREE_TEXT
    - time_spent == expected_time, 0 errors/help/backtracks
    - Expect LOW difficulty (score 0.0), STANDARD layout, KEYBOARD input, STANDARD instruction
    """
    step = StepData(
        step_id="step-1",
        title="Enter Username",
        raw_instruction="Enter your username or email address, and click next.",
        field_type=FieldType.FREE_TEXT,
    )
    metrics = InteractionMetrics(
        time_spent=10.0,
        expected_time=10.0,
        help_requests=0,
        instruction_replays=0,
        backtracks=0,
        input_errors=0,
        input_pauses=0,
    )
    module_input = ModuleInput(step=step, metrics=metrics, user_id="user_abc")

    response = run_adaptation_pipeline(module_input, llm_client=StaticLLMClient())

    # Verify root fields
    assert response.step_id == "step-1"
    assert response.difficulty.score == 0.0
    assert response.difficulty.support_level == SupportLevel.LOW

    # Verify patterns
    assert not response.patterns.hesitation
    assert not response.patterns.repeated_help
    assert not response.patterns.typing_difficulty
    assert not response.patterns.navigation_difficulty

    # Verify UI config
    assert response.ui_config.layout == Layout.STANDARD
    assert response.ui_config.input_mode == InputMode.KEYBOARD
    assert response.ui_config.instruction_mode == InstructionMode.STANDARD

    # Verify active instruction is the standard variant
    assert response.active_instruction == response.step_intelligence.standard_instruction
    assert len(response.step_intelligence.micro_steps) > 0

    # Verify full JSON serialization via model_dump()
    data = response.model_dump()
    assert isinstance(data, dict)
    assert data["step_id"] == "step-1"
    assert data["ui_config"]["layout"] == "standard"
    assert data["ui_config"]["input_mode"] == "keyboard"
    assert data["ui_config"]["instruction_mode"] == "standard"
    assert data["difficulty"]["support_level"] == "LOW"


def test_pipeline_high_difficulty_struggle():
    """
    End-to-end run for a high struggle attempt:
    - field_type: FREE_TEXT
    - long dwell, typing errors, backtracks, repeated help
    - Expect HIGH difficulty, RECOVERY layout, SIMPLIFIED_KEYBOARD, MICRO_STEPS
    """
    step = StepData(
        step_id="step-high",
        title="Enter Password",
        raw_instruction="Enter your secure password, and confirm your credentials.",
        field_type=FieldType.FREE_TEXT,
    )
    metrics = InteractionMetrics(
        time_spent=45.0,
        expected_time=10.0,
        help_requests=3,
        instruction_replays=2,
        backtracks=3,
        input_errors=5,
        input_pauses=4,
    )
    module_input = ModuleInput(step=step, metrics=metrics, user_id="user_xyz")

    response = run_adaptation_pipeline(module_input)  # Uses default StaticLLMClient

    # Verify difficulty
    assert response.difficulty.score > 66.0
    assert response.difficulty.support_level == SupportLevel.HIGH

    # Verify patterns
    assert response.patterns.hesitation
    assert response.patterns.repeated_help
    assert response.patterns.typing_difficulty
    assert response.patterns.navigation_difficulty

    # Verify UI config escalation
    assert response.ui_config.layout == Layout.RECOVERY
    assert response.ui_config.input_mode == InputMode.SIMPLIFIED_KEYBOARD
    assert response.ui_config.instruction_mode == InstructionMode.MICRO_STEPS

    # Verify active instruction is formatted micro-steps
    assert "1. " in response.active_instruction

    # Verify JSON serialization
    data = response.model_dump()
    assert data["step_id"] == "step-high"
    assert data["ui_config"]["layout"] == "recovery"
    assert data["ui_config"]["input_mode"] == "simplified_keyboard"
    assert data["ui_config"]["instruction_mode"] == "micro_steps"
    assert data["difficulty"]["support_level"] == "HIGH"
    assert "time_ratio" in data["difficulty"]["breakdown"]


def test_pipeline_specialized_field_type():
    """
    Specialized field (DATE) with medium difficulty retains DATE_PICKER.
    """
    step = StepData(
        step_id="step-date",
        title="Select Birth Date",
        raw_instruction="Choose your date of birth from the calendar.",
        field_type=FieldType.DATE,
    )
    metrics = InteractionMetrics(
        time_spent=25.0,
        expected_time=10.0,
        help_requests=2,
        instruction_replays=0,
        backtracks=0,
        input_errors=0,
        input_pauses=0,
    )
    module_input = ModuleInput(step=step, metrics=metrics)

    response = run_adaptation_pipeline(module_input)

    assert response.ui_config.input_mode == InputMode.DATE_PICKER
    assert response.ui_config.layout == Layout.STANDARD or response.ui_config.layout == Layout.GUIDED

"""
Single source of truth for all enums, tunable thresholds, and weighting
constants used across the `step_intelligence` package.
"""

from __future__ import annotations

from enum import Enum
from typing import Dict


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class FieldType(str, Enum):
    """Input shape / field category for a step."""

    FREE_TEXT = "free_text"
    DATE = "date"
    NUMBER = "number"
    CONFIRMATION = "confirmation"
    CHOICE = "choice"


class SupportLevel(str, Enum):
    """Overall support category derived from difficulty scoring."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class Layout(str, Enum):
    """Adaptive UI layout presentation modes."""

    STANDARD = "standard"
    GUIDED = "guided"
    FOCUSED = "focused"
    RECOVERY = "recovery"


class InputMode(str, Enum):
    """Adaptive UI input controls."""

    KEYBOARD = "keyboard"
    LARGE_KEYBOARD = "large_keyboard"
    SIMPLIFIED_KEYBOARD = "simplified_keyboard"
    SUGGESTIONS = "suggestions"
    VOICE = "voice"
    YES_NO = "yes_no"
    DATE_PICKER = "date_picker"
    NUMBER_SELECTOR = "number_selector"


class InstructionMode(str, Enum):
    """Instruction presentation formats."""

    STANDARD = "standard"
    SIMPLE = "simple"
    MICRO_STEPS = "micro_steps"


# ---------------------------------------------------------------------------
# Interaction Analysis Thresholds
# ---------------------------------------------------------------------------

HESITATION_TIME_RATIO_THRESHOLD: float = 2.0
HESITATION_MIN_PAUSES: int = 3

REPEATED_HELP_HELP_REQUESTS_THRESHOLD: int = 2
REPEATED_HELP_REPLAYS_THRESHOLD: int = 2

TYPING_DIFFICULTY_INPUT_ERRORS_THRESHOLD: int = 3
NAVIGATION_DIFFICULTY_BACKTRACKS_THRESHOLD: int = 2


# ---------------------------------------------------------------------------
# Difficulty Engine Normalization & Weights
# ---------------------------------------------------------------------------

# Baseline values that map to 0.0 contribution.
# Note: time_ratio baseline is 1.0 (nominal completion time -> 0 difficulty contribution).
DIFFICULTY_NORMALIZATION_BASELINES: Dict[str, float] = {
    "time_ratio": 1.0,
    "help_requests": 0.0,
    "instruction_replays": 0.0,
    "backtracks": 0.0,
    "input_errors": 0.0,
    "input_pauses": 0.0,
}

# Raw values that map to 100.0 contribution (values above cap are clamped).
DIFFICULTY_NORMALIZATION_CAPS: Dict[str, float] = {
    "time_ratio": 4.0,
    "help_requests": 4.0,
    "instruction_replays": 4.0,
    "backtracks": 4.0,
    "input_errors": 6.0,
    "input_pauses": 6.0,
}

# Per-metric weights summing to exactly 1.0.
DIFFICULTY_WEIGHTS: Dict[str, float] = {
    "time_ratio": 0.25,
    "help_requests": 0.20,
    "instruction_replays": 0.15,
    "backtracks": 0.15,
    "input_errors": 0.15,
    "input_pauses": 0.10,
}

# Score cutoff thresholds for mapping 0-100 score -> SupportLevel.
# score <= DIFFICULTY_SCORE_LOW_MAX -> LOW
# score <= DIFFICULTY_SCORE_MEDIUM_MAX -> MEDIUM
# score > DIFFICULTY_SCORE_MEDIUM_MAX -> HIGH
DIFFICULTY_SCORE_LOW_MAX: float = 33.0
DIFFICULTY_SCORE_MEDIUM_MAX: float = 66.0

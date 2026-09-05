"""
Interaction Analysis: pure functions over `InteractionMetrics` that flag
behavioural patterns. Every rule is a simple, named, threshold-based check
(thresholds live in config.py) so a reviewer can see exactly why a pattern
fired without digging through this code.
"""

from __future__ import annotations

from step_intelligence.config import (
    HESITATION_MIN_PAUSES,
    HESITATION_TIME_RATIO_THRESHOLD,
    NAVIGATION_DIFFICULTY_BACKTRACKS_THRESHOLD,
    REPEATED_HELP_HELP_REQUESTS_THRESHOLD,
    REPEATED_HELP_REPLAYS_THRESHOLD,
    TYPING_DIFFICULTY_INPUT_ERRORS_THRESHOLD,
)
from step_intelligence.models.step_input import InteractionMetrics
from step_intelligence.models.ui_config_output import DetectedPatterns


def detect_hesitation(metrics: InteractionMetrics) -> bool:
    """Long dwell time relative to expectation, or many input pauses."""
    return (
        metrics.time_ratio >= HESITATION_TIME_RATIO_THRESHOLD
        or metrics.input_pauses >= HESITATION_MIN_PAUSES
    )


def detect_repeated_help(metrics: InteractionMetrics) -> bool:
    """Repeated help requests or instruction replays."""
    return (
        metrics.help_requests >= REPEATED_HELP_HELP_REQUESTS_THRESHOLD
        or metrics.instruction_replays >= REPEATED_HELP_REPLAYS_THRESHOLD
    )


def detect_typing_difficulty(metrics: InteractionMetrics) -> bool:
    """Elevated input error count."""
    return metrics.input_errors >= TYPING_DIFFICULTY_INPUT_ERRORS_THRESHOLD


def detect_navigation_difficulty(metrics: InteractionMetrics) -> bool:
    """Elevated backtrack count (moving between steps/fields repeatedly)."""
    return metrics.backtracks >= NAVIGATION_DIFFICULTY_BACKTRACKS_THRESHOLD


def analyze_interaction(metrics: InteractionMetrics) -> DetectedPatterns:
    """Run every pattern detector and bundle the results."""
    return DetectedPatterns(
        hesitation=detect_hesitation(metrics),
        repeated_help=detect_repeated_help(metrics),
        typing_difficulty=detect_typing_difficulty(metrics),
        navigation_difficulty=detect_navigation_difficulty(metrics),
    )

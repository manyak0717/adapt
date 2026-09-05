"""
Unit tests for interaction analysis pattern detection.
"""

from step_intelligence.config import (
    HESITATION_MIN_PAUSES,
    HESITATION_TIME_RATIO_THRESHOLD,
    NAVIGATION_DIFFICULTY_BACKTRACKS_THRESHOLD,
    REPEATED_HELP_HELP_REQUESTS_THRESHOLD,
    REPEATED_HELP_REPLAYS_THRESHOLD,
    TYPING_DIFFICULTY_INPUT_ERRORS_THRESHOLD,
)
from step_intelligence.interaction_analysis.analyzer import (
    analyze_interaction,
    detect_hesitation,
    detect_navigation_difficulty,
    detect_repeated_help,
    detect_typing_difficulty,
)
from step_intelligence.models.step_input import InteractionMetrics


def _make_metrics(**kwargs) -> InteractionMetrics:
    defaults = {
        "time_spent": 10.0,
        "expected_time": 10.0,
        "help_requests": 0,
        "instruction_replays": 0,
        "backtracks": 0,
        "input_errors": 0,
        "input_pauses": 0,
    }
    defaults.update(kwargs)
    return InteractionMetrics(**defaults)


# ---------------------------------------------------------------------------
# Hesitation Tests
# ---------------------------------------------------------------------------


def test_hesitation_nominal_does_not_fire():
    metrics = _make_metrics(time_spent=10.0, expected_time=10.0, input_pauses=0)
    assert not detect_hesitation(metrics)


def test_hesitation_time_ratio_boundary():
    # Exactly at threshold
    metrics_at_boundary = _make_metrics(
        time_spent=10.0 * HESITATION_TIME_RATIO_THRESHOLD,
        expected_time=10.0,
        input_pauses=0,
    )
    assert detect_hesitation(metrics_at_boundary)

    # Just below threshold
    metrics_below = _make_metrics(
        time_spent=(10.0 * HESITATION_TIME_RATIO_THRESHOLD) - 0.1,
        expected_time=10.0,
        input_pauses=0,
    )
    assert not detect_hesitation(metrics_below)


def test_hesitation_pauses_boundary():
    # Exactly at threshold
    metrics_at_boundary = _make_metrics(
        time_spent=10.0,
        expected_time=10.0,
        input_pauses=HESITATION_MIN_PAUSES,
    )
    assert detect_hesitation(metrics_at_boundary)

    # Just below threshold
    metrics_below = _make_metrics(
        time_spent=10.0,
        expected_time=10.0,
        input_pauses=HESITATION_MIN_PAUSES - 1,
    )
    assert not detect_hesitation(metrics_below)


# ---------------------------------------------------------------------------
# Repeated Help Tests
# ---------------------------------------------------------------------------


def test_repeated_help_nominal():
    metrics = _make_metrics(help_requests=0, instruction_replays=0)
    assert not detect_repeated_help(metrics)


def test_repeated_help_requests_boundary():
    metrics_at = _make_metrics(help_requests=REPEATED_HELP_HELP_REQUESTS_THRESHOLD)
    assert detect_repeated_help(metrics_at)

    metrics_below = _make_metrics(help_requests=REPEATED_HELP_HELP_REQUESTS_THRESHOLD - 1)
    assert not detect_repeated_help(metrics_below)


def test_repeated_help_replays_boundary():
    metrics_at = _make_metrics(instruction_replays=REPEATED_HELP_REPLAYS_THRESHOLD)
    assert detect_repeated_help(metrics_at)

    metrics_below = _make_metrics(instruction_replays=REPEATED_HELP_REPLAYS_THRESHOLD - 1)
    assert not detect_repeated_help(metrics_below)


# ---------------------------------------------------------------------------
# Typing Difficulty Tests
# ---------------------------------------------------------------------------


def test_typing_difficulty_boundary():
    metrics_at = _make_metrics(input_errors=TYPING_DIFFICULTY_INPUT_ERRORS_THRESHOLD)
    assert detect_typing_difficulty(metrics_at)

    metrics_below = _make_metrics(
        input_errors=TYPING_DIFFICULTY_INPUT_ERRORS_THRESHOLD - 1
    )
    assert not detect_typing_difficulty(metrics_below)


# ---------------------------------------------------------------------------
# Navigation Difficulty Tests
# ---------------------------------------------------------------------------


def test_navigation_difficulty_boundary():
    metrics_at = _make_metrics(
        backtracks=NAVIGATION_DIFFICULTY_BACKTRACKS_THRESHOLD
    )
    assert detect_navigation_difficulty(metrics_at)

    metrics_below = _make_metrics(
        backtracks=NAVIGATION_DIFFICULTY_BACKTRACKS_THRESHOLD - 1
    )
    assert not detect_navigation_difficulty(metrics_below)


# ---------------------------------------------------------------------------
# Full Interaction Analysis Bundle Tests
# ---------------------------------------------------------------------------


def test_analyze_interaction_all_clean():
    metrics = _make_metrics()
    patterns = analyze_interaction(metrics)
    assert not patterns.hesitation
    assert not patterns.repeated_help
    assert not patterns.typing_difficulty
    assert not patterns.navigation_difficulty


def test_analyze_interaction_all_flagged():
    metrics = _make_metrics(
        time_spent=50.0,
        expected_time=10.0,
        help_requests=3,
        instruction_replays=3,
        backtracks=4,
        input_errors=5,
        input_pauses=6,
    )
    patterns = analyze_interaction(metrics)
    assert patterns.hesitation
    assert patterns.repeated_help
    assert patterns.typing_difficulty
    assert patterns.navigation_difficulty

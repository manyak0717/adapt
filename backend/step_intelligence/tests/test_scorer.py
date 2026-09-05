"""
Unit tests for the difficulty scoring engine.
"""

import pytest

from step_intelligence.config import (
    DIFFICULTY_NORMALIZATION_BASELINES,
    DIFFICULTY_NORMALIZATION_CAPS,
    DIFFICULTY_SCORE_LOW_MAX,
    DIFFICULTY_SCORE_MEDIUM_MAX,
    DIFFICULTY_WEIGHTS,
    SupportLevel,
)
from step_intelligence.difficulty_engine.scorer import (
    _normalize,
    compute_difficulty,
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
# Weight Invariants
# ---------------------------------------------------------------------------


def test_difficulty_weights_sum_to_one():
    """Weights MUST sum to exactly 1.0."""
    total_weight = sum(DIFFICULTY_WEIGHTS.values())
    assert total_weight == pytest.approx(1.0, abs=1e-6)


def test_difficulty_weights_match_normalization_keys():
    """All metrics in weights must exist in caps and baselines."""
    assert set(DIFFICULTY_WEIGHTS.keys()) == set(DIFFICULTY_NORMALIZATION_CAPS.keys())
    assert set(DIFFICULTY_WEIGHTS.keys()) == set(DIFFICULTY_NORMALIZATION_BASELINES.keys())


# ---------------------------------------------------------------------------
# Normalization Helper Tests
# ---------------------------------------------------------------------------


def test_normalize_at_baseline_is_zero():
    assert _normalize(value=1.0, cap=4.0, baseline=1.0) == 0.0


def test_normalize_below_baseline_clamped_to_zero():
    assert _normalize(value=0.5, cap=4.0, baseline=1.0) == 0.0


def test_normalize_at_cap_is_hundred():
    assert _normalize(value=4.0, cap=4.0, baseline=1.0) == 100.0


def test_normalize_above_cap_clamped_to_hundred():
    assert _normalize(value=10.0, cap=4.0, baseline=1.0) == 100.0


def test_normalize_midpoint():
    # baseline 1.0, cap 3.0 -> span = 2.0, value 2.0 -> ((2-1)/2)*100 = 50.0
    assert _normalize(value=2.0, cap=3.0, baseline=1.0) == pytest.approx(50.0)


# ---------------------------------------------------------------------------
# Difficulty Engine Computation Tests
# ---------------------------------------------------------------------------


def test_nominal_case_scores_zero():
    """
    CRITICAL REQUIREMENT: time_ratio == 1.0 (took exactly as long as expected)
    with 0 for all other metrics MUST yield a difficulty score of exactly 0.0,
    with LOW support level and 0.0 for every component in the breakdown.
    """
    metrics = _make_metrics(time_spent=10.0, expected_time=10.0)
    result = compute_difficulty(metrics)

    assert result.score == 0.0
    assert result.support_level == SupportLevel.LOW
    for metric_name, comp_score in result.breakdown.items():
        assert comp_score == 0.0, f"Component {metric_name} was not 0.0"


def test_faster_than_expected_scores_zero():
    """Completing faster than expected (time_ratio < 1.0) contributes 0."""
    metrics = _make_metrics(time_spent=5.0, expected_time=10.0)
    result = compute_difficulty(metrics)

    assert result.score == 0.0
    assert result.support_level == SupportLevel.LOW
    assert result.breakdown["time_ratio"] == 0.0


def test_maximum_metrics_clamp_to_hundred():
    """All metrics at or above caps must yield score 100.0 and SupportLevel.HIGH."""
    metrics = _make_metrics(
        time_spent=100.0,
        expected_time=10.0,
        help_requests=10,
        instruction_replays=10,
        backtracks=10,
        input_errors=20,
        input_pauses=20,
    )
    result = compute_difficulty(metrics)

    assert result.score == 100.0
    assert result.support_level == SupportLevel.HIGH
    for metric_name, comp_score in result.breakdown.items():
        assert comp_score == 100.0


def test_breakdown_transparency():
    """Breakdown contains exact per-metric normalized values."""
    # time_ratio = 2.5. Baseline 1.0, cap 4.0. Span = 3.0. ((2.5 - 1.0) / 3.0) * 100 = 50.0
    # help_requests = 2. Baseline 0.0, cap 4.0. Span = 4.0. (2 / 4) * 100 = 50.0
    # Other metrics 0.
    metrics = _make_metrics(
        time_spent=25.0,
        expected_time=10.0,
        help_requests=2,
    )
    result = compute_difficulty(metrics)

    assert result.breakdown["time_ratio"] == pytest.approx(50.0)
    assert result.breakdown["help_requests"] == pytest.approx(50.0)
    assert result.breakdown["input_errors"] == 0.0

    expected_score = round(50.0 * 0.25 + 50.0 * 0.20, 2)  # 12.5 + 10.0 = 22.5
    assert result.score == pytest.approx(expected_score)
    assert result.support_level == SupportLevel.LOW


def test_support_level_threshold_boundaries():
    """Verify score-to-support-level mapping at exact boundary constants."""
    # Mock / boundary checks:
    from step_intelligence.difficulty_engine.scorer import _score_to_support_level

    assert _score_to_support_level(0.0) == SupportLevel.LOW
    assert _score_to_support_level(DIFFICULTY_SCORE_LOW_MAX) == SupportLevel.LOW
    assert _score_to_support_level(DIFFICULTY_SCORE_LOW_MAX + 0.01) == SupportLevel.MEDIUM
    assert _score_to_support_level(DIFFICULTY_SCORE_MEDIUM_MAX) == SupportLevel.MEDIUM
    assert _score_to_support_level(DIFFICULTY_SCORE_MEDIUM_MAX + 0.01) == SupportLevel.HIGH
    assert _score_to_support_level(100.0) == SupportLevel.HIGH

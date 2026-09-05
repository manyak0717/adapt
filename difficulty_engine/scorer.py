"""
Difficulty Engine: computes a transparent 0-100 difficulty score from
interaction metrics and maps it to a support level.

"Transparent" means: every component's normalized contribution is returned
in `DifficultyResult.breakdown` alongside the final score, so the score is
never a black box — anyone consuming the output can see exactly which
metrics drove it.
"""

from __future__ import annotations

from step_intelligence.config import (
    DIFFICULTY_NORMALIZATION_BASELINES,
    DIFFICULTY_NORMALIZATION_CAPS,
    DIFFICULTY_SCORE_LOW_MAX,
    DIFFICULTY_SCORE_MEDIUM_MAX,
    DIFFICULTY_WEIGHTS,
    SupportLevel,
)
from step_intelligence.models.step_input import InteractionMetrics
from step_intelligence.models.ui_config_output import DifficultyResult


def _normalize(value: float, cap: float, baseline: float = 0.0) -> float:
    """
    Scale `value` into 0-100, where `baseline` maps to 0 and `cap` maps to
    100, clamped to that range. `baseline` lets a metric's "nominal" value
    (e.g. time_ratio == 1.0) correctly contribute zero difficulty instead of
    being treated as already partway to the cap.
    """
    span = cap - baseline
    if span <= 0:
        return 0.0
    return max(0.0, min(100.0, ((value - baseline) / span) * 100.0))


def compute_difficulty(metrics: InteractionMetrics) -> DifficultyResult:
    raw_components = {
        "time_ratio": metrics.time_ratio,
        "help_requests": metrics.help_requests,
        "instruction_replays": metrics.instruction_replays,
        "backtracks": metrics.backtracks,
        "input_errors": metrics.input_errors,
        "input_pauses": metrics.input_pauses,
    }

    breakdown = {
        name: round(
            _normalize(
                value,
                DIFFICULTY_NORMALIZATION_CAPS[name],
                DIFFICULTY_NORMALIZATION_BASELINES[name],
            ),
            2,
        )
        for name, value in raw_components.items()
    }

    score = sum(
        breakdown[name] * weight for name, weight in DIFFICULTY_WEIGHTS.items()
    )
    score = round(max(0.0, min(100.0, score)), 2)

    support_level = _score_to_support_level(score)

    return DifficultyResult(score=score, support_level=support_level, breakdown=breakdown)


def _score_to_support_level(score: float) -> SupportLevel:
    if score <= DIFFICULTY_SCORE_LOW_MAX:
        return SupportLevel.LOW
    if score <= DIFFICULTY_SCORE_MEDIUM_MAX:
        return SupportLevel.MEDIUM
    return SupportLevel.HIGH

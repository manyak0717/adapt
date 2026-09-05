"""
Input contract: what this module expects the backend to hand it.

These models intentionally know nothing about the DB, the API route, or how
the data was retrieved — they just describe the shape of the structured
step + interaction data this module consumes.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, field_validator

from step_intelligence.config import FieldType


class StepData(BaseModel):
    """A single structured task step as produced by the procedure-retrieval
    side of the system (owned by another team member)."""

    step_id: str
    title: str
    raw_instruction: str = Field(
        ..., description="The original/base instruction text for this step."
    )
    field_type: FieldType = Field(
        default=FieldType.FREE_TEXT,
        description="Declared input shape for this step, used as a default "
        "input_mode hint before difficulty-based overrides apply.",
    )


class InteractionMetrics(BaseModel):
    """Raw interaction telemetry for a single step attempt."""

    time_spent: float = Field(..., ge=0, description="Seconds spent on the step.")
    expected_time: float = Field(
        ..., gt=0, description="Baseline expected seconds for this step."
    )
    help_requests: int = Field(0, ge=0)
    instruction_replays: int = Field(0, ge=0)
    backtracks: int = Field(0, ge=0)
    input_errors: int = Field(0, ge=0)
    input_pauses: int = Field(0, ge=0)

    @field_validator("expected_time")
    @classmethod
    def _expected_time_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("expected_time must be > 0 to compute a time ratio")
        return v

    @property
    def time_ratio(self) -> float:
        return self.time_spent / self.expected_time


class ModuleInput(BaseModel):
    """The full input this module's pipeline expects."""

    step: StepData
    metrics: InteractionMetrics
    user_id: Optional[str] = Field(
        default=None,
        description="Opaque identifier passed through for logging/telemetry "
        "only. Never used for lookups here — persistence is not this "
        "module's responsibility.",
    )

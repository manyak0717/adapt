# Step Intelligence (`step_intelligence`)

Standalone adaptive intelligence and UI configuration package for the **ADAPT** accessibility platform.

---

## 1. Module Scope & Boundaries

### In Scope
- **Step Intelligence (LLM-based)**: Rewrite raw task step instructions into three accessible variants (`standard_instruction`, `simplified_instruction`, `micro_steps`) using an abstracted `LLMClient` protocol. Includes offline deterministic `StaticLLMClient` and Google Gemini 3.5 Flash-Lite provider `GeminiFlashLiteClient`.
- **Interaction Analysis**: Pure threshold-based rule engine detecting behavioral struggle patterns (`hesitation`, `repeated_help`, `typing_difficulty`, `navigation_difficulty`).
- **Difficulty Engine**: Weighted, normalized 0–100 difficulty scoring with baseline offsets, transparent per-component breakdown, and support level categorization (`LOW`, `MEDIUM`, `HIGH`).
- **Adaptation Engine**: Deterministic mapping of `(field_type, support_level, detected_patterns)` to strict, enum-bounded UI configurations (`layout`, `input_mode`, `instruction_mode`).
- **Pipeline Orchestrator**: Single end-to-end execution function returning a validated Pydantic model (`AdaptiveResponse`).

### Out of Scope (Strict Boundaries)
- **Web scraping / Procedure retrieval**: Ingestion and raw task extraction are owned upstream by other services.
- **FastAPI / REST routes**: Route handlers, endpoints, request wiring, and middleware are outside this module.
- **Database models / ORM / Migrations**: Persistence, database tables, and user state caching are managed by the host backend.
- **Frontend rendering / React / HTML / CSS**: UI components, DOM updates, and styling are rendered by the client application using the returned `AdaptiveResponse` JSON.

---

## 2. Integration Contract

Backend services only need to import the single pipeline entrypoint and provide input data:

```python
from step_intelligence import (
    FieldType,
    InteractionMetrics,
    ModuleInput,
    StepData,
    run_adaptation_pipeline,
)

# 1. Construct input payload
module_input = ModuleInput(
    step=StepData(
        step_id="step-3",
        title="Enter Expiration Date",
        raw_instruction="Type your card expiration month and year formatted as MM/YY.",
        field_type=FieldType.DATE,
    ),
    metrics=InteractionMetrics(
        time_spent=42.0,
        expected_time=15.0,
        help_requests=2,
        instruction_replays=1,
        backtracks=0,
        input_errors=1,
        input_pauses=4,
    ),
    user_id="usr_12345",  # Optional telemetry identifier
)

# 2. Call pipeline (uses offline StaticLLMClient by default)
response = run_adaptation_pipeline(module_input)

# 3. Serialize to JSON for downstream consumers / frontend API
payload = response.model_dump()
```

### JSON Output Contract

`AdaptiveResponse.model_dump()` returns:

```json
{
  "step_id": "step-3",
  "step_intelligence": {
    "standard_instruction": "Type your card expiration month and year formatted as MM/YY.",
    "simplified_instruction": "Simple version: Type your card expiration month and year formatted as MM/YY.",
    "micro_steps": [
      "Type your card expiration month",
      "year formatted as MM/YY"
    ]
  },
  "patterns": {
    "hesitation": true,
    "repeated_help": true,
    "typing_difficulty": false,
    "navigation_difficulty": false
  },
  "difficulty": {
    "score": 40.08,
    "support_level": "MEDIUM",
    "breakdown": {
      "time_ratio": 60.0,
      "help_requests": 50.0,
      "instruction_replays": 25.0,
      "backtracks": 0.0,
      "input_errors": 16.67,
      "input_pauses": 66.67
    }
  },
  "ui_config": {
    "layout": "guided",
    "input_mode": "date_picker",
    "instruction_mode": "micro_steps"
  },
  "active_instruction": "1. Type your card expiration month\n2. year formatted as MM/YY"
}
```

---

## 3. Gemini 3.5 Flash-Lite Provider Setup

For production use with live LLM instruction generation, use `GeminiFlashLiteClient` backed by Google's `google-genai` SDK and the `gemini-3.5-flash-lite` model.

### Installation
```bash
pip install google-genai
```

### Environment Variable Setup
Set `GEMINI_API_KEY`:
```bash
export GEMINI_API_KEY="your-gemini-api-key"
```

### Example Usage
```python
from step_intelligence import GeminiFlashLiteClient, run_adaptation_pipeline

# Initialize client (picks up GEMINI_API_KEY from environment)
llm_client = GeminiFlashLiteClient()

# Or pass the key explicitly:
# llm_client = GeminiFlashLiteClient(api_key="your-api-key", thinking_level="minimal")

# Run pipeline with the live LLM provider
response = run_adaptation_pipeline(module_input, llm_client=llm_client)
```

---

## 4. Running Tests

The test suite runs fully offline without requiring an API key or network access:

```bash
# Install test requirements
pip install -r step_intelligence/requirements.txt

# Run full test suite with verbose output
pytest step_intelligence/tests -v
```

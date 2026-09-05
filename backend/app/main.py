import sys
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel

from .database import supabase
from .auth import get_current_user, get_authenticated_client

# Ensure repository root is on sys.path for app module imports
_root_dir = Path(__file__).resolve().parent.parent.parent
if str(_root_dir) not in sys.path:
    sys.path.insert(0, str(_root_dir))

from app.main import ProcedureRetriever
from app.models import (
    RetrievalRequest,
    RetrievalResult,
    RetrievalError,
    NoSearchResultsError,
    WebpageUnavailableError,
    ContentParsingError,
    RetrievalTimeoutError,
)
from app.step_extractor import extract_steps
from app.ai_step_extractor import extract_steps_with_gemini


app = FastAPI(
    title="ADAPT API",
    description="Adaptive Cognitive Task Assistant API",
    version="1.0.0"
)


class LoginRequest(BaseModel):
    email: str
    password: str

class TaskCreate(BaseModel):
    title: str
    original_input: str | None = None


class TaskStepCreate(BaseModel):
    task_id: str
    step_number: int
    title: str
    instruction: str


class BehaviorEventCreate(BaseModel):
    task_id: str | None = None
    step_id: str | None = None
    event_type: str
    event_data: dict = {}


class AssistanceStateCreate(BaseModel):
    task_id: str | None = None
    step_id: str | None = None
    difficulty_score: int = 0
    assistance_level: str = "independent"
    difficulty_reasons: list = []


@app.get("/")
def root():
    return {
        "message": "ADAPT API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.post("/login")
def login(request: LoginRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })

        return {
            "access_token": response.session.access_token,
            "user_id": response.user.id,
            "email": response.user.email
        }

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )


@app.get("/me")
def get_me(user=Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email
    }


@app.get("/profiles")
def get_profiles(
    client=Depends(get_authenticated_client)
):
    response = client.table("profiles").select("*").limit(10).execute()

    return {
        "profiles": response.data
    }

@app.get("/interaction-profile")
def get_interaction_profile(
    client=Depends(get_authenticated_client)
):
    try:
        response = (
            client.table("interaction_profiles")
            .select("*")
            .limit(1)
            .execute()
        )

        return {
            "interaction_profile": response.data
        }

    except Exception as e:
        print("INTERACTION PROFILE ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    
@app.get("/ui-preferences")
def get_ui_preferences(
    client=Depends(get_authenticated_client)
):
    try:
        response = (
            client.table("ui_preferences")
            .select("*")
            .limit(1)
            .execute()
        )

        return {
            "ui_preferences": response.data
        }

    except Exception as e:
        print("UI PREFERENCES ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/tasks")
def get_tasks(
    client=Depends(get_authenticated_client)
):
    try:
        response = (
            client.table("tasks")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "tasks": response.data
        }

    except Exception as e:
        print("TASKS ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.get("/task-steps/{task_id}")
def get_task_steps(
    task_id: str,
    client=Depends(get_authenticated_client)
):
    try:
        response = (
            client.table("task_steps")
            .select("*")
            .eq("task_id", task_id)
            .order("step_number")
            .execute()
        )

        return {
            "task_steps": response.data
        }

    except Exception as e:
        print("TASK STEPS ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.get("/behavior-events")
def get_behavior_events(
    client=Depends(get_authenticated_client)
):
    try:
        response = (
            client.table("behavior_events")
            .select("*")
            .order("created_at", desc=True)
            .limit(100)
            .execute()
        )

        return {
            "behavior_events": response.data
        }

    except Exception as e:
        print("BEHAVIOR EVENTS ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.get("/assistance-states")
def get_assistance_states(
    client=Depends(get_authenticated_client)
):
    try:
        response = (
            client.table("assistance_states")
            .select("*")
            .order("created_at", desc=True)
            .limit(100)
            .execute()
        )

        return {
            "assistance_states": response.data
        }

    except Exception as e:
        print("ASSISTANCE STATES ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/tasks")
def create_task(
    request: TaskCreate,
    user=Depends(get_current_user),
    client=Depends(get_authenticated_client)
):
    try:
        response = (
            client.table("tasks")
            .insert({
                "user_id": user.id,
                "title": request.title,
                "original_input": request.original_input
            })
            .execute()
        )

        return {
            "task": response.data
        }

    except Exception as e:
        print("CREATE TASK ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.post("/task-steps")
def create_task_step(
    request: TaskStepCreate,
    user=Depends(get_current_user),
    client=Depends(get_authenticated_client)
):
    try:
        response = (
            client.table("task_steps")
            .insert({
                "task_id": request.task_id,
                "step_number": request.step_number,
                "title": request.title,
                "instruction": request.instruction
            })
            .execute()
        )

        return {
            "task_step": response.data
        }

    except Exception as e:
        print("CREATE TASK STEP ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.post("/behavior-events")
def create_behavior_event(
    request: BehaviorEventCreate,
    user=Depends(get_current_user),
    client=Depends(get_authenticated_client)
):
    try:
        response = (
            client.table("behavior_events")
            .insert({
                "user_id": user.id,
                "task_id": request.task_id,
                "step_id": request.step_id,
                "event_type": request.event_type,
                "event_data": request.event_data
            })
            .execute()
        )

        return {
            "behavior_event": response.data
        }

    except Exception as e:
        print("CREATE BEHAVIOR EVENT ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.post("/assistance-states")
def create_assistance_state(
    request: AssistanceStateCreate,
    user=Depends(get_current_user),
    client=Depends(get_authenticated_client)
):
    try:
        response = (
            client.table("assistance_states")
            .insert({
                "user_id": user.id,
                "task_id": request.task_id,
                "step_id": request.step_id,
                "difficulty_score": request.difficulty_score,
                "assistance_level": request.assistance_level,
                "difficulty_reasons": request.difficulty_reasons
            })
            .execute()
        )

        return {
            "assistance_state": response.data
        }

    except Exception as e:
        print("CREATE ASSISTANCE STATE ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ---------------------------------------------------------------------------
# Procedure Retrieval & Step Extraction Endpoints
# ---------------------------------------------------------------------------

class StepExtractRequest(BaseModel):
    task: str
    raw_text: str
    title: str = ""
    url: str = ""
    use_gemini: bool = False


class ProcedureTaskRequest(BaseModel):
    task: str
    use_gemini: bool = False


@app.post("/procedure/retrieve")
def retrieve_procedure(request: RetrievalRequest):
    """Retrieve procedural webpage content for a natural language task."""
    try:
        retriever = ProcedureRetriever()
        result = retriever.retrieve(task=request.task, task_id=request.task_id)
        return result.to_dict()
    except NoSearchResultsError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RetrievalTimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except WebpageUnavailableError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except ContentParsingError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RetrievalError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print("PROCEDURE RETRIEVAL ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/procedure/extract-steps")
def extract_procedure_steps(request: StepExtractRequest):
    """Extract structured procedural steps from raw text using AI or rule-based fallback."""
    steps_list = []
    extraction_method = "rule_based"

    if request.use_gemini:
        try:
            ai_data = extract_steps_with_gemini(
                task=request.task,
                title=request.title,
                url=request.url,
                webpage_text=request.raw_text,
            )
            raw_steps = ai_data.get("steps", [])
            if raw_steps and len(raw_steps) >= 2:
                steps_list = raw_steps
                extraction_method = "gemini"
        except Exception as e:
            print("GEMINI EXTRACTION FAILED, FALLING BACK TO RULE-BASED:", repr(e))

    if not steps_list:
        parsed = extract_steps(request.raw_text)
        steps_list = [s.to_dict() for s in parsed]
        extraction_method = "rule_based"

    return {
        "task": request.task,
        "method": extraction_method,
        "steps_count": len(steps_list),
        "steps": steps_list,
    }


@app.post("/tasks/from-procedure")
def create_task_from_procedure(request: ProcedureTaskRequest):
    """Retrieve procedural knowledge from the web and extract structured steps in one step."""
    try:
        retriever = ProcedureRetriever()
        retrieval_result = retriever.retrieve(task=request.task)

        # Extract steps
        steps_list = []
        extraction_method = "rule_based"

        if request.use_gemini:
            try:
                ai_data = extract_steps_with_gemini(
                    task=request.task,
                    title=retrieval_result.source.title,
                    url=retrieval_result.source.url,
                    webpage_text=retrieval_result.raw_text,
                )
                raw_steps = ai_data.get("steps", [])
                if raw_steps and len(raw_steps) >= 2:
                    steps_list = raw_steps
                    extraction_method = "gemini"
            except Exception as e:
                print("GEMINI EXTRACTION FAILED, FALLING BACK TO RULE-BASED:", repr(e))

        if not steps_list:
            parsed = extract_steps(retrieval_result.raw_text)
            steps_list = [s.to_dict() for s in parsed]
            extraction_method = "rule_based"

        return {
            "task_id": retrieval_result.task_id,
            "task": request.task,
            "source": retrieval_result.source.model_dump(),
            "extraction_method": extraction_method,
            "steps": steps_list,
        }
    except NoSearchResultsError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RetrievalTimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except WebpageUnavailableError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except ContentParsingError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RetrievalError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print("CREATE TASK FROM PROCEDURE ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel

from .database import supabase
from .auth import get_current_user, get_authenticated_client


app = FastAPI(
    title="ADAPT API",
    description="Adaptive Cognitive Task Assistant API",
    version="1.0.0"
)


class LoginRequest(BaseModel):
    email: str
    password: str


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
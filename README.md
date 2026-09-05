# ADAPT — Technical Architecture & Technology Stack

## 1. Project Overview

**ADAPT (Adaptive Cognitive Task Assistant)** is an AI-powered task assistance system designed to help users complete complex digital tasks without requiring them to independently understand and navigate complicated interfaces.

The core interaction model is:

> **User describes the goal → ADAPT obtains a procedure → procedure becomes structured steps → user completes one step at a time → interaction behaviour is observed → assistance adapts → outcome is measured.**

**Core philosophy:**  
> Don't make users learn the interface. Make the interface learn how to support the user.

ADAPT is **not a medical diagnostic system**. It estimates behavioural indicators of task difficulty from interaction behaviour and adapts assistance accordingly. [Source: project report]

---

# 3. Target Audience

## Primary Users

ADAPT is aimed at people who experience difficulty completing complex digital tasks and may benefit from:

- simplified instructions
- step-by-step guidance
- alternative input methods
- audio assistance
- larger or simplified controls
- additional confirmation
- adaptive interaction

Possible user groups include people who experience difficulties with memory, attention, processing, communication, or complex task sequencing.

### Recommended positioning

Rather than defining the audience only as **"people with cognitive disabilities"**, ADAPT should be positioned as:

> **People who experience difficulty completing complex digital tasks and benefit from adaptive, accessible interfaces.**

This keeps the product focused on task difficulty and accessibility rather than presenting it as a medical or diagnostic system.

## Secondary Users

ADAPT can also support:

- **Caregivers** — helping configure or monitor task assistance.
- **Support workers** — providing structured assistance in environments where users receive support.
- **Accessibility professionals** — potentially configuring appropriate assistance and evaluating accessibility.

## Potential Deployment Areas

The architecture is not tied to a single website or application. Potential domains include:

| Domain | Example tasks |
|---|---|
| Healthcare | Appointment booking, patient-portal navigation |
| Education | Assignment submission, learning-platform workflows |
| Government | Online forms, public-service applications |
| Banking | Transfers, payment workflows |
| Commerce | Shopping, order management |
| Travel | Flights, buses, trains, hotels |

# 4. Technology Stack

## Frontend / User Interface

| Technology | Role |
|---|---|
| Web frontend | Main task-completion interface |
| Browser-native Speech Recognition | Voice input |
| Browser Speech Synthesis | Text-to-speech output |
| ABC on-screen keyboard | Alternative text input |
| Text / Keyboard input | Conventional input modality |

The architecture treats voice, text, keyboard and ABC keyboard as interchangeable input modalities. They are normalized into a common task-input contract before reaching downstream modules.

### Current voice configuration
- Default language: `en-IN`
- Speech recognition: browser-native
- Speech output: browser-native Speech Synthesis
- Recognized speech is displayed for user verification before submission.

---

## Backend

| Technology | Role |
|---|---|
| **Python** | Backend language |
| **FastAPI** | REST API framework |
| **Uvicorn** | ASGI server |
| **Pydantic** | Request/data validation |
| **python-dotenv** | Environment configuration |
| **Supabase Python client** | Database/Auth integration |

The backend provides APIs for:
- user authentication
- user profiles
- UI preferences
- task creation
- structured task steps
- behavioural event logging
- assistance/adaptation state persistence

---

## Database & Authentication

### Supabase

Supabase provides the project's:
- PostgreSQL database
- authentication
- Row Level Security (RLS)
- API/data access layer

### Main database entities

```text
profiles
interaction_profiles
ui_preferences
tasks
task_steps
behavior_events
assistance_states
```

### Relationships

```text
User
 │
 ├── Profile
 ├── Interaction Profile
 ├── UI Preferences
 │
 └── Tasks
       │
       ├── Task Steps
       │
       ├── Behavior Events
       │
       └── Assistance State
```

The database stores **behavioural observations**, such as retries, errors and help requests, rather than unsupported medical diagnoses.

---

# 4. High-Level System Architecture

```text
                         USER
                           │
                           ▼
              ┌─────────────────────────┐
              │       INPUT LAYER       │
              │ Voice / Text / Keyboard │
              │       / ABC Keyboard    │
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │    GOAL UNDERSTANDING   │
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   PROCEDURE RETRIEVAL   │
              └────────────┬────────────┘
                           │
                    Procedure found?
                       /         \
                     YES          NO
                      │            │
                      ▼            ▼
                Verified       AI Procedure
                Procedure       Generator
                      │            │
                      └─────┬──────┘
                            ▼
              ┌─────────────────────────┐
              │    SAFETY / RULE CHECKS│
              └────────────┬────────────┘
                           ▼
              ┌─────────────────────────┐
              │     STEP EXTRACTION     │
              └────────────┬────────────┘
                           ▼
              ┌─────────────────────────┐
              │    STRUCTURED STEPS     │
              └────────────┬────────────┘
                           ▼
              ┌─────────────────────────┐
              │     STEP-BY-STEP UI     │
              └────────────┬────────────┘
                           ▼
              ┌─────────────────────────┐
              │   INTERACTION TRACKING  │
              └────────────┬────────────┘
                           ▼
              ┌─────────────────────────┐
              │   DIFFICULTY ESTIMATION │
              └────────────┬────────────┘
                           ▼
              ┌─────────────────────────┐
              │    ADAPTATION ENGINE    │
              └────────────┬────────────┘
                           ▼
              ┌─────────────────────────┐
              │      PERSONALIZED UI    │
              └────────────┬────────────┘
                           │
                           ▼
                          USER
```

---

# 5. Core Architectural Layers

## Layer 1 — Multimodal Input

The input layer accepts:

```text
Voice
Text
Keyboard
ABC Keyboard
```

All modalities are converted into the same structure:

```json
{
  "input": "I want to book a flight from Delhi to Chennai",
  "input_mode": "voice"
}
```

This creates **loose coupling** between the input system and the rest of ADAPT.

A downstream module does not need to know whether the user typed or spoke the request.

---

## Layer 2 — Goal Understanding

The system interprets the user's natural-language goal.

Example:

```text
"I want to book a flight from Delhi to Chennai."
```

becomes a normalized task representation.

The goal is to understand **what the user wants to accomplish**, rather than requiring the user to know how the target application works.

---

## Layer 3 — Procedure Intelligence

ADAPT needs a procedure for completing the task.

The architecture supports two paths:

```text
                 User Goal
                    │
                    ▼
             Procedure Retrieval
                /          \
        Verified            Not found
        procedure              │
             │                 ▼
             │          AI Procedure Generator
             │                 │
             └────────┬────────┘
                      ▼
               Safety / Rule Checks
```

A verified procedure is preferred.

If no verified procedure is available, AI can generate a candidate procedure which should undergo appropriate validation before becoming actionable.

---

# 6. Step Intelligence

A raw procedure is transformed into structured steps.

Example:

```text
Raw procedure:

"To book a flight, enter the departure city,
destination, travel date, select a flight,
enter passenger details and confirm."
```

becomes:

```json
[
  {
    "step_number": 1,
    "instruction": "Enter your departure city.",
    "action_type": "type"
  },
  {
    "step_number": 2,
    "instruction": "Enter your destination.",
    "action_type": "type"
  }
]
```

The important architectural separation is:

```text
WHAT the procedure says
        ↓
Structured task representation
        ↓
HOW the interface displays it
```

This allows the same task representation to be rendered through different interfaces.

---

# 7. Structured Step Contract

A structured step can contain:

```json
{
  "step_id": "string",
  "task_id": "string",
  "step_number": 1,
  "instruction": "string",
  "short_instruction": "string",
  "difficulty": "low | medium | high",
  "action_type": "read | click | type | select | upload | navigate | confirm | other",
  "requires_input": false,
  "audio_text": "string"
}
```

This standardized contract allows modules to work independently.

---

# 8. Backend Architecture

The current backend is organized around FastAPI and Supabase.

```text
                 FRONTEND
                    │
                    │ HTTP / REST
                    ▼
        ┌─────────────────────────┐
        │        FastAPI          │
        │                         │
        │  Auth / Task APIs       │
        │  Step APIs              │
        │  Behaviour APIs         │
        │  Assistance APIs        │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │    Supabase Client      │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │ PostgreSQL + Auth + RLS │
        └─────────────────────────┘
```

### Current API responsibilities

```text
GET  /
GET  /health
GET  /login
GET  /me

GET  /profiles
GET  /interaction-profile
GET  /ui-preferences
GET  /tasks
GET  /task-steps/{task_id}
GET  /behavior-events
GET  /assistance-states

POST /tasks
POST /task-steps
POST /behavior-events
POST /assistance-states
```

The backend derives the authenticated user from the Supabase authentication token rather than trusting a user ID supplied by the client.

---

# 9. Database Architecture

The database is designed around the task-completion lifecycle.

```text
                 AUTH USER
                    │
                    ▼
              ┌───────────┐
              │ profiles  │
              └───────────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
interaction_profiles    ui_preferences

                    │
                    ▼
                ┌───────┐
                │ tasks │
                └───┬───┘
                    │
              ┌─────┴─────┐
              ▼           ▼
        task_steps   behavior_events
                            │
                            ▼
                    assistance_states
```

### Important database concepts

**Profiles**
- basic user information
- speech preference

**Interaction profiles**
- behavioural metrics
- adaptive difficulty
- assistance level

**UI preferences**
- visual and interaction preferences

**Tasks**
- user goal/task
- original input
- task status

**Task steps**
- ordered instructions
- step status

**Behaviour events**
- interaction signals
- timestamps
- event metadata

**Assistance states**
- difficulty score
- assistance level
- reasons for adaptation

---

# 10. Authentication & Security

The backend uses Supabase authentication and validates the user's access token.

The architecture uses:

```text
Frontend
   │
   │ Access Token
   ▼
FastAPI
   │
   │ Validate token
   ▼
Authenticated User
   │
   ▼
Supabase / PostgreSQL
```

Supabase Row Level Security is enabled for the main application tables.

The project should avoid storing or exposing:
- medical diagnoses
- unnecessary raw voice recordings
- unnecessary personal data

Instead, the system focuses on task-related interaction observations.

---

# 11. Interaction Tracking

ADAPT observes how the user performs individual steps.

Important signals include:

```text
acknowledgement_time
execution_time
error_count
retry_count
help_requested
completed
audio_used
input_mode
```

These signals form the basis for adaptive assistance.

Example:

```text
Step displayed
      ↓
User interacts
      ↓
Collect timing/errors/retries/help
      ↓
Estimate difficulty
      ↓
Adapt presentation
```

One signal should not be treated as proof of difficulty. Multiple behavioural signals and repeated observations provide a more defensible basis for adaptation.

---

# 12. Difficulty Estimation

The system estimates **task difficulty from interaction behaviour**.

Conceptually:

```text
Interaction Data
      │
      ├── acknowledgement time
      ├── execution time
      ├── errors
      ├── retries
      └── help requests
              │
              ▼
      Difficulty Estimator
              │
              ▼
       Difficulty Signal
```

The output is an assistance decision, not a medical diagnosis.

Example:

```text
High acknowledgement time
        +
Repeated errors
        +
Multiple retries
        ↓
Higher difficulty signal
        ↓
Increase assistance
```

---

# 13. Adaptation Engine

The adaptation engine closes the feedback loop.

```text
USER
 ↓
PERFORM STEP
 ↓
OBSERVE
 ↓
TIME / ERRORS / RETRIES / HELP
 ↓
DIFFICULTY SIGNAL
 ↓
ADAPTATION ENGINE
 ↓
CHANGE UI
 ↓
USER TRIES AGAIN
 ↓
MEASURE OUTCOME
```

Possible adaptations include:

### Text

Normal:

```text
Select your preferred departure location.
```

Simplified:

```text
Where are you leaving from?
```

### Controls

```text
Normal:  [Continue]

Adapted: [   CONTINUE   ]
```

### Audio

```text
Text instruction
      ↓
      TTS
      ↓
Spoken instruction
```

### Confirmation

```text
Normal:
Click Next.

Adapted:
Are you sure you want to continue?

[ YES ] [ GO BACK ]
```

---

# 14. Personalization Model

ADAPT should not permanently assume that a user needs a particular interface.

Instead:

```text
Initial interaction
       ↓
User struggles
       ↓
ADAPT simplifies
       ↓
User performs better
       ↓
Adaptation becomes evidence
       ↓
Future assistance can be personalized
```

This creates a continuous feedback loop.

---

# 15. Adaptation Data Contract

The adaptation layer can produce a UI configuration such as:

```json
{
  "user_id": "USER001",
  "task_id": "TASK001",
  "step_id": "STEP002",
  "instruction_mode": "simplified",
  "text_size": "large",
  "button_size": "large",
  "audio_priority": true,
  "show_extra_explanation": false,
  "require_confirmation": true,
  "reason": [
    "high acknowledgement time",
    "previous input errors"
  ]
}
```

This separates **adaptation logic** from the actual frontend rendering.

---

# 16. Complete Data Flow

```text
VOICE / TEXT / ABC
        │
        ▼
┌──────────────────────┐
│ Common Task Contract │
└──────────┬───────────┘
           ▼
    Goal Understanding
           ▼
  Procedure Retrieval
           ▼
  AI Generation if needed
           ▼
    Safety / Rule Checks
           ▼
    Step Extraction
           ▼
    Structured Steps
           ▼
    Step-by-Step UI
           ▼
  Interaction Tracking
           ▼
  Difficulty Estimation
           ▼
    Adaptation Engine
           ▼
     Personalized UI
           ▼
          TTS
           ▼
         USER
```

---

# 17. Why This Architecture Is Scalable

## 1. Task-agnostic

ADAPT is designed around tasks rather than one specific application.

The same pipeline can support:

```text
Travel
 ├── Flight booking
 ├── Train booking
 └── Hotel booking

Banking
 ├── Transfers
 └── Payments

Healthcare
 └── Appointment booking

Education
 └── Assignment submission
```

The core pipeline remains:

```text
Goal → Procedure → Steps → Interaction → Adaptation
```

Only the task/procedure data changes.

---

## 2. Modular

Each component has a defined responsibility.

For example:

```text
Voice recognition
       │
       ▼
Common Input Contract
       │
       ▼
Procedure System
```

The speech system can be replaced without rewriting procedure retrieval.

---

## 3. Replaceable technologies

Current:

```text
Browser Speech Recognition
```

Possible future:

```text
Dedicated multilingual speech model
```

The common task-input contract remains unchanged.

---

## 4. Multiple input modalities

Future input methods can include:

```text
Voice
Keyboard
ABC keyboard
Touch
Switch controls
Eye tracking
```

All can eventually map to the same task-input contract.

---

## 5. Multilingual expansion

Current prototype:

```text
en-IN
```

Future languages can include:

```text
English
Hindi
Tamil
Telugu
Bengali
...
```

Language-specific functionality belongs primarily in the input/output layer rather than requiring a complete redesign of the task pipeline.

---

# 18. Current Prototype vs Future Architecture

## Current prototype

The project architecture supports/demonstrates:

```text
Text input
Voice input
ABC keyboard
Text-to-speech
Task input contract
Task UI
Structured steps
Interaction tracking
Adaptation concept
FastAPI backend
Supabase database/authentication
```

Only components that are actually integrated and working should be presented as implemented.

## Future intelligence layer

```text
Goal understanding
Procedure retrieval
AI procedure generation
Structured step extraction
```

## Future adaptation layer

```text
Behavioural modelling
Personalized UI
Multi-signal difficulty estimation
Outcome measurement
```

## Future scale

```text
Multilingual support
Additional accessibility modalities
More task domains
Real-world integrations
```

---

# 19. Project Repository Architecture

Current stable project structure:

```text
adapt/
│
├── .gitignore
├── README.md
├── .env
│
├── .venv/
│
└── backend/
    ├── requirements.txt
    │
    └── app/
        ├── __init__.py
        ├── main.py
        ├── database.py
        └── auth.py
```

### Backend responsibilities

```text
main.py
  └── FastAPI application + endpoints

database.py
  └── Supabase client initialization

auth.py
  └── Authentication/token validation

requirements.txt
  └── Python dependencies
```

The AI-engine branch import was intentionally not retained in this stable checkpoint because it contained duplicated module structures. AI modules should be integrated only after their intended package structure and interfaces are verified.

---

# 20. Development Architecture

The recommended integration sequence is:

```text
Stable Backend
      │
      ▼
Database + Authentication
      │
      ▼
Common Task Contract
      │
      ▼
Procedure Module
      │
      ▼
Step Intelligence
      │
      ▼
Interaction Tracking
      │
      ▼
Difficulty Engine
      │
      ▼
Adaptation Engine
      │
      ▼
Frontend Integration
```

This keeps each stage testable and reduces the risk of breaking the working backend.

---

# 21. Key Engineering Principles

### Separation of concerns

Each layer performs one major responsibility.

### Standardized contracts

Modules communicate through predictable data structures.

### Loose coupling

One module can be replaced without rebuilding the entire system.

### Task abstraction

The system is designed around generic tasks rather than a single website.

### Behaviour-aware adaptation

The interface responds to observed interaction behaviour.

### Security by design

Authentication, authorization and RLS protect user-specific data.

### Data minimization

Store the interaction information needed to provide and evaluate assistance, rather than unnecessary sensitive information.

---

# 22. Strong Technical Explanation

A concise technical explanation for judges:

> **"The key technical decision in ADAPT is that the system is task-agnostic. A user's multimodal input is normalized into a common task contract, the goal is mapped to a procedure, the procedure is transformed into structured steps, and the frontend executes those steps one at a time. Interaction signals are persisted through the backend and database, passed through difficulty estimation, and used by an adaptation engine to generate a personalized UI configuration. Because the modules communicate through standardized contracts, individual technologies can be replaced without redesigning the entire system."**

---

# 23. Strong Architecture Diagram

```text
                         ┌──────────────┐
                         │     USER     │
                         └──────┬───────┘
                                │
                    ┌───────────┴───────────┐
                    │ Voice / Text / ABC    │
                    └───────────┬───────────┘
                                │
                         Common Contract
                                │
                                ▼
                     ┌────────────────────┐
                     │ Goal Understanding  │
                     └──────────┬─────────┘
                                │
                                ▼
                     ┌────────────────────┐
                     │ Procedure Layer    │
                     │ Retrieval / AI     │
                     └──────────┬─────────┘
                                │
                                ▼
                     ┌────────────────────┐
                     │ Step Intelligence  │
                     └──────────┬─────────┘
                                │
                                ▼
                     ┌────────────────────┐
                     │ FastAPI Backend    │
                     └──────────┬─────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
             ┌────────────┐        ┌────────────────┐
             │ Supabase   │        │ Interaction    │
             │ PostgreSQL │        │ Tracking       │
             │ Auth + RLS │        └───────┬────────┘
             └────────────┘                │
                                           ▼
                                  ┌────────────────┐
                                  │ Difficulty     │
                                  │ Estimation     │
                                  └───────┬────────┘
                                          │
                                          ▼
                                  ┌────────────────┐
                                  │ Adaptation     │
                                  │ Engine         │
                                  └───────┬────────┘
                                          │
                                          ▼
                                  ┌────────────────┐
                                  │ Personalized   │
                                  │ UI + TTS       │
                                  └───────┬────────┘
                                          │
                                          ▼
                                         USER
```

---

# 24. Core Innovation

ADAPT should not be positioned simply as a voice assistant or step-by-step application.

The architectural innovation is the complete adaptive loop:

```text
GOAL
 ↓
PROCEDURE
 ↓
STRUCTURED STEPS
 ↓
INTERACTION
 ↓
BEHAVIOURAL SIGNALS
 ↓
DIFFICULTY ESTIMATION
 ↓
ADAPTATION
 ↓
PERSONALIZED UI
 ↓
MEASURE OUTCOME
 ↓
REPEAT
```

The system therefore moves from **static accessibility** toward **adaptive accessibility**.

---

# 25. Privacy & Safety Position

ADAPT observes:

```text
Interaction behaviour
```

not:

```text
Medical condition
```

Good:

```text
"User required multiple retries on this step."
```

Avoid:

```text
"User has impaired executive function."
```

For production deployment, important safeguards include:

- explicit consent
- clear retention policies
- secure storage
- minimal data collection
- user control over stored information
- domain-specific validation for higher-risk tasks

---

# 26. Final Positioning

> **ADAPT is an adaptive task-completion interface that understands the user's goal, guides them through structured steps, observes how they interact, and changes the experience when the current interaction becomes difficult.**

The strongest technical characteristics are:

```text
Task-agnostic
        +
Modular
        +
Multimodal
        +
Behaviour-aware
        +
Adaptive
        +
Measurable
        +
Secure
```

**ADAPT**

> Don't make users learn the interface.  
> Make the interface learn how to support the user.


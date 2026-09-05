import type { UserProfile, Task, Step, Interaction, Adaptation } from "../types";
import { MOCK_USER_PROFILE, PRESET_TASKS, generateGenericSteps } from "./mockData";

// In-memory state to mock backend persistence
let currentProfile: UserProfile = { ...MOCK_USER_PROFILE };
const activeTasks = new Map<string, { task: Task; steps: Step[] }>();
const recordedInteractions: Interaction[] = [];

// Seed initial preset tasks
Object.values(PRESET_TASKS).forEach(({ task, steps }) => {
  activeTasks.set(task.task_id, { task, steps });
});

/**
 * Simulate network delay for realistic async behavior
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Creates a new task based on user input string and mode.
 * Matches curated internal procedures or dynamically generates structured steps.
 * Endpoint: POST /tasks
 */
export async function createTask(
  input: string,
  inputMode: "voice" | "keyboard" | "text" = "text"
): Promise<Task> {
  await delay(500);
  const normalized = input.trim().toLowerCase();

  let matched: { task: Task; steps: Step[] } | null = null;

  if (
    normalized.includes("doctor") ||
    normalized.includes("appointment") ||
    normalized.includes("clinic") ||
    normalized.includes("hospital") ||
    normalized.includes("physician")
  ) {
    matched = JSON.parse(JSON.stringify(PRESET_TASKS.doctor));
  } else if (
    normalized.includes("train") ||
    normalized.includes("bus") ||
    normalized.includes("transit") ||
    normalized.includes("ticket") ||
    normalized.includes("subway") ||
    normalized.includes("rail")
  ) {
    matched = JSON.parse(JSON.stringify(PRESET_TASKS.train));
  } else if (
    normalized.includes("transfer") ||
    normalized.includes("money") ||
    normalized.includes("bank") ||
    normalized.includes("wire") ||
    normalized.includes("remit") ||
    normalized.includes("send money")
  ) {
    matched = JSON.parse(JSON.stringify(PRESET_TASKS.transfer));
  } else if (
    normalized.includes("coffee") ||
    normalized.includes("brew") ||
    normalized.includes("espresso") ||
    normalized.includes("cappuccino") ||
    normalized.includes("latte")
  ) {
    matched = JSON.parse(JSON.stringify(PRESET_TASKS.coffee));
  } else {
    // Dynamic procedure generator for any custom goal
    matched = generateGenericSteps(input.trim());
  }

  if (matched) {
    const taskId = `TASK_${Date.now()}`;
    matched.task.task_id = taskId;
    matched.task.original_input = input;
    matched.task.input_mode = inputMode;
    matched.task.created_at = new Date().toISOString();

    // Update step references to matched task
    matched.steps.forEach((s, idx) => {
      s.task_id = taskId;
      s.step_id = `${taskId}_STEP_${idx + 1}`;
    });

    activeTasks.set(taskId, matched);
    return matched.task;
  }

  throw new Error("Unable to initialize task");
}

/**
 * Retrieves steps for a given task.
 * Endpoint: GET /tasks/{task_id}/steps
 */
export async function getTaskSteps(taskId: string): Promise<Step[]> {
  await delay(350);
  const taskEntry = activeTasks.get(taskId);
  if (!taskEntry) {
    return PRESET_TASKS.doctor.steps;
  }
  return taskEntry.steps;
}

/**
 * Records telemetry for a step interaction.
 * Endpoint: POST /interactions
 */
export async function recordInteraction(
  interaction: Interaction
): Promise<{ success: boolean; recorded_id: string }> {
  await delay(200);
  recordedInteractions.push(interaction);

  // Update profile behavioural metrics incrementally
  currentProfile.avg_acknowledgement_time = Number(
    ((currentProfile.avg_acknowledgement_time * 4 + interaction.acknowledgement_time) / 5).toFixed(1)
  );
  currentProfile.avg_execution_time = Number(
    ((currentProfile.avg_execution_time * 4 + interaction.execution_time) / 5).toFixed(1)
  );

  return {
    success: true,
    recorded_id: interaction.interaction_id,
  };
}

/**
 * Evaluates behavioral difficulty signals and computes dynamic UI adaptation.
 * Purely behavioural observation without medical labels.
 * Endpoint: GET /adaptation or POST /adaptation/evaluate
 */
export async function getAdaptation(
  taskId: string,
  stepId: string,
  interaction?: Interaction | null,
  forceDifficulty: boolean = false
): Promise<Adaptation> {
  await delay(250);

  // Difficulty signal detection
  const isAckHigh = interaction ? interaction.acknowledgement_time > 6 : false;
  const isExecHigh = interaction ? interaction.execution_time > 12 : false;
  const hasErrors = interaction ? interaction.error_count > 0 : false;
  const hasRetries = interaction ? interaction.retry_count > 0 : false;
  const helpRequested = interaction ? interaction.help_requested : false;

  const difficultyScore =
    (isAckHigh ? 1 : 0) +
    (isExecHigh ? 1 : 0) +
    (hasErrors ? 2 : 0) +
    (hasRetries ? 1 : 0) +
    (helpRequested ? 2 : 0);

  const shouldAdapt = forceDifficulty || difficultyScore >= 1;

  if (shouldAdapt) {
    const reasons: string[] = [];

    if (forceDifficulty) {
      reasons.push("Demonstration mode: high assistance active");
    }
    if (isAckHigh) {
      reasons.push("Extended reading duration observed");
    }
    if (isExecHigh) {
      reasons.push("Extended action completion time observed");
    }
    if (hasErrors) {
      reasons.push("Multiple selection attempts observed");
    }
    if (hasRetries) {
      reasons.push("Choice re-selections observed");
    }
    if (helpRequested) {
      reasons.push("Direct assistance requested on previous step");
    }
    if (reasons.length === 0) {
      reasons.push("Simplified navigation pacing applied");
    }

    // Granular adaptation rules
    const instructionMode =
      isAckHigh || hasRetries || forceDifficulty ? "simplified" : "normal";
    const textSize = hasErrors || forceDifficulty || difficultyScore >= 2 ? "large" : "normal";
    const buttonSize =
      hasErrors || hasRetries || forceDifficulty || difficultyScore >= 1 ? "large" : "normal";
    const audioPriority = helpRequested || forceDifficulty || isAckHigh;
    const showExtraExplanation = isExecHigh || helpRequested || forceDifficulty;
    const requireConfirmation = hasErrors || difficultyScore >= 2 || forceDifficulty;

    return {
      user_id: currentProfile.user_id,
      task_id: taskId,
      step_id: stepId,
      instruction_mode: instructionMode,
      text_size: textSize,
      button_size: buttonSize,
      audio_priority: audioPriority,
      show_extra_explanation: showExtraExplanation,
      require_confirmation: requireConfirmation,
      reason: reasons,
    };
  }

  // Normal pacing adaptation
  return {
    user_id: currentProfile.user_id,
    task_id: taskId,
    step_id: stepId,
    instruction_mode: "normal",
    text_size: "normal",
    button_size: "normal",
    audio_priority: false,
    show_extra_explanation: false,
    require_confirmation: false,
    reason: ["Standard interactive pacing active"],
  };
}

/**
 * Retrieves the user interaction profile.
 * Endpoint: GET /users/{user_id}/profile
 */
export async function getUserProfile(userId: string = "USER_1027"): Promise<UserProfile> {
  await delay(200);
  if (userId === currentProfile.user_id) {
    return { ...currentProfile };
  }
  return { ...MOCK_USER_PROFILE, user_id: userId };
}

/**
 * Updates user profile preferences.
 * Endpoint: PUT /users/{user_id}/profile
 */
export async function updateUserProfile(updated: UserProfile): Promise<UserProfile> {
  await delay(200);
  currentProfile = { ...updated };
  return { ...currentProfile };
}

/**
 * Returns recorded interaction telemetry history for inspector/debugger
 */
export function getInteractionHistory(): Interaction[] {
  return [...recordedInteractions];
}

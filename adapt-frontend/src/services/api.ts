import type { UserProfile, Task, Step, Interaction, Adaptation } from "../types";
import { MOCK_USER_PROFILE, PRESET_TASKS, generateGenericSteps } from "./mockData";

// In-memory or session storage state to mock backend persistence
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
 * Matches preset tasks if keywords match, otherwise dynamically generates 4-5 steps.
 * Endpoint: POST /tasks
 */
export async function createTask(
  input: string,
  inputMode: "voice" | "keyboard" | "text" = "text"
): Promise<Task> {
  await delay(600);
  const normalized = input.trim().toLowerCase();

  let matched: { task: Task; steps: Step[] } | null = null;

  if (normalized.includes("doctor") || normalized.includes("appointment") || normalized.includes("clinic") || normalized.includes("hospital")) {
    matched = JSON.parse(JSON.stringify(PRESET_TASKS.doctor));
  } else if (normalized.includes("bus") || normalized.includes("travel") || normalized.includes("ticket") || normalized.includes("transit")) {
    matched = JSON.parse(JSON.stringify(PRESET_TASKS.bus));
  } else if (normalized.includes("bank") || normalized.includes("transfer") || normalized.includes("money") || normalized.includes("pay")) {
    matched = JSON.parse(JSON.stringify(PRESET_TASKS.transfer));
  } else {
    // Dynamically generate steps for any custom user input!
    matched = generateGenericSteps(input.trim());
  }

  if (matched) {
    matched.task.task_id = `TASK_${Date.now()}`;
    matched.task.original_input = input;
    matched.task.input_mode = inputMode;
    matched.task.created_at = new Date().toISOString();
    // Update step references to matched task
    matched.steps.forEach((s, idx) => {
      s.task_id = matched!.task.task_id;
      s.step_id = `${matched!.task.task_id}_STEP_${idx + 1}`;
    });

    activeTasks.set(matched.task.task_id, matched);
    return matched.task;
  }

  throw new Error("Unable to initialize task");
}

/**
 * Retrieves steps for a given task.
 * Endpoint: GET /tasks/{task_id}/steps
 */
export async function getTaskSteps(taskId: string): Promise<Step[]> {
  await delay(400);
  const taskEntry = activeTasks.get(taskId);
  if (!taskEntry) {
    // If not found in memory, fallback to doctor preset
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
  await delay(250);
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
 * Computes or fetches adaptation settings based on user interaction behavior.
 * Respectful, purely behavioural evaluation.
 * Endpoint: GET /adaptation or POST /adaptation/evaluate
 */
export async function getAdaptation(
  taskId: string,
  stepId: string,
  interaction?: Interaction | null,
  forceDifficulty: boolean = false
): Promise<Adaptation> {
  await delay(300);

  // Determine if adaptation is warranted based on interaction observations or forced demo toggle
  const shouldAdapt =
    forceDifficulty ||
    (interaction &&
      (interaction.acknowledgement_time > 8 ||
        interaction.execution_time > 18 ||
        interaction.error_count > 0 ||
        interaction.retry_count > 0 ||
        interaction.help_requested));

  if (shouldAdapt) {
    const reasons: string[] = [];
    if (forceDifficulty) {
      reasons.push("Demonstration mode: high cognitive assistance active");
    }
    if (interaction?.acknowledgement_time && interaction.acknowledgement_time > 8) {
      reasons.push("Extended reading duration detected");
    }
    if (interaction?.execution_time && interaction.execution_time > 18) {
      reasons.push("Extended action completion time detected");
    }
    if (interaction?.error_count && interaction.error_count > 0) {
      reasons.push("Target selection re-attempts observed");
    }
    if (interaction?.help_requested) {
      reasons.push("Direct assistance requested on preceding step");
    }
    if (reasons.length === 0) {
      reasons.push("Simplified navigation pacing applied");
    }

    return {
      user_id: currentProfile.user_id,
      task_id: taskId,
      step_id: stepId,
      instruction_mode: "simplified",
      text_size: "large",
      button_size: "large",
      audio_priority: true,
      show_extra_explanation: true,
      require_confirmation: true,
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
  await delay(300);
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
  await delay(300);
  currentProfile = { ...updated };
  return { ...currentProfile };
}

/**
 * Returns recorded interaction telemetry history for inspector/debugger
 */
export function getInteractionHistory(): Interaction[] {
  return [...recordedInteractions];
}

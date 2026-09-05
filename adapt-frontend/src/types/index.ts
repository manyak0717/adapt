// ==========================================
// ADAPT DATA CONTRACTS & TYPE DEFINITIONS
// ==========================================

export interface UserProfile {
  user_id: string;
  name: string;
  preferred_input: "voice" | "keyboard" | "text";
  preferred_output: "audio" | "text" | "both";
  avg_acknowledgement_time: number;
  avg_execution_time: number;
  avg_errors_per_step: number;
  help_request_rate: number;
  audio_usage_rate: number;
  voice_usage_rate: number;
  ui_preferences: {
    large_buttons: boolean;
    simplified_text: boolean;
    audio_priority: boolean;
    extra_confirmation: boolean;
  };
}

export interface Task {
  task_id: string;
  user_id: string;
  original_input: string;
  input_mode: "voice" | "keyboard" | "text";
  normalized_task: string;
  status: "retrieving" | "processing" | "active" | "completed" | "failed";
  created_at: string;
  completed_at: string;
}

export type ActionType =
  | "read"
  | "click"
  | "type"
  | "select"
  | "upload"
  | "navigate"
  | "confirm"
  | "other";

export interface StepActionChoice {
  id: string;
  title: string;
  description?: string;
  badge?: string;
  icon?: string;
}

export interface StepActionData {
  // For 'click' or 'select'
  choices?: StepActionChoice[];
  // For 'type'
  inputPlaceholder?: string;
  inputLabel?: string;
  inputType?: "text" | "number" | "date" | "tel" | "email";
  defaultValue?: string;
  // For 'upload'
  uploadTitle?: string;
  uploadSubtitle?: string;
  acceptedTypes?: string;
  // For 'navigate'
  locationTitle?: string;
  destinationAddress?: string;
  actionButtonText?: string;
  // For 'confirm'
  summaryItems?: Array<{ label: string; value: string }>;
  // For 'read'
  readPoints?: string[];
  keyHighlight?: string;
}

export interface Step {
  step_id: string;
  task_id: string;
  step_number: number;
  instruction: string;
  short_instruction: string;
  difficulty: "low" | "medium" | "high";
  action_type: ActionType;
  requires_input: boolean;
  audio_text: string;
  action_data?: StepActionData;
}

export interface Interaction {
  interaction_id: string;
  user_id: string;
  task_id: string;
  step_id: string;
  shown_at: string;
  acknowledged_at: string;
  completed_at: string;
  acknowledgement_time: number;
  execution_time: number;
  input_mode: "voice" | "keyboard" | "text";
  audio_used: boolean;
  error_count: number;
  retry_count: number;
  help_requested: boolean;
  completed: boolean;
}

export interface Adaptation {
  user_id: string;
  task_id: string;
  step_id: string;
  instruction_mode: "simplified" | "normal" | "detailed";
  text_size: "normal" | "large";
  button_size: "normal" | "large";
  audio_priority: boolean;
  show_extra_explanation: boolean;
  require_confirmation: boolean;
  reason: string[];
}

export type AppScreen =
  | "dashboard"
  | "understanding"
  | "overview"
  | "step"
  | "completion";

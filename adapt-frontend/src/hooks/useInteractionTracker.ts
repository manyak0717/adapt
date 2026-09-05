import { useState, useRef, useEffect, useCallback } from "react";
import type { Interaction } from "../types";

interface UseInteractionTrackerProps {
  userId: string;
  taskId: string;
  stepId: string;
  inputMode?: "voice" | "keyboard" | "text";
}

export function useInteractionTracker({
  userId,
  taskId,
  stepId,
  inputMode = "keyboard",
}: UseInteractionTrackerProps) {
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [audioUsed, setAudioUsed] = useState(false);
  const [helpRequested, setHelpRequested] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [activeInputMode, setActiveInputMode] = useState<"voice" | "keyboard" | "text">(inputMode);

  const shownTimestampRef = useRef<number>(Date.now());
  const shownAtRef = useRef<string>(new Date().toISOString());
  const ackTimestampRef = useRef<number | null>(null);
  const ackAtRef = useRef<string>("");

  // Reset timers whenever stepId changes
  useEffect(() => {
    shownTimestampRef.current = Date.now();
    shownAtRef.current = new Date().toISOString();
    ackTimestampRef.current = null;
    ackAtRef.current = "";
    setIsAcknowledged(false);
    setAudioUsed(false);
    setHelpRequested(false);
    setErrorCount(0);
    setRetryCount(0);
  }, [stepId, taskId]);

  // Record acknowledgement when user clicks "I UNDERSTAND"
  const acknowledge = useCallback(() => {
    if (!ackTimestampRef.current) {
      ackTimestampRef.current = Date.now();
      ackAtRef.current = new Date().toISOString();
      setIsAcknowledged(true);
    }
  }, []);

  const recordError = useCallback(() => {
    setErrorCount((prev) => prev + 1);
  }, []);

  const recordRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  const recordAudioUsed = useCallback(() => {
    setAudioUsed(true);
  }, []);

  const recordHelpRequested = useCallback(() => {
    setHelpRequested(true);
  }, []);

  // Complete and compile interaction contract object
  const finalizeInteraction = useCallback((): Interaction => {
    const completedTimestamp = Date.now();
    const completedAt = new Date().toISOString();

    const ackTimeSeconds = ackTimestampRef.current
      ? Math.max(1, Math.round((ackTimestampRef.current - shownTimestampRef.current) / 1000))
      : Math.max(1, Math.round((completedTimestamp - shownTimestampRef.current) / 2000));

    const execTimeSeconds = Math.max(
      1,
      Math.round((completedTimestamp - shownTimestampRef.current) / 1000)
    );

    const interactionPayload: Interaction = {
      interaction_id: `INT_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      task_id: taskId,
      step_id: stepId,
      shown_at: shownAtRef.current,
      acknowledged_at: ackAtRef.current || shownAtRef.current,
      completed_at: completedAt,
      acknowledgement_time: ackTimeSeconds,
      execution_time: execTimeSeconds,
      input_mode: activeInputMode,
      audio_used: audioUsed,
      error_count: errorCount,
      retry_count: retryCount,
      help_requested: helpRequested,
      completed: true,
    };

    return interactionPayload;
  }, [userId, taskId, stepId, activeInputMode, audioUsed, errorCount, retryCount, helpRequested]);

  return {
    isAcknowledged,
    audioUsed,
    helpRequested,
    errorCount,
    retryCount,
    activeInputMode,
    setActiveInputMode,
    acknowledge,
    recordError,
    recordRetry,
    recordAudioUsed,
    recordHelpRequested,
    finalizeInteraction,
  };
}

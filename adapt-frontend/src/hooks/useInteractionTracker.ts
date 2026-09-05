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

  // Track step identifier to avoid resetting timers during parent or local re-renders
  const stepKey = `${taskId}__${stepId}`;
  const prevStepKeyRef = useRef<string>("");

  const shownTimestampRef = useRef<number>(Date.now());
  const shownAtRef = useRef<string>(new Date().toISOString());
  const ackTimestampRef = useRef<number | null>(null);
  const ackAtRef = useRef<string>("");

  // Only reset timing state when the stepId or taskId actually transitions
  useEffect(() => {
    if (prevStepKeyRef.current !== stepKey) {
      prevStepKeyRef.current = stepKey;
      shownTimestampRef.current = Date.now();
      shownAtRef.current = new Date().toISOString();
      ackTimestampRef.current = null;
      ackAtRef.current = "";
      setIsAcknowledged(false);
      setAudioUsed(false);
      setHelpRequested(false);
      setErrorCount(0);
      setRetryCount(0);
    }
  }, [stepKey]);

  // Keep input mode in sync if prop changes
  useEffect(() => {
    setActiveInputMode(inputMode);
  }, [inputMode]);

  // Record acknowledgement when user clicks "I UNDERSTAND"
  // Stops acknowledgement timing and marks beginning of execution timing
  const acknowledge = useCallback(() => {
    if (!ackTimestampRef.current) {
      const now = Date.now();
      ackTimestampRef.current = now;
      ackAtRef.current = new Date(now).toISOString();
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

  // Finalize interaction telemetry contract
  // Calculates acknowledgement_time and execution_time reliably
  const finalizeInteraction = useCallback((): Interaction => {
    const completedTimestamp = Date.now();
    const completedAt = new Date().toISOString();

    let ackTimeSeconds: number;
    let execTimeSeconds: number;

    if (ackTimestampRef.current) {
      // 1. Acknowledgement timing: from step appearance until "I Understand"
      ackTimeSeconds = Math.max(
        1,
        Math.round((ackTimestampRef.current - shownTimestampRef.current) / 1000)
      );
      // 2. Execution timing: after acknowledgement until Next is pressed
      execTimeSeconds = Math.max(
        1,
        Math.round((completedTimestamp - ackTimestampRef.current) / 1000)
      );
    } else {
      // If user pressed Next directly without explicit "I Understand"
      const totalElapsed = Math.max(
        1,
        Math.round((completedTimestamp - shownTimestampRef.current) / 1000)
      );
      ackTimeSeconds = Math.max(1, Math.round(totalElapsed / 2));
      execTimeSeconds = Math.max(1, totalElapsed - ackTimeSeconds);
    }

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

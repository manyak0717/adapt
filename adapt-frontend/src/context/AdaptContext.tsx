import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { UserProfile, Task, Step, Interaction, Adaptation, AppScreen } from "../types";
import * as api from "../services/api";

interface AdaptContextType {
  screen: AppScreen;
  setScreen: (screen: AppScreen) => void;
  currentTask: Task | null;
  steps: Step[];
  currentStepIndex: number;
  currentStep: Step | null;
  currentAdaptation: Adaptation | null;
  userProfile: UserProfile | null;
  simulateDifficulty: boolean;
  keyboardMode: "normal" | "simplified";
  isProfileOpen: boolean;
  interactionHistory: Interaction[];
  isLoading: boolean;
  taskSummaryStats: {
    totalSteps: number;
    totalTimeSeconds: number;
    totalErrors: number;
    totalHelpRequests: number;
  };
  startTask: (prompt: string, mode?: "voice" | "keyboard" | "text") => Promise<void>;
  beginSteps: () => void;
  handleStepNext: (interaction: Interaction) => Promise<void>;
  handleStepPrevious: () => void;
  resetToDashboard: () => void;
  updateProfile: (updated: UserProfile) => Promise<void>;
  toggleSimulateDifficulty: () => void;
  setIsProfileOpen: (open: boolean) => void;
  setKeyboardMode: (mode: "normal" | "simplified") => void;
  setCurrentAdaptation: (adaptation: Adaptation | null) => void;
}

const AdaptContext = createContext<AdaptContextType | undefined>(undefined);

export const AdaptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screen, setScreen] = useState<AppScreen>("dashboard");
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentAdaptation, setCurrentAdaptation] = useState<Adaptation | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [simulateDifficulty, setSimulateDifficulty] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState<"normal" | "simplified">("normal");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [interactionHistory, setInteractionHistory] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load user profile on mount
  useEffect(() => {
    api.getUserProfile("USER_1027").then((profile) => {
      setUserProfile(profile);
      if (profile.ui_preferences.large_buttons) {
        setKeyboardMode("simplified");
      }
    });
  }, []);

  const currentStep = steps[currentStepIndex] || null;

  // Task initiation flow
  const startTask = useCallback(
    async (prompt: string, mode: "voice" | "keyboard" | "text" = "text") => {
      setIsLoading(true);
      setScreen("understanding");

      try {
        const task = await api.createTask(prompt, mode);
        setCurrentTask(task);
        const taskSteps = await api.getTaskSteps(task.task_id);
        setSteps(taskSteps);
        setCurrentStepIndex(0);
        setCurrentAdaptation(null);
        setInteractionHistory([]);
      } catch (err) {
        console.error("Failed to initialize task:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const beginSteps = useCallback(() => {
    setCurrentStepIndex(0);
    setScreen("step");
  }, []);

  // Moving to next step with telemetry recording and adaptation
  const handleStepNext = useCallback(
    async (interaction: Interaction) => {
      setIsLoading(true);
      try {
        // Record interaction to API
        await api.recordInteraction(interaction);
        setInteractionHistory((prev) => [...prev, interaction]);

        const nextIndex = currentStepIndex + 1;

        if (nextIndex < steps.length) {
          const nextStep = steps[nextIndex];
          // Retrieve dynamic adaptation for next step
          const nextAdaptation = await api.getAdaptation(
            currentTask?.task_id || "TASK_001",
            nextStep.step_id,
            interaction,
            simulateDifficulty
          );
          setCurrentAdaptation(nextAdaptation);
          setCurrentStepIndex(nextIndex);
        } else {
          // Completed all steps!
          setScreen("completion");
        }
      } catch (err) {
        console.error("Error processing step next:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [currentStepIndex, steps, currentTask, simulateDifficulty]
  );

  const handleStepPrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else {
      setScreen("overview");
    }
  }, [currentStepIndex]);

  const resetToDashboard = useCallback(() => {
    setScreen("dashboard");
    setCurrentTask(null);
    setSteps([]);
    setCurrentStepIndex(0);
    setCurrentAdaptation(null);
  }, []);

  const updateProfile = useCallback(async (updated: UserProfile) => {
    const saved = await api.updateUserProfile(updated);
    setUserProfile(saved);
  }, []);

  const toggleSimulateDifficulty = useCallback(() => {
    setSimulateDifficulty((prev) => {
      const nextVal = !prev;
      if (screen === "step" && currentStep) {
        api
          .getAdaptation(
            currentTask?.task_id || "TASK_001",
            currentStep.step_id,
            interactionHistory[interactionHistory.length - 1] || null,
            nextVal
          )
          .then((adapt) => {
            setCurrentAdaptation(adapt);
          });
      }
      return nextVal;
    });
  }, [screen, currentStep, currentTask, interactionHistory]);

  // Compute aggregated stats for completion summary
  const taskSummaryStats = {
    totalSteps: steps.length,
    totalTimeSeconds: interactionHistory.reduce((acc, curr) => acc + curr.execution_time, 0),
    totalErrors: interactionHistory.reduce((acc, curr) => acc + curr.error_count, 0),
    totalHelpRequests: interactionHistory.filter((i) => i.help_requested).length,
  };

  return (
    <AdaptContext.Provider
      value={{
        screen,
        setScreen,
        currentTask,
        steps,
        currentStepIndex,
        currentStep,
        currentAdaptation,
        userProfile,
        simulateDifficulty,
        keyboardMode,
        isProfileOpen,
        interactionHistory,
        isLoading,
        taskSummaryStats,
        startTask,
        beginSteps,
        handleStepNext,
        handleStepPrevious,
        resetToDashboard,
        updateProfile,
        toggleSimulateDifficulty,
        setIsProfileOpen,
        setKeyboardMode,
        setCurrentAdaptation,
      }}
    >
      {children}
    </AdaptContext.Provider>
  );
};

export const useAdapt = () => {
  const context = useContext(AdaptContext);
  if (!context) {
    throw new Error("useAdapt must be used within an AdaptProvider");
  }
  return context;
};

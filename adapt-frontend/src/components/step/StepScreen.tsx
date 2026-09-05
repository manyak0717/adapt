import React, { useState } from "react";
import { useAdapt } from "../../context/AdaptContext";
import { useInteractionTracker } from "../../hooks/useInteractionTracker";
import { ProgressBar } from "./ProgressBar";
import { StepRenderer } from "./StepRenderer";
import { AdaptationBanner } from "./AdaptationBanner";
import { ReadAloudButton } from "./ReadAloudButton";
import { HelpPanel } from "./HelpPanel";
import { ConfirmationDialog } from "../layout/ConfirmationDialog";
import { KeyboardSelector } from "../keyboard/KeyboardSelector";
import { useSpeech } from "../../hooks/useSpeech";
import { ArrowRight, Check, CheckCircle2 } from "lucide-react";

export const StepScreen: React.FC = () => {
  const {
    currentStep,
    currentStepIndex,
    steps,
    currentTask,
    currentAdaptation,
    handleStepNext,
    handleStepPrevious,
    userProfile,
    keyboardMode,
    setKeyboardMode,
    isLoading,
  } = useAdapt();

  const { speak } = useSpeech();

  // Local state for step user actions
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [typedValue, setTypedValue] = useState<string>("");
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);

  // Interaction Telemetry Tracker Hook
  const tracker = useInteractionTracker({
    userId: userProfile?.user_id || "USER_1027",
    taskId: currentTask?.task_id || "TASK_001",
    stepId: currentStep?.step_id || `STEP_${currentStepIndex + 1}`,
    inputMode: userProfile?.preferred_input || "keyboard",
  });

  if (!currentStep) return null;

  const totalSteps = steps.length;
  const isLargeText = currentAdaptation?.text_size === "large";
  const isLargeButtons = currentAdaptation?.button_size === "large";
  const isSimplified = currentAdaptation?.instruction_mode === "simplified";

  // The displayed instruction adapts dynamically based on adaptation mode
  const displayedTitle = isSimplified
    ? currentStep.short_instruction || currentStep.instruction
    : currentStep.instruction;

  const displayedSubtitle = isSimplified
    ? "Take your time and pick your choice below."
    : currentStep.short_instruction;

  // Handlers
  const handleSelectChoice = (choiceId: string) => {
    // If user clicked the same or changes mind, count as retry
    if (selectedChoiceId && selectedChoiceId !== choiceId) {
      tracker.recordRetry();
    }
    setSelectedChoiceId(choiceId);
  };

  const handleToggleConfirm = () => {
    setIsConfirmed((prev) => !prev);
  };

  const handleFileUpload = (fileName: string) => {
    setUploadedFileName(fileName);
  };

  const handleNextClick = () => {
    // If confirmation is required by adaptation, display the confirmation modal first
    if (currentAdaptation?.require_confirmation) {
      setShowConfirmationModal(true);
      return;
    }
    executeNext();
  };

  const executeNext = () => {
    setShowConfirmationModal(false);
    // Finalize interaction telemetry object
    const interactionPayload = tracker.finalizeInteraction();

    // Reset local step values for the next step
    setSelectedChoiceId(null);
    setTypedValue("");
    setIsConfirmed(false);
    setUploadedFileName(null);

    // Transition to next step with recorded interaction & adaptation fetch
    handleStepNext(interactionPayload);
  };

  const handleReadStepAloud = () => {
    tracker.recordAudioUsed();
    speak(currentStep.audio_text || currentStep.instruction);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Top: Progress Bar */}
      <section className="mb-6">
        <ProgressBar currentStep={currentStepIndex + 1} totalSteps={totalSteps} />
      </section>

      {/* Adaptation Notification Banner (When UI adapts) */}
      <AdaptationBanner adaptation={currentAdaptation} />

      {/* Main Step Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E5E7EB] shadow-sm mb-6">
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-6 border-b border-[#E5E7EB]/80">
          <div className="flex-1">
            <h1
              className={`font-bold text-[#111827] tracking-tight leading-snug mb-2 ${
                isLargeText ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
              }`}
            >
              {displayedTitle}
            </h1>
            {displayedSubtitle && (
              <p
                className={`text-[#64748B] font-medium ${
                  isLargeText ? "text-base sm:text-lg" : "text-sm sm:text-base"
                }`}
              >
                {displayedSubtitle}
              </p>
            )}
          </div>

          {/* Read Aloud Trigger */}
          <div className="shrink-0 self-start">
            <ReadAloudButton
              textToSpeak={currentStep.audio_text || currentStep.instruction}
              isPriority={currentAdaptation?.audio_priority}
              onAudioUsed={() => tracker.recordAudioUsed()}
            />
          </div>
        </div>

        {/* Dynamic Action Area via StepRenderer */}
        <section className="mb-8">
          <StepRenderer
            step={currentStep}
            adaptation={currentAdaptation}
            selectedChoiceId={selectedChoiceId}
            onSelectChoice={handleSelectChoice}
            typedValue={typedValue}
            onTypeChange={setTypedValue}
            onOpenKeyboard={() => setIsKeyboardOpen(true)}
            isConfirmed={isConfirmed}
            onToggleConfirm={handleToggleConfirm}
            uploadedFileName={uploadedFileName}
            onFileUpload={handleFileUpload}
          />
        </section>

        {/* I UNDERSTAND and Acknowledgement Row */}
        <div className="pt-6 border-t border-[#E5E7EB]/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto">
            {!tracker.isAcknowledged ? (
              <button
                type="button"
                onClick={() => tracker.acknowledge()}
                className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-[#F7F8FC] hover:bg-[#E5E7EB] border-2 border-[#E5E7EB] text-[#111827] font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-98"
                aria-label="Acknowledge step understanding"
              >
                <Check className="w-4 h-4 text-[#635BFF]" />
                <span>I UNDERSTAND</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold text-[#16A34A] py-2 px-3 bg-[#16A34A]/10 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span>Understood</span>
              </div>
            )}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNextClick}
            disabled={isLoading}
            className={`w-full sm:w-auto flex-1 max-w-xs rounded-2xl bg-[#635BFF] hover:bg-[#5046E5] text-white font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-transform active:scale-98 cursor-pointer select-none ${
              isLargeButtons
                ? "py-5 px-8 text-xl touch-target-large"
                : "py-4 px-7 text-base"
            }`}
          >
            <span>{currentStepIndex + 1 === totalSteps ? "Finish" : "Next"}</span>
            <ArrowRight className={isLargeButtons ? "w-6 h-6" : "w-5 h-5"} />
          </button>
        </div>
      </div>

      {/* Need Help? Assistant Panel */}
      <section>
        <HelpPanel
          step={currentStep}
          onHelpRequested={() => tracker.recordHelpRequested()}
          onReadAloud={handleReadStepAloud}
          onGoBack={handleStepPrevious}
        />
      </section>

      {/* Confirmation Dialog when require_confirmation is true */}
      <ConfirmationDialog
        isOpen={showConfirmationModal}
        title="Ready to proceed?"
        message="Please check that your selection is what you intended before moving to the next step."
        confirmLabel="Continue"
        cancelLabel="Review choice"
        onConfirm={executeNext}
        onCancel={() => setShowConfirmationModal(false)}
        largeButtons={isLargeButtons}
      />

      {/* On-screen virtual keyboard for type steps */}
      <KeyboardSelector
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        activeMode={keyboardMode}
        onModeChange={setKeyboardMode}
        currentValue={typedValue}
        onChar={(char) => setTypedValue((prev) => prev + char)}
        onBackspace={() => setTypedValue((prev) => prev.slice(0, -1))}
        onSpace={() => setTypedValue((prev) => prev + " ")}
        onSubmit={() => setIsKeyboardOpen(false)}
      />
    </div>
  );
};

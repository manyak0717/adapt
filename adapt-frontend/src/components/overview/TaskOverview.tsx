import React from "react";
import { useAdapt } from "../../context/AdaptContext";
import { useSpeech } from "../../hooks/useSpeech";
import { Volume2, ArrowRight, Sparkles, VolumeX } from "lucide-react";

export const TaskOverview: React.FC = () => {
  const { currentTask, steps, beginSteps } = useAdapt();
  const { isSpeaking, speak, stop } = useSpeech();

  const handleReadAloud = () => {
    if (isSpeaking) {
      stop();
      return;
    }

    const taskTitle = currentTask?.normalized_task || currentTask?.original_input || "your task";
    const summaryText = currentTask?.overview_stages
      ? currentTask.overview_stages.map((s, idx) => `Stage ${idx + 1}: ${s}.`).join(" ")
      : steps.map((s, idx) => `Step ${idx + 1}, ${s.short_instruction || s.instruction}.`).join(" ");

    const textToNarrate = `Here is your overview for ${taskTitle}. We will do this together, one step at a time. There are ${steps.length} detailed steps. ${summaryText} When you are ready, press Start.`;

    speak(textToNarrate);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header card */}
      <section className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Task Blueprint Ready</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold text-[#111827] tracking-tight mb-2">
          {currentTask?.original_input || "Book a Doctor Appointment"}
        </h1>

        <p className="text-base sm:text-lg text-[#64748B] font-medium">
          We'll do this together, one step at a time.
        </p>
      </section>

      {/* Vertical timeline card layout */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-xs mb-8">
        <div className="space-y-4">
          {currentTask?.overview_stages && currentTask.overview_stages.length > 0
            ? currentTask.overview_stages.map((stage, idx) => {
                const stepFormattedNumber = String(idx + 1).padStart(2, "0");
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-[#F7F8FC] border border-[#E5E7EB]/80 hover:border-[#635BFF]/30 transition-colors"
                  >
                    <span className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] text-[#635BFF] font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {stepFormattedNumber}
                    </span>

                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-[#111827] text-base leading-snug">
                        {stage}
                      </h2>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Stage {idx + 1} of {currentTask.overview_stages?.length ?? 0}
                      </p>
                    </div>
                  </div>
                );
              })
            : steps.map((step, idx) => {
                const stepFormattedNumber = String(idx + 1).padStart(2, "0");
                return (
                  <div
                    key={step.step_id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-[#F7F8FC] border border-[#E5E7EB]/80 hover:border-[#635BFF]/30 transition-colors"
                  >
                    <span className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] text-[#635BFF] font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {stepFormattedNumber}
                    </span>

                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-[#111827] text-base leading-snug">
                        {step.short_instruction || step.instruction}
                      </h2>
                      <p className="text-xs text-[#64748B] mt-0.5 capitalize">
                        Action: {step.action_type}
                      </p>
                    </div>
                  </div>
                );
              })}
        </div>

        {currentTask?.overview_stages && (
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-[#64748B]">
            <span>Detailed action breakdown</span>
            <span className="font-bold text-[#635BFF] bg-[#635BFF]/10 px-2.5 py-1 rounded-full">
              {steps.length} micro-steps prepared
            </span>
          </div>
        )}
      </section>

      {/* Control Buttons */}
      <section className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        {/* Read aloud toggle */}
        <button
          onClick={handleReadAloud}
          className={`w-full sm:w-auto py-4 px-6 rounded-2xl border font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            isSpeaking
              ? "bg-[#635BFF]/10 text-[#635BFF] border-[#635BFF]"
              : "bg-white border-[#E5E7EB] text-[#111827] hover:bg-[#F7F8FC]"
          }`}
          aria-label={isSpeaking ? "Stop reading overview" : "Read overview aloud"}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-5 h-5 text-[#635BFF]" />
              <span>Stop reading</span>
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5 text-[#635BFF]" />
              <span>Read overview aloud</span>
            </>
          )}
        </button>

        {/* Start button */}
        <button
          onClick={beginSteps}
          className="w-full sm:flex-1 py-4 px-8 rounded-2xl bg-[#635BFF] hover:bg-[#5046E5] text-white font-bold text-lg flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-transform active:scale-98 cursor-pointer"
        >
          <span>Start</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </section>
    </div>
  );
};

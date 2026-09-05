import React, { useEffect } from "react";
import { useAdapt } from "../../context/AdaptContext";
import confetti from "canvas-confetti";
import { Check, CheckCircle2, Clock, HelpCircle, ShieldCheck, Sparkles, RotateCcw } from "lucide-react";

export const CompletionScreen: React.FC = () => {
  const { currentTask, taskSummaryStats, resetToDashboard } = useAdapt();

  useEffect(() => {
    // Launch celebratory confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#635BFF", "#14B8A6", "#16A34A", "#F59E0B"],
      });
    } catch {
      // ignore
    }
  }, []);

  const taskTitle = currentTask?.original_input || "Your task";

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center animate-fade-in">
      {/* Huge checkmark badge */}
      <div className="relative inline-flex items-center justify-center mb-6">
        <div className="w-24 h-24 rounded-3xl bg-[#16A34A] text-white flex items-center justify-center shadow-xl shadow-[#16A34A]/25">
          <Check className="w-12 h-12 stroke-[3]" />
        </div>
        <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#14B8A6] flex items-center justify-center text-white text-xs">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight mb-2">
        You're all done!
      </h1>

      <p className="text-lg text-[#64748B] mb-8 font-medium">
        {taskTitle} process completed successfully.
      </p>

      {/* Metrics Summary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-xs mb-8 text-left">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#F7F8FC] border border-[#E5E7EB]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B] mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Steps Finished</span>
            </div>
            <p className="text-2xl font-bold text-[#111827]">
              {taskSummaryStats.totalSteps} / {taskSummaryStats.totalSteps}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F8FC] border border-[#E5E7EB]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B] mb-1">
              <Clock className="w-3.5 h-3.5 text-[#635BFF]" />
              <span>Total Time</span>
            </div>
            <p className="text-2xl font-bold text-[#111827]">
              {taskSummaryStats.totalTimeSeconds > 0 ? `${taskSummaryStats.totalTimeSeconds}s` : "32s"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F8FC] border border-[#E5E7EB]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B] mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>Retries</span>
            </div>
            <p className="text-2xl font-bold text-[#111827]">
              {taskSummaryStats.totalErrors}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F8FC] border border-[#E5E7EB]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B] mb-1">
              <HelpCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Help Requests</span>
            </div>
            <p className="text-2xl font-bold text-[#111827]">
              {taskSummaryStats.totalHelpRequests}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-[#14B8A6] font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>ADAPT helped simplify your experience.</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={resetToDashboard}
          className="py-4 px-6 rounded-2xl border-2 border-[#E5E7EB] text-[#111827] font-bold text-base hover:bg-[#F7F8FC] transition-colors cursor-pointer"
        >
          Done
        </button>

        <button
          type="button"
          onClick={resetToDashboard}
          className="py-4 px-8 rounded-2xl bg-[#635BFF] hover:bg-[#5046E5] text-white font-bold text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-transform active:scale-98 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Start another task</span>
        </button>
      </div>
    </div>
  );
};

import React from "react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full select-none" role="region" aria-label="Progress tracker">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#635BFF]">
          STEP {currentStep} OF {totalSteps}
        </span>
        <span className="text-xs font-semibold text-[#64748B]">
          {percentage}% Complete
        </span>
      </div>

      <div
        className="w-full h-2.5 sm:h-3 bg-[#E5E7EB] rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Step ${currentStep} of ${totalSteps}`}
      >
        <div
          className="h-full bg-gradient-to-r from-[#635BFF] to-[#14B8A6] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

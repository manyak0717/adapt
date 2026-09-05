import React, { useState } from "react";
import { Sparkles, X } from "lucide-react";
import type { Adaptation } from "../../types";

interface AdaptationBannerProps {
  adaptation: Adaptation | null;
}

export const AdaptationBanner: React.FC<AdaptationBannerProps> = ({ adaptation }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Only render if adaptation is simplified or enlarged
  if (
    !adaptation ||
    isDismissed ||
    (adaptation.instruction_mode === "normal" &&
      adaptation.text_size === "normal" &&
      adaptation.button_size === "normal" &&
      !adaptation.audio_priority)
  ) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-6 rounded-2xl bg-gradient-to-r from-[#635BFF]/8 to-[#14B8A6]/8 border border-[#635BFF]/20 p-4 transition-all duration-300 animate-fade-in"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#635BFF]/15 text-[#635BFF] flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-[#111827]">
              ADAPT adjusted this step for you.
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Based on your recent interaction.
            </p>

            {/* Respectful behavioural adjustment badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {adaptation.instruction_mode === "simplified" && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[#635BFF]">
                  Simplified text
                </span>
              )}
              {adaptation.button_size === "large" && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[#14B8A6]">
                  Larger touch targets
                </span>
              )}
              {adaptation.audio_priority && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-indigo-600">
                  Audio assistance ready
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-white/80 transition-colors"
          aria-label="Dismiss adaptation message"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

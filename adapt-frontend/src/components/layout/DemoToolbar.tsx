import React, { useState } from "react";
import { useAdapt } from "../../context/AdaptContext";
import { Activity, ChevronUp, ChevronDown, CheckCircle, AlertTriangle } from "lucide-react";

export const DemoToolbar: React.FC = () => {
  const {
    simulateDifficulty,
    toggleSimulateDifficulty,
    currentAdaptation,
    interactionHistory,
  } = useAdapt();

  const [isExpanded, setIsExpanded] = useState(false);

  const lastInteraction = interactionHistory[interactionHistory.length - 1] || null;

  return (
    <aside
      aria-label="Demo Telemetry Inspector"
      className="fixed bottom-4 right-4 z-40 max-w-sm w-full transition-all duration-300 pointer-events-auto"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#E5E7EB] shadow-xl p-3 text-xs text-[#111827]">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-500/10 text-amber-600">
              <Activity className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="font-bold text-[11px] uppercase tracking-wider text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                Dev / Demo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Simulate difficulty toggle */}
            <label
              className="flex items-center gap-2 cursor-pointer select-none bg-[#F7F8FC] px-2.5 py-1 rounded-xl border border-[#E5E7EB]"
              title="Simulate behavioral hesitation and trigger adaptation on next step"
            >
              <input
                type="checkbox"
                checked={simulateDifficulty}
                onChange={toggleSimulateDifficulty}
                className="sr-only"
              />
              <span className="text-[11px] font-medium text-[#64748B]">Simulate difficulty</span>
              <div
                className={`w-8 h-4 rounded-full transition-colors relative flex items-center ${
                  simulateDifficulty ? "bg-[#635BFF]" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                    simulateDifficulty ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
            </label>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg hover:bg-[#F7F8FC] text-[#64748B] hover:text-[#111827] transition-colors"
              aria-label={isExpanded ? "Collapse telemetry" : "Expand telemetry"}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Status indicator badge */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-[#64748B] pt-1.5 border-t border-gray-100">
          <span>State:</span>
          {simulateDifficulty ? (
            <span className="inline-flex items-center gap-1 font-semibold text-[#635BFF]">
              <AlertTriangle className="w-3 h-3 text-[#F59E0B]" /> High Assistance Triggered
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[#16A34A] font-medium">
              <CheckCircle className="w-3 h-3 text-[#16A34A]" /> Standard Observation
            </span>
          )}
        </div>

        {/* Expanded telemetry panel */}
        {isExpanded && (
          <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-2 max-h-64 overflow-y-auto font-mono text-[10px]">
            <div>
              <p className="font-semibold text-[#111827] mb-0.5 font-sans">Active Step Adaptation:</p>
              {currentAdaptation ? (
                <div className="bg-[#F7F8FC] p-2 rounded-lg border border-[#E5E7EB] space-y-1">
                  <div>
                    <span className="text-[#64748B]">Mode:</span>{" "}
                    <span className="text-[#635BFF] font-semibold">{currentAdaptation.instruction_mode}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Sizes:</span> text: {currentAdaptation.text_size} | btn: {currentAdaptation.button_size}
                  </div>
                  <div>
                    <span className="text-[#64748B]">Audio Priority:</span> {currentAdaptation.audio_priority ? "Yes" : "No"}
                  </div>
                  {currentAdaptation.reason.length > 0 && (
                    <div>
                      <span className="text-[#64748B]">Reasons:</span>
                      <ul className="list-disc list-inside text-gray-700 text-[9px] mt-0.5">
                        {currentAdaptation.reason.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400 italic">No adaptation active on initial step</div>
              )}
            </div>

            <div>
              <p className="font-semibold text-[#111827] mb-0.5 font-sans">Last Recorded Interaction:</p>
              {lastInteraction ? (
                <div className="bg-[#F7F8FC] p-2 rounded-lg border border-[#E5E7EB] space-y-0.5">
                  <div>
                    <span className="text-[#64748B]">Step ID:</span> {lastInteraction.step_id}
                  </div>
                  <div>
                    <span className="text-[#64748B]">Ack Time:</span> {lastInteraction.acknowledgement_time}s |{" "}
                    <span className="text-[#64748B]">Exec Time:</span> {lastInteraction.execution_time}s
                  </div>
                  <div>
                    <span className="text-[#64748B]">Errors:</span> {lastInteraction.error_count} |{" "}
                    <span className="text-[#64748B]">Retries:</span> {lastInteraction.retry_count} |{" "}
                    <span className="text-[#64748B]">Help:</span> {lastInteraction.help_requested ? "Yes" : "No"}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 italic">No interactions completed yet</div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

import React, { useState } from "react";
import { useAdapt } from "../../context/AdaptContext";
import { X, User, Activity, Sliders, Shield } from "lucide-react";
import type { UserProfile } from "../../types";

export const ProfileModal: React.FC = () => {
  const { isProfileOpen, setIsProfileOpen, userProfile, updateProfile } = useAdapt();

  const [localPreferences, setLocalPreferences] = useState(
    userProfile?.ui_preferences || {
      large_buttons: false,
      simplified_text: false,
      audio_priority: false,
      extra_confirmation: false,
    }
  );

  const [preferredInput, setPreferredInput] = useState<"voice" | "keyboard" | "text">(
    userProfile?.preferred_input || "keyboard"
  );

  if (!isProfileOpen || !userProfile) return null;

  const handleToggle = (key: keyof typeof localPreferences) => {
    setLocalPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    const updated: UserProfile = {
      ...userProfile,
      preferred_input: preferredInput,
      ui_preferences: { ...localPreferences },
    };
    updateProfile(updated);
    setIsProfileOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E5E7EB] p-6 sm:p-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center font-bold">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 id="profile-dialog-title" className="text-xl font-bold text-[#111827]">
                User Profile & Preferences
              </h2>
              <p className="text-xs text-[#64748B]">ID: {userProfile.user_id} • {userProfile.name}</p>
            </div>
          </div>

          <button
            onClick={() => setIsProfileOpen(false)}
            className="p-2 rounded-xl text-[#64748B] hover:text-[#111827] hover:bg-[#F7F8FC] transition-colors cursor-pointer"
            aria-label="Close profile modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Behavioral Interaction Profile */}
        <div className="mt-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#111827] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#635BFF]" />
              <span>Observed Interaction Patterns</span>
            </h3>
            <span className="text-[11px] text-[#64748B] bg-[#F7F8FC] px-2 py-0.5 rounded-md border border-[#E5E7EB]">
              Behavioral Telemetry
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="bg-[#F7F8FC] p-3.5 rounded-2xl border border-[#E5E7EB]">
              <p className="text-[11px] text-[#64748B]">Click Accuracy</p>
              <p className="text-base font-bold text-[#111827] mt-0.5">82%</p>
            </div>

            <div className="bg-[#F7F8FC] p-3.5 rounded-2xl border border-[#E5E7EB]">
              <p className="text-[11px] text-[#64748B]">Avg Response Time</p>
              <p className="text-base font-bold text-[#111827] mt-0.5">
                {userProfile.avg_acknowledgement_time || 7.4}s
              </p>
            </div>

            <div className="bg-[#F7F8FC] p-3.5 rounded-2xl border border-[#E5E7EB]">
              <p className="text-[11px] text-[#64748B]">Repeated Clicks</p>
              <p className="text-base font-bold text-[#F59E0B] mt-0.5">Elevated</p>
            </div>

            <div className="bg-[#F7F8FC] p-3.5 rounded-2xl border border-[#E5E7EB]">
              <p className="text-[11px] text-[#64748B]">Backtracking</p>
              <p className="text-base font-bold text-[#111827] mt-0.5">Moderate</p>
            </div>

            <div className="bg-[#F7F8FC] p-3.5 rounded-2xl border border-[#E5E7EB]">
              <p className="text-[11px] text-[#64748B]">Long Text Pacing</p>
              <p className="text-base font-bold text-[#111827] mt-0.5">Gradual</p>
            </div>

            <div className="bg-[#F7F8FC] p-3.5 rounded-2xl border border-[#E5E7EB]">
              <p className="text-[11px] text-[#64748B]">Small Target Errors</p>
              <p className="text-base font-bold text-[#F59E0B] mt-0.5">Frequent</p>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 text-[11px] text-[#64748B] bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
            <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Telemetry metrics measure interaction pacing and precision. ADAPT uses these values solely to ease navigation.
            </p>
          </div>
        </div>

        {/* Section 2: Preferred UI & Assistive Settings */}
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#111827] mb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#14B8A6]" />
            <span>Interactive Preferences</span>
          </h3>

          <div className="space-y-3">
            {/* Large buttons */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F8FC] border border-[#E5E7EB] hover:border-[#635BFF]/30 cursor-pointer transition-colors">
              <div>
                <p className="text-sm font-bold text-[#111827]">Large Touch Targets</p>
                <p className="text-xs text-[#64748B]">Enlarges all clickable buttons and choice cards</p>
              </div>
              <input
                type="checkbox"
                checked={localPreferences.large_buttons}
                onChange={() => handleToggle("large_buttons")}
                className="w-5 h-5 rounded-md accent-[#635BFF] cursor-pointer"
              />
            </label>

            {/* Simplified text */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F8FC] border border-[#E5E7EB] hover:border-[#635BFF]/30 cursor-pointer transition-colors">
              <div>
                <p className="text-sm font-bold text-[#111827]">Simplified Instructions</p>
                <p className="text-xs text-[#64748B]">Reduces text density to essential cues</p>
              </div>
              <input
                type="checkbox"
                checked={localPreferences.simplified_text}
                onChange={() => handleToggle("simplified_text")}
                className="w-5 h-5 rounded-md accent-[#635BFF] cursor-pointer"
              />
            </label>

            {/* Audio priority */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F8FC] border border-[#E5E7EB] hover:border-[#635BFF]/30 cursor-pointer transition-colors">
              <div>
                <p className="text-sm font-bold text-[#111827]">Audio Priority Assistance</p>
                <p className="text-xs text-[#64748B]">Highlights spoken explanations on every step</p>
              </div>
              <input
                type="checkbox"
                checked={localPreferences.audio_priority}
                onChange={() => handleToggle("audio_priority")}
                className="w-5 h-5 rounded-md accent-[#635BFF] cursor-pointer"
              />
            </label>

            {/* Extra confirmation */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F8FC] border border-[#E5E7EB] hover:border-[#635BFF]/30 cursor-pointer transition-colors">
              <div>
                <p className="text-sm font-bold text-[#111827]">Step Confirmation Prompts</p>
                <p className="text-xs text-[#64748B]">Confirms actions before proceeding forward</p>
              </div>
              <input
                type="checkbox"
                checked={localPreferences.extra_confirmation}
                onChange={() => handleToggle("extra_confirmation")}
                className="w-5 h-5 rounded-md accent-[#635BFF] cursor-pointer"
              />
            </label>

            {/* Preferred Input Mode */}
            <div className="p-3.5 rounded-2xl bg-[#F7F8FC] border border-[#E5E7EB]">
              <p className="text-sm font-bold text-[#111827] mb-1">Default Input Method</p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(["keyboard", "voice", "text"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPreferredInput(mode)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                      preferredInput === mode
                        ? "bg-[#635BFF] text-white"
                        : "bg-white border border-[#E5E7EB] text-[#111827] hover:bg-gray-100"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsProfileOpen(false)}
            className="flex-1 py-3.5 px-5 rounded-2xl border border-[#E5E7EB] text-[#64748B] font-semibold hover:bg-[#F7F8FC] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-[#635BFF] hover:bg-[#5046E5] text-white font-bold transition-all shadow-md active:scale-98 cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { Mic, Keyboard, ArrowRight } from "lucide-react";
import { KeyboardSelector } from "../keyboard/KeyboardSelector";
import { VoiceInputModal } from "./VoiceInputModal";
import { useAdapt } from "../../context/AdaptContext";

interface TaskInputProps {
  onSubmit: (prompt: string, mode: "voice" | "keyboard" | "text") => void;
  isLoading?: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onSubmit, isLoading = false }) => {
  const { keyboardMode, setKeyboardMode } = useAdapt();
  const [value, setValue] = useState("");
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim() || isLoading) return;
    onSubmit(value.trim(), "text");
  };

  const handleVoiceSubmit = (text: string) => {
    setValue(text);
    onSubmit(text, "voice");
  };

  const handleChar = (char: string) => {
    setValue((prev) => prev + char);
  };

  const handleBackspace = () => {
    setValue((prev) => prev.slice(0, -1));
  };

  const handleSpace = () => {
    setValue((prev) => prev + " ");
  };

  const handleKeyboardSubmit = () => {
    setIsKeyboardOpen(false);
    if (value.trim()) {
      onSubmit(value.trim(), "keyboard");
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center bg-white rounded-3xl border-2 border-[#E5E7EB] hover:border-[#635BFF]/40 focus-within:border-[#635BFF] focus-within:ring-4 focus-within:ring-[#635BFF]/10 shadow-sm transition-all duration-200">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Tell me what you want to do..."
            disabled={isLoading}
            className="w-full py-5 sm:py-6 pl-6 pr-36 sm:pr-44 text-lg sm:text-xl text-[#111827] placeholder-[#64748B] bg-transparent border-none focus:outline-none"
            aria-label="What would you like to do?"
          />

          {/* Action buttons inside the right end of the input */}
          <div className="absolute right-3 flex items-center gap-1.5 sm:gap-2">
            {/* Keyboard button */}
            <button
              type="button"
              onClick={() => setIsKeyboardOpen(true)}
              className="p-3 rounded-2xl text-[#64748B] hover:text-[#635BFF] hover:bg-[#F7F8FC] transition-colors cursor-pointer"
              title="Open on-screen keyboard"
              aria-label="Open on-screen keyboard"
            >
              <Keyboard className="w-5 h-5" />
            </button>

            {/* Voice input button */}
            <button
              type="button"
              onClick={() => setIsVoiceOpen(true)}
              className="p-3 rounded-2xl bg-[#635BFF]/10 text-[#635BFF] hover:bg-[#635BFF]/20 transition-colors cursor-pointer"
              title="Speak your goal"
              aria-label="Speak your goal"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!value.trim() || isLoading}
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                value.trim() && !isLoading
                  ? "bg-[#635BFF] text-white hover:bg-[#5046E5] shadow-md hover:scale-105 active:scale-95"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              aria-label="Start task"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </form>

      {/* Voice Input Modal */}
      <VoiceInputModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSubmit={handleVoiceSubmit}
        initialPromptSuggestion="I want to book a doctor's appointment"
      />

      {/* On-screen Keyboard Selector */}
      <KeyboardSelector
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        activeMode={keyboardMode}
        onModeChange={setKeyboardMode}
        currentValue={value}
        onChar={handleChar}
        onBackspace={handleBackspace}
        onSpace={handleSpace}
        onSubmit={handleKeyboardSubmit}
      />
    </div>
  );
};

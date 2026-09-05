import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useSpeech } from "../../hooks/useSpeech";

interface ReadAloudButtonProps {
  textToSpeak: string;
  isPriority?: boolean;
  onAudioUsed?: () => void;
}

export const ReadAloudButton: React.FC<ReadAloudButtonProps> = ({
  textToSpeak,
  isPriority = false,
  onAudioUsed,
}) => {
  const { isSpeaking, speak, stop } = useSpeech();

  const handleToggle = () => {
    if (isSpeaking) {
      stop();
    } else {
      onAudioUsed?.();
      speak(textToSpeak);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-2 rounded-2xl font-semibold transition-all cursor-pointer select-none ${
        isPriority
          ? "py-3 px-5 text-base bg-[#635BFF]/10 text-[#635BFF] border-2 border-[#635BFF] hover:bg-[#635BFF]/15 shadow-xs animate-pulse-subtle"
          : "py-2.5 px-4 text-sm bg-white text-[#111827] border border-[#E5E7EB] hover:bg-[#F7F8FC]"
      } ${isSpeaking ? "bg-[#111827] text-white border-[#111827]" : ""}`}
      aria-label={isSpeaking ? "Stop reading step aloud" : "Read step aloud"}
      aria-pressed={isSpeaking}
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-4 h-4 text-white" />
          <span>Stop reading</span>
        </>
      ) : (
        <>
          <Volume2 className={`w-4 h-4 ${isPriority ? "text-[#635BFF]" : "text-[#635BFF]"}`} />
          <span>{isPriority ? "Listen to this step" : "Read aloud"}</span>
        </>
      )}
    </button>
  );
};

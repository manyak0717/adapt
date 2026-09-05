import { useState, useCallback, useEffect } from "react";
import { speechService } from "../services/speechService";

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      speechService.stop();
    };
  }, []);

  const speak = useCallback((text: string, onDone?: () => void) => {
    setIsSpeaking(true);
    speechService.speak(
      text,
      () => setIsSpeaking(true),
      () => {
        setIsSpeaking(false);
        onDone?.();
      },
      () => {
        setIsSpeaking(false);
      }
    );
  }, []);

  const stop = useCallback(() => {
    speechService.stop();
    setIsSpeaking(false);
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
  };
}

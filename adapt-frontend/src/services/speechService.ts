// ===================================================
// SPEECH SERVICE (TTS & STT)
// ===================================================

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
    }
  }

  /**
   * Speak the provided text aloud using browser SpeechSynthesis.
   */
  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): boolean {
    if (!this.synth) {
      console.warn("Speech synthesis not supported in this environment");
      return false;
    }

    try {
      this.stop(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Slightly slower, calm and clear pacing
      utterance.pitch = 1.0;
      utterance.lang = "en-US";

      // Select high quality voice if available
      const voices = this.synth.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Samantha") ||
            v.name.includes("Daniel"))
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        onStart?.();
      };
      utterance.onend = () => {
        this.currentUtterance = null;
        onEnd?.();
      };
      utterance.onerror = (e) => {
        this.currentUtterance = null;
        onError?.(e);
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
      return true;
    } catch (e) {
      console.error("Failed to speak text", e);
      onError?.(e);
      return false;
    }
  }

  /**
   * Stop any current speech playback.
   */
  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Check if speech synthesis is actively playing.
   */
  public isSpeaking(): boolean {
    return !!this.synth && this.synth.speaking;
  }

  /**
   * Get the active utterance if currently speaking.
   */
  public getActiveUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }
}

export const speechService = new SpeechService();

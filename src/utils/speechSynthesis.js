/**
 * speechSynthesis.js
 * Browser-native Text-to-Speech
 * Default language: en-IN
 */

export function isTTSSupported() {
    return (
        typeof window !== "undefined" &&
        "speechSynthesis" in window
    );
}

function findBestVoice(lang = "en-IN") {

    const voices = window.speechSynthesis.getVoices() || [];

    return (
        voices.find(
            voice =>
                voice.lang.toLowerCase() === lang.toLowerCase()
        ) ||

        voices.find(
            voice =>
                voice.lang.toLowerCase().startsWith("en")
        ) ||

        voices[0] ||

        null
    );
}

/**
 * Speak text aloud.
 */
export function speak(
    text,
    {
        lang = "en-IN",
        rate = 0.95,
        onStart,
        onEnd,
        onError
    } = {}
) {

    if (!isTTSSupported()) {

        if (onError) {
            onError(
                new Error(
                    "Text-to-speech is not supported in this browser."
                )
            );
        }

        return false;
    }

    const cleanText = (text || "").trim();

    if (!cleanText) {
        return false;
    }

    // Stop any previous speech
    window.speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(cleanText);

    utterance.lang = lang;
    utterance.rate = rate;

    const voice = findBestVoice(lang);

    if (voice) {
        utterance.voice = voice;
    }

    if (onStart) {
        utterance.onstart = onStart;
    }

    if (onEnd) {
        utterance.onend = onEnd;
    }

    if (onError) {
        utterance.onerror = onError;
    }

    window.speechSynthesis.speak(utterance);

    return true;
}

/**
 * Stop speaking.
 */
export function stopSpeaking() {

    if (isTTSSupported()) {
        window.speechSynthesis.cancel();
    }
}
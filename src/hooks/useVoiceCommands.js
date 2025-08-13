import { useEffect, useState, useCallback } from "react";

/**
 * Custom hook to handle microphone voice input.
 * Supports starting/stopping recognition and returns the transcript.
 */
export default function useVoiceCommands(onCommand) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  const startListening = useCallback(() => {
    if (!recognition) return;
    recognition.start();
    setListening(true);
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (!recognition) return;
    recognition.stop();
    setListening(false);
  }, [recognition]);

  useEffect(() => {
    if (!recognition) {
      console.warn("SpeechRecognition API not supported in this browser.");
      return;
    }

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript.toLowerCase();
      setTranscript(spokenText);
      if (onCommand) onCommand(spokenText);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };
  }, [recognition, onCommand]);

  return { listening, transcript, startListening, stopListening };
}

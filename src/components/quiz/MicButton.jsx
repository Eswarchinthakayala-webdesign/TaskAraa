// components/quiz/MicButton.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";

export default function MicButton({ onResult, listeningLabel = "Listening...", idleLabel = "Speak your quiz request" }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult && onResult(transcript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
    };
  }, [onResult]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <motion.div whileTap={{ scale: 0.95 }} className="flex flex-col items-center">
      <Button
        onClick={toggleListening}
        variant={isListening ? "destructive" : "default"}
        size="icon"
        className={`rounded-full w-16 h-16 flex items-center justify-center`}
      >
        {isListening ? <MicOff size={28} /> : <Mic size={28} />}
      </Button>
      <span className="text-sm mt-2 text-muted-foreground">
        {isListening ? listeningLabel : idleLabel}
      </span>
    </motion.div>
  );
}

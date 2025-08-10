import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react"; // from lucide-react icons
import { Button } from "@/components/ui/button";

export default function SaveTaskButton({ onSave }) {
  const [status, setStatus] = useState("idle"); // idle | saving | saved

  const handleClick = async () => {
    setStatus("saving");
    try {
      await onSave(); // This is your DB saving logic
      setStatus("saved");
      setTimeout(() => {
        setStatus("idle");
      }, 1500); // show "saved" for 1.5s
    } catch (error) {
      setStatus("idle");
      console.error("Save failed:", error);
    }
  };

  return (
    <div className="md:col-span-2 flex justify-end">
      <Button
        type="button"
        onClick={handleClick}
        disabled={status === "saving"}
        className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white font-semibold px-6 py-2 cursor-pointer shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
      >
        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              Save Task
            </motion.span>
          )}
          {status === "saving" && (
            <motion.span
              key="saving"
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Loader2 className="animate-spin w-4 h-4" />
              Saving...
            </motion.span>
          )}
          {status === "saved" && (
            <motion.span
              key="saved"
              className="flex items-center gap-2 text-green-400"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Check className="w-4 h-4" />
              Saved!
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </div>
  );
}

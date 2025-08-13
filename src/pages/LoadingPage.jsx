import React from "react";
import { motion } from "framer-motion";

export default function LoadingPage() {
  return (
    <div className="flex flex-col rounded items-center justify-center h-screen bg-gradient-to-b from-[#0f0f1b] to-[#1b1b2f] text-white overflow-hidden">
      
      {/* Spinning Ring */}
      <motion.div
        className="w-32 h-32 border-4 border-purple-500 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />

      {/* Glowing Pulse */}
      <motion.div
        className="absolute w-40 h-40 rounded-full bg-purple-700 blur-3xl opacity-40"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut",
        }}
      />

      {/* Loading Text */}
      <motion.h1
        className="mt-10 text-2xl font-semibold tracking-wide"
        animate={{
          opacity: [0.2, 1, 0.2],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
        }}
      >
        Fetching<span className="text-purple-400">...</span>
      </motion.h1>

      {/* Typing Animation */}
      <div className="mt-4">
        <motion.div
          className="h-1 bg-purple-500 rounded-full"
          animate={{ width: ["0%", "100%", "0%"] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      </div>
    </div>
  );
}

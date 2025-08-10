import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
export default function HeroSection() {
    const navigate = useNavigate();

  const handleStartJourney = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      // User already logged in
      navigate("/dashboard");
    } else {
      // First-time user or logged out
      navigate("/signup");
    }
  };

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden px-4 md:px-8">
      {/* Animated Background Blobs */}
      <motion.div
        className="absolute top-[-8rem] left-[-8rem] w-[25rem] h-[25rem] md:w-[30rem] md:h-[30rem] bg-purple-600 rounded-full opacity-30 blur-3xl"
        animate={{ x: [0, 100, -100, 0], y: [0, 100, -100, 0] }}
        transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-8rem] right-[-8rem] w-[20rem] h-[20rem] md:w-[25rem] md:h-[25rem] bg-pink-500 rounded-full opacity-30 blur-3xl"
        animate={{ x: [0, -120, 120, 0], y: [0, -120, 120, 0] }}
        transition={{ repeat: Infinity, duration: 25, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[18rem] h-[18rem] md:w-[22rem] md:h-[22rem] bg-indigo-500 rounded-full opacity-20 blur-2xl"
        animate={{ x: [0, 80, -80, 0], y: [0, -80, 80, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
      />
       <motion.div
        className="absolute top-[-8rem] left-[-8rem] w-[25rem] h-[25rem] md:w-[30rem] md:h-[30rem] bg-purple-900 rounded-full opacity-40 blur-3xl"
        animate={{
          x: [0, 80, -80, 0],
          y: [0, 60, -60, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          repeat: Infinity,
          duration: 20,
          ease: "easeInOut",
        }}
      />

      {/* Blob 2 - top-right, moves right to left */}
      <motion.div
        className="absolute top-[-10rem] right-[-8rem] w-[22rem] h-[22rem] md:w-[26rem] md:h-[26rem] bg-purple-900 rounded-full opacity-40 blur-3xl"
        animate={{
          x: [0, -80, 80, 0],
          y: [0, -60, 60, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          repeat: Infinity,
          duration: 22,
          ease: "easeInOut",
        }}
      />

      {/* Blob 3 - center, pulsing glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[18rem] h-[18rem] md:w-[22rem] md:h-[22rem] bg-gray-800 rounded-full blur-2xl"
        animate={{
          opacity: [0.2, 0.6, 0.2],
          scale: [1, 1.1, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 16,
          ease: "easeInOut",
        }}
      />

      {/* Blob 4 - bottom-left */}
      <motion.div
        className="absolute bottom-[-10rem] left-[-10rem] w-[20rem] h-[20rem] md:w-[25rem] md:h-[25rem] bg-fuchsia-900 rounded-full opacity-40 blur-3xl"
        animate={{
          x: [0, 60, -60, 0],
          y: [0, -60, 60, 0],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          repeat: Infinity,
          duration: 26,
          ease: "easeInOut",
        }}
      />

      {/* Blob 5 - bottom-right */}
      <motion.div
        className="absolute bottom-[-8rem] right-[-8rem] w-[22rem] h-[22rem] md:w-[28rem] md:h-[28rem] bg-blue-900 rounded-full opacity-30 blur-3xl"
        animate={{
          x: [0, -100, 100, 0],
          y: [0, 80, -80, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          repeat: Infinity,
          duration: 24,
          ease: "easeInOut",
        }}
      />

      {/* Blob 6 - bottom-center */}
      <motion.div
        className="absolute bottom-[-6rem] left-1/2 transform -translate-x-1/2 w-[16rem] h-[16rem] md:w-[20rem] md:h-[20rem] bg-emerald-900 rounded-full opacity-20 blur-2xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          repeat: Infinity,
          duration: 18,
          ease: "easeInOut",
        }}
      />

      {/* Hero Content */}
      <motion.div
        className="z-10 text-center max-w-4xl w-full"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 text-transparent bg-clip-text mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          TaskAra – Organize Today. Conquer Tomorrow.
        </motion.h1>

        <motion.p
          className="text-gray-300 text-base sm:text-lg md:text-xl mb-8 px-2 sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
         The ultimate productivity companion to manage your tasks, boost your focus, and elevate your daily habits. Perfect for creators, teams, and anyone striving for personal growth.
        </motion.p>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
        >
         <Button
  className="px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg font-medium bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white shadow-xl hover:scale-105 transition-transform rounded-full cursor-pointer"
  onClick={handleStartJourney}
>
  Get Started with TaskAra
</Button>

        </motion.div>

        {/* Additional Highlights */}
        
      </motion.div>
    </section>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { showToast } from "@/utils/toastHelper";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        navigate("/dashboard");
      }
    }
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const userName = data.user?.user_metadata?.name || data.user?.email || "User";
      showToast("success", "Login successful", 2000, `Welcome to TaskAra, ${userName}`);
      navigate("/dashboard");
    } catch (error) {
      showToast(
        "error",
        "Login failed",
        2000,
        "Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      showToast("error", `Google Sign-In failed: ${error.message}`, 4000);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f0a23] to-[#000000] px-4">
      {/* Background blobs */}
      <motion.div
        className="absolute top-[-8rem] left-[-8rem] w-[25rem] h-[25rem] md:w-[30rem] md:h-[30rem] bg-purple-900 rounded-full opacity-40 blur-3xl"
        animate={{ x: [0, 80, -80, 0], y: [0, 60, -60, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[-10rem] right-[-8rem] w-[22rem] h-[22rem] md:w-[26rem] md:h-[26rem] bg-indigo-900 rounded-full opacity-40 blur-3xl"
        animate={{ x: [0, -80, 80, 0], y: [0, -60, 60, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ repeat: Infinity, duration: 22, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[18rem] h-[18rem] md:w-[22rem] md:h-[22rem] bg-gray-800 rounded-full blur-2xl"
        animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 16, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-10rem] left-[-10rem] w-[20rem] h-[20rem] md:w-[25rem] md:h-[25rem] bg-fuchsia-900 rounded-full opacity-40 blur-3xl"
        animate={{ x: [0, 60, -60, 0], y: [0, -60, 60, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ repeat: Infinity, duration: 26, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-8rem] right-[-8rem] w-[22rem] h-[22rem] md:w-[28rem] md:h-[28rem] bg-blue-900 rounded-full opacity-30 blur-3xl"
        animate={{ x: [0, -100, 100, 0], y: [0, 80, -80, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ repeat: Infinity, duration: 24, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-6rem] left-1/2 transform -translate-x-1/2 w-[16rem] h-[16rem] md:w-[20rem] md:h-[20rem] bg-emerald-900 rounded-full opacity-20 blur-2xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
      />

      {/* Form */}
      <form
        onSubmit={handleLogin}
        className="bg-white/10 backdrop-blur-md p-8 rounded-2xl w-full max-w-md space-y-6 border border-white/20 shadow-xl z-10"
      >
        <h2 className="text-3xl font-bold text-purple-400 text-center uppercase">Login</h2>

        <Input
          type="email"
          placeholder="Email"
          required
          className="text-white placeholder-white bg-white/10 border-white/20"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          type="password"
          placeholder="Password"
          required
          className="text-white placeholder-white bg-white/10 border-white/20"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          type="submit"
          className="w-full bg-gradient-to-r font-semibold text-[18px] from-purple-500 to-pink-500 hover:from-pink-600 hover:to-purple-600 text-white"
          disabled={loading}
        >
          {loading ? "Logging In..." : "Login"}
        </Button>

        <div className="text-center text-white text-sm opacity-80">or</div>

        <Button
          type="button"
          className="w-full bg-red-600 hover:bg-red-700 text-white"
          onClick={handleGoogleLogin}
        >
          Sign in with Google
        </Button>

        <p className="text-center text-white text-sm mt-2">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="underline text-pink-400 hover:text-pink-300 transition pl-1">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { showToast } from "@/utils/toastHelper";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

<<<<<<< HEAD
  // Redirect if user already logged in
  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) navigate("/dashboard");
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
=======
  // Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/dashboard");
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
>>>>>>> 4fce87d (Taskaraa App Updated)
      if (session) navigate("/dashboard");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

<<<<<<< HEAD
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          // You can add emailRedirectTo if you want email confirmation flow redirect
          // emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      });

      if (error) throw error;

      if (data.user) {
        // Save profile info in 'profiles' table
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: name,
        });

        if (profileError) {
          showToast("error", "Failed to save profile info", 2000, profileError.message);
        } else {
          showToast("success", "Signup successful", 2000, `Welcome to TaskAra, ${name || data.user.email}`);
          // If you want to auto-login after signup without email confirmation, 
          // you can do supabase.auth.signIn here. Otherwise, prompt email verification
        }
=======
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("user already registered")) {
        showToast("error", "User already exists", 2000, "Redirecting you to login...");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        showToast("error", "Signup failed", 2000, error.message);
      }
      return;
    }

    if (data.user) {
      // Insert profile info in 'profiles' table
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: name,
      });

      if (profileError) {
        showToast("error", "Profile save failed", 2000, profileError.message);
      } else {
        showToast("success", "Signup successful", 2000, `Welcome to TaskAra, ${name || data.user.email}`);
        // Usually wait for email confirmation before redirecting
>>>>>>> 4fce87d (Taskaraa App Updated)
      }
    } catch (error) {
      if (error.message.toLowerCase().includes("user already registered")) {
        showToast("error", "User already exists", 2000, "Redirecting to login...");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        showToast("error", "Signup failed", 2000, error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) showToast("error", "Google Sign-In failed", 4000, error.message);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f0a23] to-[#000000] px-4">
      <motion.div
        className="absolute top-[-8rem] left-[-8rem] w-[25rem] h-[25rem] md:w-[30rem] md:h-[30rem] bg-purple-900 rounded-full opacity-40 blur-3xl"
        animate={{ x: [0, 80, -80, 0], y: [0, 60, -60, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
      />
      <form
        onSubmit={handleSignup}
        className="bg-white/10 backdrop-blur-md p-8 rounded-2xl w-full max-w-md space-y-6 border border-white/20 shadow-xl z-10"
      >
        <h2 className="text-3xl font-bold text-purple-400 text-center">Join TaskAra</h2>

        <Input
          type="text"
          placeholder="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-white placeholder-white bg-white/10 border-white/20"
        />

        <Input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="text-white placeholder-white bg-white/10 border-white/20"
        />

        <Input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="text-white placeholder-white bg-white/10 border-white/20"
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-600 hover:to-purple-600 text-white text-[18px] font-semibold cursor-pointer"
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </Button>

        <div className="text-center text-white text-sm opacity-80">or</div>

        <Button
          type="button"
          onClick={signInWithGoogle}
          className="w-full bg-white text-black hover:bg-gray-200 cursor-pointer"
        >
          Sign in with Google
        </Button>

        <p className="text-center text-white text-sm mt-2">
          Already have an account?{" "}
          <a href="/login" className="underline text-pink-400 hover:text-pink-300 transition pl-1 cursor-pointer">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { showToast } from "@/utils/toastHelper";
import LoadingPage from "./LoadingPage";

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasHandledAuth = useRef(false);

  useEffect(() => {
    if (hasHandledAuth.current) return; // run only once
    hasHandledAuth.current = true;

    async function handleAuth() {
      try {
        const hash = window.location.hash;

        if (!hash) {
          // No OAuth tokens in URL, redirect to login
          navigate("/login");
          return;
        }

        // Parse URL hash params (after '#')
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const expires_in = params.get("expires_in");
        const token_type = params.get("token_type");

        if (!access_token || !refresh_token) {
          showToast("error", "Authentication tokens not found in URL", 3000);
          navigate("/login");
          return;
        }

        // Set session using Supabase client
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
          expires_in: expires_in ? Number(expires_in) : undefined,
          token_type,
        });

        if (error) {
          showToast("error", "Failed to set session", 3000, error.message);
          navigate("/login");
          return;
        }

        // Clear URL hash to avoid re-processing on reload
        window.history.replaceState(null, "", window.location.pathname + window.location.search);

        // Get current session info
        const sessionResponse = await supabase.auth.getSession();
        const session = sessionResponse.data.session;

        if (!session) {
          showToast("error", "Session not found after login", 3000);
          navigate("/login");
          return;
        }

        const user = session.user;
        // Show name if exists, otherwise show email
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || "User";

        showToast("success", "Login successful", 2000, `Welcome back, ${userName}`);

        // Navigate to dashboard SPA-style
        navigate("/dashboard");
      } catch (err) {
        showToast("error", "Unexpected error", 3000, err.message || String(err));
        navigate("/login");
      }
    }

    handleAuth();
  }, [navigate]);

  return <LoadingPage />;
}

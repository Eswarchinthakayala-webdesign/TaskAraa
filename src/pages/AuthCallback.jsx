import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { showToast } from "@/utils/toastHelper";
import LoadingPage from "./LoadingPage";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // Parse OAuth tokens from URL and set session
      const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });

      if (error) {
        showToast("error", "Authentication failed", 3000, error.message);
        navigate("/login");
        return;
      }

      if (data.session) {
        const userName = data.session.user.user_metadata?.name || data.session.user.email || "User";
        showToast("success", "Login successful", 2000, `Welcome back, ${userName}`);
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    };

    handleAuth();
  }, [navigate]);

  return <LoadingPage />;
}

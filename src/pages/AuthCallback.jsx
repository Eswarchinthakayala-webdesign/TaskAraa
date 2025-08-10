import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { showToast } from "@/utils/toastHelper";
import LoadingPage from "./LoadingPage";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleAuth() {
      try {
        // Extract session from URL fragment once and store in Supabase client
        const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });

        if (error) {
          showToast("error", "Authentication failed", 3000, error.message);
          navigate("/login");
          return;
        }

        if (data.session) {
          const userName = data.session.user.user_metadata?.name || data.session.user.email || "User";

          showToast("success", "Login successful", 2000, `Welcome back, ${userName}`);

          // Clear the URL hash to avoid re-parsing on reload or route change
          if (window.location.hash) {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          }

          // Navigate SPA style to dashboard
          navigate("/dashboard");
        } else {
          navigate("/login");
        }
      } catch (err) {
        showToast("error", "Unexpected error", 3000, err.message);
        navigate("/login");
      }
    }

    handleAuth();
  }, [navigate]);

  return <LoadingPage />;
}

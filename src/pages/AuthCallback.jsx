import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { showToast } from "@/utils/toastHelper";
import LoadingPage from "./LoadingPage";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        showToast("error", "Authentication failed", 3000, error.message);
        navigate("/login");
        return;
      }

      if (session) {
        const userName = session.user.user_metadata?.name || session.user.email || "User";
        showToast("success", "Login successful", 2000, `Welcome back, ${userName}`);
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    };

    checkSession();
  }, [navigate]);

  return <LoadingPage />;
}

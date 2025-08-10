// src/pages/AuthCallback.jsx
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import LoadingPage from "./LoadingPage";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthRedirect = async () => {
      const { error } = await supabase.auth.getSession();
      if (error) {
        alert("OAuth Login Failed");
      } else {
        navigate("/dashboard");
      }
    };

    handleOAuthRedirect();
  }, [navigate]);

  return <div className="text-white p-8">

    <LoadingPage/>
  </div>;
}

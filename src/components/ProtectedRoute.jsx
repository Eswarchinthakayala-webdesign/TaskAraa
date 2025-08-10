import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import LoadingPage from "@/pages/LoadingPage"; // Your loading spinner page

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <LoadingPage />;

  if (!user) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function useQuizHistory() {
  const [history, setHistory] = useState([]);

  // Fetch quiz history for the logged-in user
  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("quiz_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching quiz history:", error);
    } else {
      setHistory(data || []);
    }
  };

  // Add quiz attempt to state (no need to re-fetch every time)
  const addQuizAttempt = (attempt) => {
    setHistory((prev) => [attempt, ...prev]);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return { history, addQuizAttempt, fetchHistory };
}

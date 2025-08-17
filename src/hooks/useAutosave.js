// src/hooks/useAutoSave.js
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function useAutoSave(resume, resumeId, userId, onSaved) {
  const timer = useRef(null);
  const last = useRef(null);
  const DELAY = 1200; // ms

  useEffect(() => {
    if (!resume || !userId) return;

    // avoid saving if nothing changed since last save
    if (JSON.stringify(last.current) === JSON.stringify(resume)) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        // always write to localStorage backup
        try {
          localStorage.setItem(`resume_backup_${resumeId || "draft"}`, JSON.stringify(resume));
        } catch (e) {}

        if (navigator.onLine) {
          if (resumeId) {
            const { error } = await supabase
              .from("resumes")
              .update({ title: resume.meta?.title || resume.title || "Untitled", doc: resume })
              .eq("id", resumeId)
              .eq("user_id", userId);
            if (error) throw error;
            onSaved?.(resumeId);
          } else {
            const { data, error } = await supabase
              .from("resumes")
              .insert([{ user_id: userId, title: resume.meta?.title || resume.title || "Untitled", doc: resume }])
              .select("id")
              .single();
            if (error) throw error;
            onSaved?.(data?.id);
          }
        } else {
          // offline: keep local only
          console.warn("Offline — saved locally");
        }
        last.current = resume;
      } catch (err) {
        console.error("AutoSave error", err);
      }
    }, DELAY);

    return () => clearTimeout(timer.current);
  }, [resume, resumeId, userId, onSaved]);
}

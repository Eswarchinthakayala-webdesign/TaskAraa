// pages/RecurringTasksPage.jsx
"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { expandTaskOccurrences } from "@/utils/recurring";
import TaskListSections from "@/components/TaskListSections";
import Sidebar from "@/components/Sidebar";
import { isBefore, isSameDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eraser,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  RefreshCw,
  Slash,
  Edit3,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

/* ---------------------------------------------------------
   Small local UI utilities (Toast + lightweight confetti)
   --------------------------------------------------------- */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const push = (message, opts = {}) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, ...opts }]);
    const duration = opts.duration ?? 3000;
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, duration);
  };
  return { toasts, push };
}

function Toasts({ toasts }) {
  return (
    <div className="fixed right-6 bottom-6 z-60 flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6 }}
            className="bg-[#0b0b14] border border-[rgba(255,255,255,0.04)] text-sm text-gray-200 rounded-md shadow-lg px-4 py-2"
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* Minimal confetti effect (CSS + small DOM nodes) */
function TinyConfetti({ trigger }) {
  // trigger toggles, we render short lifetime confetti pieces
  const [bursts, setBursts] = useState(0);
  useEffect(() => {
    if (trigger) setBursts((b) => b + 1);
  }, [trigger]);
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <AnimatePresence>
        {Array.from({ length: bursts }).map((_, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
          >
            {Array.from({ length: 18 }).map((__, i) => {
              const left = Math.random() * 100;
              const delay = Math.random() * 0.3;
              const rotate = Math.random() * 360;
              const size = 6 + Math.random() * 8;
              const bg = ["#7c3aed", "#a78bfa", "#fb7185", "#60a5fa", "#34d399"][
                Math.floor(Math.random() * 5)
              ];
              return (
                <motion.span
                  key={i}
                  initial={{ y: -10, opacity: 1, scale: 1 }}
                  animate={{ y: 120 + Math.random() * 220, opacity: 0, rotate }}
                  transition={{ duration: 1 + Math.random() * 0.8, delay }}
                  style={{
                    left: `${left}%`,
                    width: size,
                    height: size,
                    background: bg,
                    borderRadius: 2,
                    position: "absolute",
                    top: "10%",
                    transformOrigin: "center",
                  }}
                />
              );
            })}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ---------------------------------------------------------
   Hook: useRecurringTasks
   - preserves the exact expansion logic you had but isolates
     fetching/expansion into a reusable hook.
   --------------------------------------------------------- */
function useRecurringTasks(year, month) {
  const [loading, setLoading] = useState(true);
  const [rawTasks, setRawTasks] = useState([]);
  const [occurrences, setOccurrences] = useState([]);

  const normalizeDate = useCallback((d) => {
    const dt = d ? new Date(d) : null;
    return dt ? new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()) : null;
  }, []);

  const fetchAndExpand = useCallback(async () => {
    setLoading(true);

    const windowStart = new Date(year, month, 1);
    const windowEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const { data, error } = await supabase.from("tasks").select("*");

    if (error) {
      console.error("Error fetching tasks:", error);
      setLoading(false);
      return;
    }

    const tasks = data || [];
    setRawTasks(tasks);

    const expanded = [];
    for (const task of tasks) {
      // pass window to the recurrence util so it only expands what's needed
      const occDates = expandTaskOccurrences(task, windowStart, windowEnd);

      occDates.forEach((d) => {
        // normalize occurrence date to midnight for consistent comparisons
        const occNorm = normalizeDate(new Date(d));
        let status = task.status || "pending";

        // Mark overdue based on task's due_date / due_time if needed
        if (task.due_date) {
          const dueDateTime = task.due_time
            ? new Date(`${task.due_date}T${task.due_time}`)
            : new Date(`${task.due_date}T23:59:59`);
          if (isBefore(dueDateTime, new Date()) && task.status !== "complete") {
            status = "overdue";
          }
        }

        expanded.push({
          ...task,
          occurrenceDate: occNorm,
          date: occNorm,
          status,
          occurrenceKey: `${task.id}-${occNorm.toISOString().slice(0, 10)}`,
        });
      });
    }

    // Sort by date ascending
    expanded.sort((a, b) => a.occurrenceDate - b.occurrenceDate);

    setOccurrences(expanded);
    setLoading(false);
  }, [year, month, normalizeDate]);

  useEffect(() => {
    fetchAndExpand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAndExpand]);

  return { loading, rawTasks, occurrences, refetch: fetchAndExpand };
}

/* ---------------------------------------------------------
   Main Page Component - upgraded UI & interactions
   --------------------------------------------------------- */
export default function RecurringTasksPage() {
  // Keep original default date behavior
  const now = new Date();

  // Calendar controls (same defaults)
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(null); // null => month view

  // UI Filters
  const [statusFilter, setStatusFilter] = useState("all"); // all | pending | complete | overdue | ongoing

  // Inline editing / quick action states
  const [editingOccurrence, setEditingOccurrence] = useState(null);
  const [completionBurst, setCompletionBurst] = useState(false);

  const { loading, rawTasks, occurrences, refetch } = useRecurringTasks(year, month);

  const toastApi = useToast();

  // normalize a Date to YYYY-MM-DD (time 00:00:00)
  const normalizeDate = (d) => {
    const dt = d ? new Date(d) : null;
    return dt ? new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()) : null;
  };

  // map occurrences to calendar-friendly objects (for badges/previews)
  const occurrencesForCalendar = useMemo(() => {
    return occurrences
      .filter((o) => o.occurrenceDate.getFullYear() === year && o.occurrenceDate.getMonth() === month)
      .map((o) => ({
        date: o.occurrenceDate,
        status: o.status,
        title: o.title || o.name || "Untitled",
        description: o.description || "",
        id: o.id,
      }));
  }, [occurrences, year, month]);

  // Tasks to show on right panel (selected date or whole month), filtered by status
  const displayedTasks = useMemo(() => {
    let list = [];
    if (selectedDate) {
      const sel = normalizeDate(selectedDate);
      list = occurrences.filter((o) => isSameDay(new Date(o.occurrenceDate), sel));
    } else {
      list = occurrences.filter((o) => o.occurrenceDate.getFullYear() === year && o.occurrenceDate.getMonth() === month);
    }

    if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }

    return list;
  }, [occurrences, selectedDate, year, month, statusFilter]);

  // When clicking a date: toggle selection (click again clears)
  const handleDateClick = (date) => {
    const norm = normalizeDate(date);
    if (selectedDate && isSameDay(norm, normalizeDate(selectedDate))) {
      setSelectedDate(null);
    } else {
      setSelectedDate(norm);
    }
  };

  // go to today
  const goToToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
    setSelectedDate(normalizeDate(t));
  };

  // Month navigation helpers
  const prevMonth = () => {
    const d = new Date(year, month - 1, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelectedDate(null);
  };
  const nextMonth = () => {
    const d = new Date(year, month + 1, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelectedDate(null);
  };

  const monthNames = [
    "January","February","March","April","May","June","July","August","September","October","November","December"
  ];

  // Inline action: toggle status (complete <-> pending)
  const toggleComplete = async (occ) => {
    // find task id in raw tasks
    const task = rawTasks.find((t) => t.id === occ.id);
    if (!task) {
      toastApi.push("Task not found.");
      return;
    }
    // toggle in DB: here we only flip status field for the base task (this preserves recurring pattern)
    const newStatus = task.status === "complete" ? "pending" : "complete";

    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);

    if (error) {
      console.error("Error updating task status", error);
      toastApi.push("Failed to update status.");
      return;
    }

    toastApi.push(newStatus === "complete" ? "Task marked complete 🎉" : "Task marked pending");
    setCompletionBurst(true);
    setTimeout(() => setCompletionBurst(false), 1400);

    // local re-fetch (keeps behavior identical to before)
    refetch();
  };

  // Inline action: quick postpone (add one day to due_date if exists)
  const quickPostpone = async (occ) => {
    const task = rawTasks.find((t) => t.id === occ.id);
    if (!task) {
      toastApi.push("Task not found.");
      return;
    }
    let newDue = null;
    if (task.due_date) {
      const dt = new Date(task.due_date);
      dt.setDate(dt.getDate() + 1);
      newDue = dt.toISOString().slice(0, 10);
    } else {
      // if no due date, set to occurrence +1
      const dt = new Date(occ.occurrenceDate || occ.date);
      dt.setDate(dt.getDate() + 1);
      newDue = dt.toISOString().slice(0, 10);
    }

    const { error } = await supabase.from("tasks").update({ due_date: newDue }).eq("id", task.id);

    if (error) {
      console.error("Error postponing task", error);
      toastApi.push("Failed to postpone.");
      return;
    }

    toastApi.push("Postponed by 1 day.");
    refetch();
  };

  // Inline edit (simple inline rename + description)
  const saveInlineEdit = async (occurrenceKey, updates) => {
    const occ = occurrences.find((o) => o.occurrenceKey === occurrenceKey);
    if (!occ) {
      toastApi.push("Occurrence not found.");
      return;
    }
    const { id } = occ;
    const payload = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;

    const { error } = await supabase.from("tasks").update(payload).eq("id", id);
    if (error) {
      console.error("Error saving task edit", error);
      toastApi.push("Failed to save changes.");
      return;
    }
    toastApi.push("Saved changes.");
    setEditingOccurrence(null);
    refetch();
  };

  // small keyboard navigation: left/right to prev/next month
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prevMonth();
      if (e.key === "ArrowRight") nextMonth();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  // Analytics: month completion %
  const monthCompletionPct = useMemo(() => {
    const monthOcc = occurrences.filter((o) => o.occurrenceDate.getFullYear() === year && o.occurrenceDate.getMonth() === month);
    if (monthOcc.length === 0) return 0;
    const done = monthOcc.filter((o) => o.status === "complete").length;
    return Math.round((done / monthOcc.length) * 100);
  }, [occurrences, year, month]);
  const navigate=useNavigate()
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060617] via-[#070720] to-[#0a0a13] text-white px-4 pt-28 pb-10 lg:px-12 flex overflow-x-hidden gap-6">
      <Sidebar />

      <main className="max-w-7xl mx-auto space-y-8 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400">
              Calendar & Recurring Tasks
            </h1>
            <p className="text-gray-400 mt-1">Pick a month or click a day to view tasks. Hover for quick previews and use keyboard ← → for navigation.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0f1020] border border-purple-700 rounded-md p-2">
              <button onClick={prevMonth} className="p-1 rounded hover:bg-[rgba(255,255,255,0.02)]" aria-label="Previous month">
                <ChevronLeft size={18} />
              </button>

              <div className="px-3 py-1 text-sm">
                <div className="font-semibold">{monthNames[month]}</div>
                <div className="text-xs text-gray-400">{year}</div>
              </div>

              <button onClick={nextMonth} className="p-1 rounded hover:bg-[rgba(255,255,255,0.02)]" aria-label="Next month">
                <ChevronRight size={18} />
              </button>
            </div>

            <Button onClick={() => setSelectedDate(null)} className="bg-transparent border border-[rgba(255,255,255,0.04)]" title="Clear selection">
              <Eraser size={16} />
            </Button>

            <Button onClick={goToToday} className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-95" title="Jump to Today">
              <CalendarIcon size={16} />
              <span className="ml-2 hidden sm:inline">Today</span>
            </Button>
          </div>
        </div>

        {/* Filters + Analytics */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="text-sm text-gray-300">Status:</div>
          {["all","pending","complete","overdue","ongoing"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition
                ${statusFilter === s ? "bg-purple-700 text-white shadow-md" : "bg-[rgba(255,255,255,0.03)] text-gray-300 hover:bg-[rgba(255,255,255,0.04)]"}`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm text-gray-400">{displayedTasks.length} occurrence(s)</div>

            <div className="flex items-center gap-2 bg-[#071029] border border-[rgba(255,255,255,0.03)] rounded-md px-3 py-1">
              <div className="text-xs text-gray-300">Month completion</div>
              <div className="font-semibold ml-2">{monthCompletionPct}%</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[rgba(255,255,255,0.02)] border border-purple-700 rounded-2xl p-6 shadow-lg relative overflow-hidden"
          >
            {/* soft animated gradient overlay for futuristic vibe */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="absolute left-[-20%] top-[-10%] w-[420px] h-[420px] rounded-full bg-gradient-to-br from-purple-700/12 to-indigo-400/6 blur-3xl transform -rotate-12" />
            </motion.div>

            <CalendarViewStyled
              year={year}
              month={month}
              occurrences={occurrencesForCalendar}
              onDateClick={handleDateClick}
              selectedDate={selectedDate}
            />
          </motion.div>

          {/* Tasks list */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-[rgba(255,255,255,0.02)] border border-purple-700 rounded-2xl p-6 shadow-lg max-h-[72vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-700 relative"
          >
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-clip-padding backdrop-blur-sm pt-6 -mt-6">
              <h2 className="text-2xl font-semibold">
                {selectedDate
                  ? `Tasks on ${selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`
                  : `Tasks in ${monthNames[month]} ${year}`}
              </h2>

              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm">{displayedTasks.length} occurrence(s)</span>
                <button
                  onClick={() => refetch()}
                  className="p-2 rounded-md hover:bg-[rgba(255,255,255,0.02)]"
                  title="Refresh"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-3 text-gray-400">
                <div>Loading tasks…</div>
                <div className="w-32 h-3 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 rounded animate-pulse" />
              </div>
            ) : (
              <div className="grid gap-3">
                {/* New interactive grouped sections (lightweight) */}
                <div className="space-y-3">
                  {["overdue", "pending", "ongoing", "complete"].map((group) => {
                    const groupTasks = displayedTasks.filter((t) => t.status === group);
                    if (statusFilter !== "all" && statusFilter !== group) {
                      // if a single filter is selected, skip groups that aren't it
                      if (statusFilter !== "all") return null;
                    }
                    if (groupTasks.length === 0) return null;

                    return (
                      <div key={group} className="bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.02)] rounded-md p-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`px-2 py-1 rounded-full text-xs font-semibold
                              ${group === "complete" ? "bg-green-700/20 text-green-300" :
                                group === "overdue" ? "bg-red-700/20 text-red-300" :
                                group === "ongoing" ? "bg-blue-700/20 text-blue-300" :
                                "bg-yellow-700/20 text-yellow-300"}`}>
                              {group.toUpperCase()}
                            </div>
                            <div className="text-sm text-gray-300">{groupTasks.length} occurrence(s)</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {groupTasks.map((taskOcc) => (
                            <motion.div
                              key={taskOcc.occurrenceKey}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ scale: 1.01 }}
                              className="flex items-start justify-between gap-4 p-3 rounded-md bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.015)]"
                            >
                              <div className="flex items-start gap-3 w-full">
                                {/* status dot */}
                                <div className="mt-1">
                                  <span
                                    className={`inline-block w-3 h-3 rounded-full mr-2
                                      ${taskOcc.status === "pending" ? "bg-yellow-400" : taskOcc.status === "complete" ? "bg-green-400" : taskOcc.status === "overdue" ? "bg-red-500" : "bg-blue-400"}`}
                                  />
                                </div>

                                <div className="flex-1" 
                                onClick={()=>navigate(`/tasks/${taskOcc.id}`)}>
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <div className="font-medium">
                                        {taskOcc.title || taskOcc.name || "Untitled"}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {taskOcc.description ? `${String(taskOcc.description).slice(0, 120)}${String(taskOcc.description).length > 120 ? "…" : ""}` : <span className="text-gray-600 italic">No description</span>}
                                      </div>
                                    </div>

                                    <div className="text-right text-xs text-gray-400">
                                      <div>{taskOcc.occurrenceDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                                      <div className="mt-1">{taskOcc.due_time ? taskOcc.due_time : ""}</div>
                                    </div>
                                  </div>

                                  {/* inline editing area */}
                                  {editingOccurrence === taskOcc.occurrenceKey ? (
                                    <InlineEditor
                                      occurrence={taskOcc}
                                      onCancel={() => setEditingOccurrence(null)}
                                      onSave={(u) => saveInlineEdit(taskOcc.occurrenceKey, u)}
                                    />
                                  ) : null}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleComplete(taskOcc)}
                                  className="p-2 rounded-md cursor-pointer hover:bg-[rgba(255,255,255,0.02)]"
                                  title={taskOcc.status === "complete" ? "Mark pending" : "Mark complete"}
                                >
                                  <Check size={16} />
                                </button>

                                <button
                                  onClick={() => quickPostpone(taskOcc)}
                                  className="p-2 rounded-md cursor-pointer hover:bg-[rgba(255,255,255,0.02)]"
                                  title="Postpone 1 day"
                                >
                                  <ChevronRight size={16} />
                                </button>

                                <button
                                  onClick={() => setEditingOccurrence(taskOcc.occurrenceKey)}
                                  className="p-2 rounded-md hover:bg-[rgba(255,255,255,0.02)] text-yellow-400 cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit3 size={16} />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Fallback */}
                {displayedTasks.length === 0 && (
                  <div className="p-6 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)] rounded-md text-gray-400">
                    {selectedDate ? "No tasks on this date." : "No tasks in this month for the applied filter."}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* UI overlays */}
      <Toasts toasts={toastApi.toasts} />
      <TinyConfetti trigger={completionBurst} />
      <ConfettiPlaceholderInvisible />

    </div>
  );
}

/* ---------------------------------------------------------
   Inline editor component (kept lightweight)
   --------------------------------------------------------- */
function InlineEditor({ occurrence, onCancel, onSave }) {
  const [title, setTitle] = useState(occurrence.title || occurrence.name || "");
  const [description, setDescription] = useState(occurrence.description || "");

  return (
    <div className="mt-3 bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.02)] rounded-md p-3">
      <div className="flex flex-col gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent border-b border-[rgba(255,255,255,0.03)] pb-1 text-sm outline-none"
          placeholder="Title"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-transparent text-xs outline-none resize-none"
          rows={2}
          placeholder="Description"
        />
        <div className="flex items-center gap-2 mt-2">
          <Button
            onClick={() => onSave({ title, description })}
            className="px-3 cursor-pointer py-1 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 text-xs"
          >
            Save
          </Button>
          <Button onClick={onCancel} className="px-3 cursor-pointer py-1 rounded-md hover:bg-red-500 bg-[rgba(255,255,255,0.02)] text-xs">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   CalendarViewStyled
   - mostly the same as your original CalendarViewStyled,
     but with added animations, better hover preview and
     a small 'heat' visualization for days with many items.
   --------------------------------------------------------- */
function CalendarViewStyled({ year, month, occurrences, onDateClick, selectedDate }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Render blanks with min height to keep grid rows aligned
  const blanks = Array.from({ length: firstDayIndex }, (_, i) => (
    <div key={"b" + i} className="min-h-[72px]" />
  ));

  const today = new Date();

  // Build map date->occurrences
  const dateMap = {};
  (occurrences || []).forEach((o) => {
    const key = o.date.toISOString().slice(0, 10);
    if (!dateMap[key]) dateMap[key] = [];
    dateMap[key].push(o);
  });

  function isSameDaySimple(d1, d2) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  const dayCells = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const key = d.toISOString().slice(0, 10);
    const items = dateMap[key] || [];

    const isSelected = selectedDate && isSameDaySimple(d, selectedDate);
    const isToday = isSameDaySimple(d, today);

    // compute "heat" intensity (for background glow)
    const intensity = Math.min(items.length / 6, 1); // normalize

    // Selected style takes precedence; today shows ring when not selected
    const baseBtnClasses = [
      "w-full h-full text-left p-3 rounded-md transition",
      "min-h-[72px] flex flex-col",
      isSelected ? "bg-gradient-to-br from-purple-700 to-indigo-700 text-white shadow-lg" : "hover:bg-[rgba(255,255,255,0.02)] text-gray-200",
      isToday && !isSelected ? "ring-2 ring-purple-600" : "",
      "relative z-10",
    ].filter(Boolean).join(" ");

    dayCells.push(
      <div key={`day-${year}-${month}-${day}`} className="relative group">
        <motion.button
          onClick={() => onDateClick(d)}
          type="button"
          aria-label={`Day ${day}, ${items.length} task(s)`}
          aria-pressed={isSelected ? "true" : "false"}
          className={baseBtnClasses}
          whileHover={isSelected ? {} : { scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-start cursor-pointer justify-between">
            <span className={`text-sm font-semibold ${isSelected ? "text-white" : ""}`}>{day}</span>
            {items.length > 0 && <span className="text-xs text-gray-300 font-semibold">{items.length}</span>}
          </div>

          <div className="flex items-center mt-3 space-x-1">
            {items.slice(0, 3).map((it, i) => {
              let dot = "bg-gray-500";
              if (it.status === "pending") dot = "bg-yellow-400";
              else if (it.status === "complete") dot = "bg-green-400";
              else if (it.status === "overdue") dot = "bg-red-500";
              else if (it.status === "ongoing") dot = "bg-blue-400";
              return (
                <motion.span
                  key={i}
                  className={`${dot} w-2 h-2 rounded-full`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                  title={it.title || "Task"}
                />
              );
            })}
            {items.length > 3 && <span className="text-[11px] text-gray-400">+{items.length - 3}</span>}
          </div>

          {/* heat bar */}
          {items.length > 0 && (
            <div className="mt-2 h-1 w-full rounded-full bg-[rgba(255,255,255,0.02)] overflow-hidden">
              <div style={{ width: `${Math.round(intensity * 100)}%` }} className="h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-500" />
            </div>
          )}
        </motion.button>

        {/* Hover preview popover (non-interactive so it cannot block clicks) */}
        {items.length > 0 && (
          <div
            className="absolute left-1/2 transform -translate-x-1/2 -translate-y-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0"
            aria-hidden="true"
          >
            <div className="w-72 bg-[#0b0b14] border border-[rgba(255,255,255,0.04)] rounded-md p-3 text-sm shadow-lg pointer-events-none">
              <div className="font-semibold mb-1">Tasks</div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="mt-0.5">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2
                          ${it.status === "pending" ? "bg-yellow-400" : it.status === "complete" ? "bg-green-400" : it.status === "overdue" ? "bg-red-500" : "bg-gray-500"}`}
                      />
                    </div>
                    <div>
                      <div className="font-medium">{it.title || it.name || "Untitled"}</div>
                      <div className="text-xs text-gray-400">
                        {it.description ? `${String(it.description).slice(0, 80)}${String(it.description).length > 80 ? "…" : ""}` : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-4 text-xs text-gray-400 select-none">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((wd) => (
          <div key={wd} className="text-center font-semibold py-1">{wd}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {blanks}
        {dayCells}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Placeholder to keep DOM stable with tiny invisibles used
   by overlays: avoids focus/layout jumps
   --------------------------------------------------------- */
function ConfettiPlaceholderInvisible() {
  return <div aria-hidden className="sr-only" />;
}

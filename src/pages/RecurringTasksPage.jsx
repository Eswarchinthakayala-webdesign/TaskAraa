// pages/RecurringTasksPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { expandTaskOccurrences } from "@/utils/recurring";
import TaskListSections from "@/components/TaskListSections";
import Sidebar from "@/components/Sidebar";
import { isBefore, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { Eraser, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * RecurringTasksPage
 * - Fetches all tasks from Supabase
 * - Expands occurrences for visible month using expandTaskOccurrences(task, windowStart, windowEnd)
 * - Modern dashboard UI with filters, tooltips, and Today button
 */

export default function RecurringTasksPage() {
  const now = new Date();

  const [loading, setLoading] = useState(true);
  const [rawTasks, setRawTasks] = useState([]);
  const [occurrences, setOccurrences] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  // Calendar controls
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  // UI Filters
  const [statusFilter, setStatusFilter] = useState("all"); // all | pending | complete | overdue | ongoing

  useEffect(() => {
    fetchAndExpand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  // Fetch tasks from Supabase (no date filters) and expand occurrences for visible month
  const fetchAndExpand = async () => {
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
      const occDates = expandTaskOccurrences(task, windowStart, windowEnd);
      occDates.forEach((d) => {
        const occ = new Date(d);
        let status = task.status || "pending";

        // If task has a due_date, mark as overdue if applicable
        if (task.due_date) {
          const dueDateTime = task.due_time ? new Date(`${task.due_date}T${task.due_time}`) : new Date(`${task.due_date}T23:59:59`);
          if (isBefore(dueDateTime, new Date()) && task.status !== "complete") {
            status = "overdue";
          }
        }

        expanded.push({
          ...task,
          occurrenceDate: occ,
          date: occ,
          status,
          occurrenceKey: `${task.id}-${occ.toISOString().slice(0, 10)}`,
        });
      });
    }

    // Sort occurrences chronologically
    expanded.sort((a, b) => a.occurrenceDate - b.occurrenceDate);

    setOccurrences(expanded);
    setLoading(false);
  };

  // Occurrences mapped for calendar (only visible month)
  const occurrencesForCalendar = useMemo(() => {
    return occurrences
      .filter((o) => o.occurrenceDate.getFullYear() === year && o.occurrenceDate.getMonth() === month)
      .map((o) => ({ date: o.occurrenceDate, status: o.status, title: o.title || o.name || "Untitled" }));
  }, [occurrences, year, month]);

  // Tasks to show in right panel (selected date or whole month), with status filter
  const displayedTasks = useMemo(() => {
    let list = [];
    if (selectedDate) {
      list = occurrences.filter((o) => isSameDay(new Date(o.occurrenceDate), selectedDate));
    } else {
      list = occurrences.filter((o) => o.occurrenceDate.getFullYear() === year && o.occurrenceDate.getMonth() === month);
    }

    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);

    return list;
  }, [occurrences, selectedDate, year, month, statusFilter]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const goToToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
    setSelectedDate(t);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060617] via-[#070720] to-[#0a0a13] text-white px-4 py-8 lg:px-12 lg:py-10 flex gap-6">
      <Sidebar />

      <main className="flex-1 max-w-7xl mx-auto space-y-8 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400">
              Calendar & Recurring Tasks
            </h1>
            <p className="text-gray-400 mt-1">Pick a month or click a day to view tasks. Hover for task previews.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0f1020] border border-purple-700 rounded-md p-2">
              <button onClick={prevMonth} className="p-1 rounded hover:bg-[rgba(255,255,255,0.02)]">
                <ChevronLeft size={18} />
              </button>

              <div className="px-3 py-1 text-sm">
                <div className="font-semibold">{monthNames[month]}</div>
                <div className="text-xs text-gray-400">{year}</div>
              </div>

              <button onClick={nextMonth} className="p-1 rounded hover:bg-[rgba(255,255,255,0.02)]">
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

        {/* Filters */}
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

          <div className="ml-auto text-sm text-gray-400">{displayedTasks.length} occurrence(s)</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-[rgba(255,255,255,0.02)] border border-purple-700 rounded-2xl p-6 shadow-lg">
            <CalendarViewStyled
              year={year}
              month={month}
              occurrences={occurrencesForCalendar}
              onDateClick={handleDateClick}
              selectedDate={selectedDate}
            />
          </motion.div>

          {/* Tasks list */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-[rgba(255,255,255,0.02)] border border-purple-700 rounded-2xl p-6 shadow-lg max-h-[72vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">
                {selectedDate ? `Tasks on ${selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}` : `Tasks in ${monthNames[month]} ${year}`}
              </h2>

              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm">{displayedTasks.length} occurrence(s)</span>
              </div>
            </div>

            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-3 text-gray-400">
                <div>Loading tasks…</div>
                <div className="w-32 h-3 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 rounded animate-pulse" />
              </div>
            ) : (
              <div className="grid gap-3">
                <TaskListSections tasks={displayedTasks} />
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

/* -------------------------
   CalendarViewStyled
   Renders the month grid, color-coded dots, and simple hover preview tooltip
   ------------------------- */
function CalendarViewStyled({ year, month, occurrences, onDateClick, selectedDate }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const blanks = Array.from({ length: firstDayIndex }, (_, i) => <div key={"b" + i} />);
  const today = new Date();

  // Build map date->occurrences
  const dateMap = {};
  occurrences.forEach((o) => {
    const key = o.date.toISOString().slice(0, 10);
    if (!dateMap[key]) dateMap[key] = [];
    dateMap[key].push(o);
  });

  function isSameDaySimple(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  }

  const dayCells = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const key = d.toISOString().slice(0, 10);
    const items = dateMap[key] || [];

    const isSelected = selectedDate && isSameDaySimple(d, selectedDate);
    const isToday = isSameDaySimple(d, today);

    dayCells.push(
      <div key={day} className="relative group">
        <button
          onClick={() => onDateClick(d)}
          type="button"
          aria-label={`Day ${day}, ${items.length} task(s)`}
          className={`w-full h-full text-left p-3 rounded-md transition
            ${isSelected ? "bg-gradient-to-br from-purple-700 to-indigo-700 text-white shadow-lg" : "hover:bg-[rgba(255,255,255,0.02)] text-gray-200"}
            ${isToday ? "ring-2 ring-purple-600" : ""}
            min-h-[72px] flex flex-col`}
        >
          <div className="flex items-start justify-between">
            <span className="text-sm font-semibold">{day}</span>
            {items.length > 0 && <span className="text-xs text-gray-300 font-semibold">{items.length}</span>}
          </div>

          <div className="flex items-center mt-3 space-x-1">
            {items.slice(0, 3).map((it, i) => {
              let dot = "bg-gray-500";
              if (it.status === "pending") dot = "bg-yellow-400";
              else if (it.status === "complete") dot = "bg-green-400";
              else if (it.status === "overdue") dot = "bg-red-500";
              else if (it.status === "ongoing") dot = "bg-blue-400";
              return <span key={i} className={`${dot} w-2 h-2 rounded-full`} title={it.title || "Task"} />;
            })}
            {items.length > 3 && <span className="text-[11px] text-gray-400">+{items.length - 3}</span>}
          </div>
        </button>

        {/* Hover preview popover */}
        {items.length > 0 && (
          <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="w-64 bg-[#0b0b14] border border-[rgba(255,255,255,0.04)] rounded-md p-3 text-sm shadow-lg pointer-events-auto">
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
                      <div className="text-xs text-gray-400">{it.description ? `${String(it.description).slice(0, 80)}${String(it.description).length > 80 ? "…" : ""}` : null}</div>
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

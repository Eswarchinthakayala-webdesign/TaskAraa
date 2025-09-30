import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { expandTaskOccurrences } from "@/utils/recurring";
import TaskListSections from "@/components/TaskListSections";
import Sidebar from "../components/Sidebar";
import { isBefore, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RecurringTasksPage() {
  const [loading, setLoading] = useState(true);
  const [rawTasks, setRawTasks] = useState([]);
  const [occurrences, setOccurrences] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  // For calendar controls
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  useEffect(() => {
    fetchAndExpand();
  }, [year, month]); // refetch on year/month change

  const fetchAndExpand = async () => {
    setLoading(true);

    const startOfMonthStr = new Date(year, month, 1).toISOString().slice(0, 10);
    const endOfMonthStr = new Date(year, month + 1, 0).toISOString().slice(0, 10);

    // ✅ FIX: Remove overly strict filters so recurring tasks aren't excluded.
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .lte("start_date", endOfMonthStr); // optional filter: tasks that started before this month ends

    if (error) {
      console.error("Error fetching tasks:", error);
      setLoading(false);
      return;
    }

    setRawTasks(data || []);

    // Expand recurring occurrences
    const expanded = [];
    (data || []).forEach((task) => {
      const occDates = expandTaskOccurrences(task);

      occDates.forEach((d) => {
        let occ = new Date(d);
        let status = task.status || "pending";

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
          occurrenceDate: occ,
          date: occ,
          status,
          occurrenceKey: `${task.id}-${occ.toISOString().slice(0, 10)}`,
        });
      });
    });

    setOccurrences(expanded);
    setLoading(false);
  };

  // Filter occurrences for calendar display by selected month/year
  const occurrencesForCalendar = useMemo(() => {
    return occurrences
      .filter(
        (o) =>
          o.occurrenceDate.getFullYear() === year &&
          o.occurrenceDate.getMonth() === month
      )
      .map((o) => ({
        date: o.occurrenceDate,
        status: o.status,
      }));
  }, [occurrences, year, month]);

  // Filter tasks shown for selected date or all in selected month
  const displayedTasks = useMemo(() => {
    if (selectedDate) {
      return occurrences.filter((o) =>
        isSameDay(new Date(o.occurrenceDate), selectedDate)
      );
    }
    return occurrences.filter(
      (o) =>
        o.occurrenceDate.getFullYear() === year &&
        o.occurrenceDate.getMonth() === month
    );
  }, [occurrences, selectedDate, year, month]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  // Generate year options for dropdown (e.g., current year +/- 5)
  const yearOptions = [];
  for (let y = now.getFullYear() - 5; y <= now.getFullYear() + 5; y++) {
    yearOptions.push(y);
  }

  return (
    <div className="min-h-screen bg-[#070720] text-white px-4 pt-20 pb-12 sm:px-6 lg:px-12 flex flex-col lg:flex-row gap-6">
      <Sidebar />

      <main className="flex-grow max-w-7xl mx-auto space-y-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
            Calendar & Recurring Tasks
          </h1>
          <p className="text-gray-400 text-sm max-w-md">
            Select month/year and click a day on the calendar to view tasks.
          </p>
        </div>

        {/* Month/Year selectors */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <select
            className="bg-[#1b1b2f] border border-purple-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
          >
            {[
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ].map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>

          <select
            className="bg-[#1b1b2f] border border-purple-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <Button
            onClick={() => setSelectedDate(null)}
            className="ml-auto cursor-pointer bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md font-semibold transition"
            title="Clear Selection"
          >
            <Eraser size={20} />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar panel */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1b1b2f] rounded-2xl border border-purple-600 p-6 shadow-lg"
          >
            <CalendarViewStyled
              year={year}
              month={month}
              occurrences={occurrencesForCalendar}
              onDateClick={handleDateClick}
              selectedDate={selectedDate}
            />
          </motion.div>

          {/* Task list panel */}
          <div className="lg:col-span-2 bg-[#1b1b2f] rounded-2xl border border-purple-600 p-6 shadow-lg max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-700 custom-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-white">
                {selectedDate
                  ? `Tasks on ${selectedDate.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}`
                  : `Tasks in ${
                      [
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ][month]
                    } ${year}`}
              </h2>
              <span className="text-gray-400 text-sm">
                {displayedTasks.length} occurrence(s)
              </span>
            </div>

            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-3 text-gray-400">
                <div>Loading tasks…</div>
                <div className="w-24 h-3 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 rounded animate-pulse" />
              </div>
            ) : (
              <div className="grid ">
                <TaskListSections tasks={displayedTasks} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Calendar component with selectable days and badges
function CalendarViewStyled({ year, month, occurrences, onDateClick, selectedDate }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build a map from date string to array of statuses
  const dateMap = {};
  occurrences.forEach(({ date, status }) => {
    const key = date.toISOString().slice(0, 10);
    if (!dateMap[key]) dateMap[key] = [];
    dateMap[key].push(status);
  });

  // Weekday header names
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // First day of month for alignment
  const firstDay = new Date(year, month, 1).getDay();

  // Helper to compare days
  function isSameDaySimple(d1, d2) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  const today = new Date();

  const blanks = Array.from({ length: firstDay }, (_, i) => (
    <div key={"blank-" + i} />
  ));

  const dayCells = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const dateKey = dateObj.toISOString().slice(0, 10);
    const statuses = dateMap[dateKey] || [];

    const isSelected = selectedDate && isSameDaySimple(dateObj, selectedDate);
    const isToday =
      today.getFullYear() === dateObj.getFullYear() &&
      today.getMonth() === dateObj.getMonth() &&
      today.getDate() === dateObj.getDate();

    dayCells.push(
      <button
        key={day}
        onClick={() => onDateClick(dateObj)}
        type="button"
        aria-label={`Day ${day}, ${statuses.length} task(s)`}
        className={`relative flex flex-col items-center justify-center rounded-md p-2 transition 
          ${
            isSelected
              ? "bg-purple-700 text-white font-semibold shadow-lg"
              : "hover:bg-purple-900 text-gray-300"
          }
          ${isToday ? "border-2 border-purple-500" : ""}
          min-h-[48px] min-w-[48px]
          `}
      >
        <span className="text-sm select-none">{day}</span>
        <div className="flex space-x-1 mt-1">
          {statuses.slice(0, 3).map((status, i) => {
            let dotColor = "bg-gray-500";
            if (status === "pending") dotColor = "bg-yellow-400";
            else if (status === "complete") dotColor = "bg-green-400";
            else if (status === "overdue") dotColor = "bg-red-500";
            else if (status === "ongoing") dotColor = "bg-blue-400";
            return (
              <span
                key={i}
                className={`w-2 h-2 rounded-full ${dotColor}`}
                title={status}
              />
            );
          })}
          {statuses.length > 3 && (
            <span className="text-[10px] text-gray-400 font-semibold">
              +{statuses.length - 3}
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 select-none mb-2">
        {weekdayNames.map((wd) => (
          <div
            key={wd}
            className="text-xs text-gray-400 text-center font-semibold py-1"
          >
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 select-none">
        {blanks}
        {dayCells}
      </div>
    </div>
  );
}

// src/components/CalendarView.jsx
import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { isSameDay } from "date-fns";

/**
 * props:
 *  - occurrences: array of { date: Date, status: 'pending'|'complete'|'ongoing'|'overdue', taskCount: number }
 *  - onDateClick: fn(date)
 */
export default function CalendarView({ occurrences = [], onDateClick }) {
  // build a map by yyyy-mm-dd for quick lookup
  const map = new Map();
  occurrences.forEach((o) => {
    const key = o.date.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(o);
  });

  // priority to pick badge color when multiple tasks exist on same day
  const statusPriority = ["overdue", "pending", "ongoing", "complete"];

  function tileContent({ date, view }) {
    if (view !== "month") return null;
    const key = date.toISOString().slice(0, 10);
    const items = map.get(key);
    if (!items || items.length === 0) return null;

    // choose top-priority status for color
    let chosen = items[0].status;
    for (const s of statusPriority) {
      if (items.some((i) => i.status === s)) {
        chosen = s;
        break;
      }
    }

    const color =
      chosen === "complete"
        ? "bg-green-500"
        : chosen === "ongoing"
        ? "bg-blue-400"
        : chosen === "pending"
        ? "bg-yellow-400"
        : "bg-red-500";

    return (
      <div className="flex items-end justify-center pointer-events-none">
        <span className={`inline-block w-3 h-3 rounded-full ${color} border border-white/10 shadow-sm`} />
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#0f1724] rounded-xl shadow-md">
      <Calendar
        onClickDay={(d) => onDateClick(d)}
        tileContent={tileContent}
        className="react-calendar border-0 bg-transparent text-white"
        nextLabel="›"
        prevLabel="‹"
      />
    </div>
  );
}

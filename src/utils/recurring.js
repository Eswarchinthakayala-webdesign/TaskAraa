import { addDays, isBefore, isEqual, isWeekend, getDate, parseISO } from "date-fns";

/**
 * Expand a task into occurrences.
 * - Uses recurring_type from task.recurring_type
 * - task.start_date, task.due_date are 'YYYY-MM-DD' strings or Date objects
 */
export function expandTaskOccurrences(task) {
  if (!task.start_date) return [];

  const start = typeof task.start_date === "string" ? parseISO(task.start_date) : task.start_date;
  const due = task.due_date
    ? (typeof task.due_date === "string" ? parseISO(task.due_date) : task.due_date)
    : start;

  const occurrences = [];
  const MAX_DAYS = 365 * 3;
  let current = start;
  let steps = 0;

  // Ensure task.recurring_type exists, default to 'none'
  const type = task.recurring_type || "none";

  while ((isBefore(current, due) || isEqual(current, due)) && steps < MAX_DAYS) {
    let add = false;

    if (type === "none") {
      occurrences.push(new Date(current));
      break;
    } else if (type === "weekdays") {
      if (!isWeekend(current)) add = true;
    } else if (type === "weekends") {
      if (isWeekend(current)) add = true;
    } else if (type === "monthly") {
      if (getDate(current) === getDate(start)) add = true;
    } else {
      if (isEqual(current, start)) add = true;
    }

    if (add) occurrences.push(new Date(current));
    current = addDays(current, 1);
    steps++;
  }

  return occurrences;
}

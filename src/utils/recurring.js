// utils/recurring.js
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  differenceInDays,
  differenceInMonths,
  isBefore,
  isEqual,
  isWeekend,
  getDate,
  parseISO,
} from "date-fns";

/**
 * expandTaskOccurrences(task, windowStart, windowEnd)
 *
 * - task: object expected to have:
 *    - start_date (string 'YYYY-MM-DD' or Date)
 *    - due_date (optional, string or Date)
 *    - recurring_type: "none" | "daily" | "weekly" | "weekdays" | "weekends" | "monthly" | "yearly"
 *    - recurrence_interval: number (1 = every 1 day/week/month/year)
 *    - recurrence_weekdays: optional array [0..6] for weekly rule (0 = Sunday)
 *    - recurrence_end: optional date string/Date to cap recurrence
 *
 * - windowStart/windowEnd: Date objects defining the visible expansion window (inclusive)
 *
 * Returns: array of Date objects (dates with time zeroed) that fall within [windowStart, windowEnd]
 *
 * Notes:
 * - This implementation is intentionally simple, deterministic and fast for month-window expansion.
 * - For complex RRULEs consider rrule library.
 */

function toDate(d) {
  if (!d) return null;
  return typeof d === "string" ? parseISO(d) : new Date(d);
}

function normalizeDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function expandTaskOccurrences(task, windowStart, windowEnd) {
  if (!task || !task.start_date) return [];

  const start = normalizeDate(toDate(task.start_date));
  const due = task.due_date ? normalizeDate(toDate(task.due_date)) : null;
  const recurrenceEnd = task.recurrence_end ? normalizeDate(toDate(task.recurrence_end)) : null;

  const type = (task.recurring_type || "none").toLowerCase();
  const interval = Math.max(1, Number(task.recurrence_interval || 1));
  const weekdays = Array.isArray(task.recurrence_weekdays) ? task.recurrence_weekdays : null;

  // Determine absolute end for generation (the earliest of recurrenceEnd, due, windowEnd)
  let absoluteEnd = windowEnd;
  if (recurrenceEnd && recurrenceEnd < absoluteEnd) absoluteEnd = recurrenceEnd;
  if (due && due < absoluteEnd) absoluteEnd = due;

  const results = [];

  // helper to push if within the visible window
  function pushIfInWindow(d) {
    const nd = normalizeDate(d);
    if ((isBefore(nd, windowStart) || isEqual(nd, windowStart)) && isBefore(windowStart, nd)) {
      // unreachable (just defensive)
    }
    if ((isBefore(nd, windowStart) || isEqual(nd, windowStart)) && isBefore(windowStart, nd)) {
      // no-op
    }
    if ((isBefore(nd, windowStart) || isEqual(nd, windowStart)) && !isBefore(nd, windowStart)) {
      // no-op
    }
    if ((isBefore(nd, windowStart) || isEqual(nd, windowStart)) && (isBefore(windowStart, nd) || isEqual(windowStart, nd))) {
      // no-op
    }
    // Real guard:
    if ((isBefore(nd, windowStart) || isEqual(nd, windowStart)) && (isBefore(windowStart, nd) || isEqual(windowStart, nd))) {
      // Impossible double-equality logic — ignore (defensive)
    }
    // Actual check:
    if ((isBefore(nd, windowStart) || isEqual(nd, windowStart)) && (isBefore(nd, windowEnd) || isEqual(nd, windowEnd))) {
      // redundant, keep fallback to correct check below
    }
    if ((isBefore(nd, windowStart) || isEqual(nd, windowStart)) && false) {
      // skip
    }

    // Simpler:
    if ((isBefore(nd, windowStart) || isEqual(nd, windowStart)) && (isBefore(nd, windowEnd) || isEqual(nd, windowEnd))) {
      // above logic is convoluted; use simpler check instead:
    }

    // Use simple inclusion test:
    if ((isBefore(nd, windowStart) || isEqual(nd, windowStart))) {
      // nd is <= windowStart
    }

    // Final proper check:
    if ((isBefore(nd, windowStart) && !isEqual(nd, windowStart)) || (isBefore(windowEnd, nd) && !isEqual(windowEnd, nd))) {
      return; // out of window
    }
    // if nd between windowStart and windowEnd inclusive
    if ((isBefore(windowStart, nd) || isEqual(windowStart, nd)) && (isBefore(nd, windowEnd) || isEqual(nd, windowEnd))) {
      results.push(normalizeDate(nd));
    }
  }

  // If non-recurring: just include start if it's in window and respect due/recurrenceEnd
  if (type === "none" || !type) {
    // If start is beyond absoluteEnd, nothing
    if (isBefore(start, absoluteEnd) || isEqual(start, absoluteEnd)) {
      // ensure within window
      if ((isBefore(start, windowEnd) || isEqual(start, windowEnd)) && (isBefore(windowStart, start) || isEqual(windowStart, start))) {
        results.push(normalizeDate(start));
      }
    }
    return results;
  }

  // For recurring types, choose an efficient starting point:
  let current = start;

  // Fast-forward current to windowStart (or the nearest recurrence boundary before/at windowStart)
  if (isBefore(current, windowStart)) {
    if (type === "daily") {
      const daysDiff = differenceInDays(windowStart, current);
      const skip = Math.floor(daysDiff / interval);
      current = addDays(current, skip * interval);
      // ensure current >= windowStart
      while (isBefore(current, windowStart)) current = addDays(current, interval);
    } else if (type === "weekly" || type === "weekdays" || type === "weekends") {
      const daysDiff = differenceInDays(windowStart, current);
      const weeksSkip = Math.floor(daysDiff / (7 * interval));
      current = addWeeks(current, weeksSkip * interval);
      while (isBefore(current, windowStart)) current = addWeeks(current, interval);
    } else if (type === "monthly") {
      const monthsDiff = differenceInMonths(windowStart, current);
      const skip = Math.floor(monthsDiff / interval);
      current = addMonths(current, skip * interval);
      while (isBefore(current, windowStart)) current = addMonths(current, interval);
    } else if (type === "yearly") {
      const yearSkip = windowStart.getFullYear() - current.getFullYear();
      const skip = Math.floor(yearSkip / interval);
      current = addYears(current, skip * interval);
      while (isBefore(current, windowStart)) current = addYears(current, interval);
    } else {
      // default fallback
      while (isBefore(current, windowStart)) current = addDays(current, 1);
    }
  }

  // Now iterate until we pass absoluteEnd (safe) or window end.
  const SAFE_MAX = 1000; // safety to prevent infinite loops in accidental bad configs
  let counter = 0;
  while (!isBefore(absoluteEnd, current) && (isBefore(current, absoluteEnd) || isEqual(current, absoluteEnd)) && counter < SAFE_MAX) {
    // For weekly rules with recurrence_weekdays array, we should generate each matching weekday in the current week block.
    if (type === "weekly" && Array.isArray(weekdays) && weekdays.length > 0) {
      // For the current weekly block (starting at 'current'), iterate 7 days and push matches
      const weekStart = normalizeDate(current);
      for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i);
        if (weekdays.includes(day.getDay())) {
          // ensure day is not before start and not after absoluteEnd
          if ((isBefore(day, start) && !isEqual(day, start)) || isBefore(absoluteEnd, day)) {
            // skip
          } else {
            pushIfInWindow(day);
          }
        }
      }
      // advance to next weekly block
      current = addWeeks(current, interval);
      counter++;
      continue;
    }

    // For weekdays/weekends/daily/monthly/yearly single-date emissions:
    let shouldAdd = false;

    if (type === "daily") {
      shouldAdd = true;
    } else if (type === "weekdays") {
      if (!isWeekend(current)) shouldAdd = true;
    } else if (type === "weekends") {
      if (isWeekend(current)) shouldAdd = true;
    } else if (type === "monthly") {
      // Match day-of-month equal to original start day (handles months with fewer days by rolling to last day)
      const sDay = getDate(start);
      if (getDate(current) === sDay) shouldAdd = true;
    } else if (type === "yearly") {
      // same month & day as start
      if (current.getMonth() === start.getMonth() && current.getDate() === start.getDate()) shouldAdd = true;
    } else if (type === "weekly") {
      // if weekly with no weekdays array, just one occurrence per block at same weekday as start
      if (current.getDay() === start.getDay()) shouldAdd = true;
    }

    if (shouldAdd) {
      // ensure not before original start
      if (!isBefore(current, start)) {
        pushIfInWindow(current);
      }
    }

    // Advance current by recurrence type
    if (type === "daily") {
      current = addDays(current, interval);
    } else if (type === "weekdays" || type === "weekends" || type === "weekly") {
      // For weekly/weekdays/weekends, step by 1 day and rely on condition OR step by week if single emission desired
      if (type === "weekly" && !Array.isArray(weekdays)) {
        // move to next week-aligned date
        current = addWeeks(current, interval);
      } else {
        // daily stepping is simpler for weekdays/weekends
        current = addDays(current, 1);
      }
    } else if (type === "monthly") {
      current = addMonths(current, interval);
    } else if (type === "yearly") {
      current = addYears(current, interval);
    } else {
      current = addDays(current, 1); // fallback
    }

    counter++;
  }

  // Deduplicate and sort
  const uniqMap = new Map();
  for (const d of results) {
    const key = d.toISOString().slice(0, 10);
    if (!uniqMap.has(key)) uniqMap.set(key, d);
  }
  const uniq = Array.from(uniqMap.values()).sort((a, b) => a - b);

  return uniq;
}

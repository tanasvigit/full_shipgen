import { SCHEDULE_DAYS } from "@/lib/fleetops/constants";
import {
  driverIdFromScheduleItem,
  hourWindowFromScheduleItem,
  scheduleItemMeta,
  weekdayFromScheduleItem,
} from "@/lib/fleetops/scheduleItemHelpers";

export function parseHourWindow(item) {
  const start = Number(
    scheduleItemMeta(item, "start_hour") ?? item?.start_hour ?? item?.startHour,
  );
  const end = Number(scheduleItemMeta(item, "end_hour") ?? item?.end_hour ?? item?.endHour);
  if (Number.isFinite(start) && Number.isFinite(end)) {
    return { start, end };
  }

  const window = hourWindowFromScheduleItem(item);
  if (!window) return null;

  const [startText, endText] = window.split("-").map(Number);
  if (Number.isFinite(startText) && Number.isFinite(endText)) {
    return { start: startText, end: endText };
  }

  return null;
}

export function shiftsOverlap(a, b) {
  if (!a || !b) return false;
  const wrap = (start, end) => {
    if (end >= start) return [[start, end]];
    return [
      [start, 24],
      [0, end],
    ];
  };
  const rangesA = wrap(a.start, a.end);
  const rangesB = wrap(b.start, b.end);
  return rangesA.some(([as, ae]) => rangesB.some(([bs, be]) => as < be && bs < ae));
}

export function detectScheduleConflicts(items, candidate) {
  const day = candidate.day;
  const driverId = String(candidate.driverId);
  const window = { start: Number(candidate.start), end: Number(candidate.end) };
  const conflicts = [];

  for (const item of items) {
    const itemDriver = String(driverIdFromScheduleItem(item) || "");
    if (itemDriver !== driverId) continue;

    let itemDay = weekdayFromScheduleItem(item);
    if (String(itemDay) !== String(day)) continue;

    const w = parseHourWindow(item);
    if (w && shiftsOverlap(w, window)) {
      conflicts.push({
        id: item?.uuid || item?.id,
        day: itemDay,
        window: `${w.start}-${w.end}`,
        message: `Overlaps existing shift ${w.start}:00–${w.end}:00 on ${day}`,
      });
    }
  }

  return conflicts;
}

export function driverUtilization(items, driverId) {
  const dayHours = Object.fromEntries(SCHEDULE_DAYS.map((d) => [d, 0]));
  let total = 0;

  for (const item of items) {
    if (String(driverIdFromScheduleItem(item) || "") !== String(driverId)) continue;
    const w = parseHourWindow(item);
    if (!w) continue;
    const hours = w.end >= w.start ? w.end - w.start : 24 - w.start + w.end;
    const day = weekdayFromScheduleItem(item);
    if (dayHours[day] != null) dayHours[day] += hours;
    total += hours;
  }

  return { dayHours, total, overloaded: total > 48 };
}

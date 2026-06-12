import { SCHEDULE_DAYS } from "@/lib/fleetops/constants";

export function scheduleItemMeta(item, key) {
  const meta = item?.meta;
  if (meta && typeof meta === "object" && meta[key] != null) return meta[key];
  return undefined;
}

export function driverIdFromScheduleItem(item) {
  return (
    item?.assignee_uuid ||
    item?.driver_uuid ||
    item?.driver_id ||
    item?.driver?.uuid ||
    item?.driver?.id ||
    null
  );
}

export function weekdayFromScheduleItem(item) {
  const raw =
    scheduleItemMeta(item, "weekday") ??
    scheduleItemMeta(item, "day") ??
    item?.weekday ??
    item?.day ??
    scheduleItemMeta(item, "day_of_week") ??
    item?.day_of_week ??
    item?.dayOfWeek;

  if (raw == null) return null;
  if (typeof raw === "number" && SCHEDULE_DAYS[raw] != null) return SCHEDULE_DAYS[raw];

  const s = String(raw).trim();
  if (SCHEDULE_DAYS.includes(s)) return s;

  const short = s.slice(0, 3);
  const ix = SCHEDULE_DAYS.findIndex((d) => d.toLowerCase().startsWith(short.toLowerCase()));
  return ix >= 0 ? SCHEDULE_DAYS[ix] : null;
}

export function hourWindowFromScheduleItem(item) {
  const startHour =
    scheduleItemMeta(item, "start_hour") ?? item?.start_hour ?? item?.startHour;
  const endHour = scheduleItemMeta(item, "end_hour") ?? item?.end_hour ?? item?.endHour;

  if (startHour != null && endHour != null) {
    return `${Number(startHour)}-${Number(endHour)}`;
  }

  const start = item?.start_at || item?.starts_at || item?.start_time || item?.start;
  const end = item?.end_at || item?.ends_at || item?.end_time || item?.end;
  if (!start || !end) return null;

  try {
    const da = new Date(start);
    const db = new Date(end);
    if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return null;
    return `${da.getHours()}-${db.getHours()}`;
  } catch {
    return null;
  }
}

function nextWeekdayDate(dayName) {
  const target = SCHEDULE_DAYS.indexOf(dayName);
  if (target < 0) return null;

  const now = new Date();
  const current = (now.getDay() + 6) % 7;
  let delta = target - current;
  if (delta < 0) delta += 7;

  const date = new Date(now);
  date.setDate(now.getDate() + delta);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function buildRecurringShiftTimes(day, startHour, endHour) {
  const anchor = nextWeekdayDate(day);
  if (!anchor || !Number.isFinite(Number(startHour)) || !Number.isFinite(Number(endHour))) {
    return { start_at: null, end_at: null };
  }

  const start = new Date(anchor);
  start.setHours(Number(startHour), 0, 0, 0);

  const end = new Date(start);
  if (Number(endHour) >= Number(startHour)) {
    end.setHours(Number(endHour), 0, 0, 0);
  } else {
    end.setDate(end.getDate() + 1);
    end.setHours(Number(endHour), 0, 0, 0);
  }

  return {
    start_at: start.toISOString(),
    end_at: end.toISOString(),
  };
}

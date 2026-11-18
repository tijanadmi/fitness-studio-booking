import { DateTime } from "luxon";
import { ZONE, studioDate } from "./booking.js";

export function schedulePeriod(value, requestedView) {
  const parsed = DateTime.fromISO(
    typeof value === "string" ? value : studioDate(),
    { zone: ZONE },
  );
  const selectedDate = (
    parsed.isValid ? parsed : DateTime.now().setZone(ZONE)
  ).startOf("day");
  const view = requestedView === "day" ? "day" : "week";
  const start = view === "week" ? selectedDate.startOf("week") : selectedDate;
  const days = Array.from({ length: view === "week" ? 7 : 1 }, (_, i) =>
    start.plus({ days: i }),
  );
  return {
    selectedDate,
    view,
    start,
    end: start.plus({ days: days.length }),
    days,
  };
}
function minuteOfDay(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}
function clockLabel(minutes) {
  return (
    String(Math.floor(minutes / 60)).padStart(2, "0") +
    ":" +
    String(minutes % 60).padStart(2, "0")
  );
}
export function buildTimetable(appointments, workingHours, days) {
  const dates = new Set(days.map((day) => day.toISODate()));
  const weekdays = new Set(days.map((day) => day.weekday));
  const relevant = appointments.filter((a) =>
    dates.has(DateTime.fromISO(a.starts_at).setZone(ZONE).toISODate()),
  );
  const booked = relevant.filter((a) => a.status === "booked");
  const cancelled = relevant.filter((a) => a.status === "cancelled");
  const finished = relevant.filter(
    (a) => a.status === "completed" || a.status === "no_show",
  );
  const hours = workingHours.filter((w) => weekdays.has(w.weekday));
  const starts = hours.map((w) => Math.floor(minuteOfDay(w.start_time) / 60));
  const ends = hours.map((w) => Math.ceil(minuteOfDay(w.end_time) / 60) - 1);
  const bookingHours = booked.map(
    (a) => DateTime.fromISO(a.starts_at).setZone(ZONE).hour,
  );
  const first = Math.min(
    ...starts,
    ...bookingHours,
    ...(!starts.length && !bookingHours.length ? [8] : []),
  );
  const last = Math.max(
    ...ends,
    ...bookingHours,
    ...(!ends.length && !bookingHours.length ? [19] : []),
  );
  const times = new Set(
    Array.from({ length: last - first + 1 }, (_, i) =>
      clockLabel((first + i) * 60),
    ),
  );
  const cells = new Map();
  for (const appointment of booked) {
    const local = DateTime.fromISO(appointment.starts_at).setZone(ZONE);
    const time = local.toFormat("HH:mm");
    times.add(time);
    const key = local.toISODate() + "|" + time;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(appointment);
  }
  return { times: [...times].sort(), cells, booked, cancelled, finished };
}

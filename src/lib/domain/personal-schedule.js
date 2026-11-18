import { DateTime } from "luxon";
import { ZONE } from "./booking.js";
export function personalSchedule(appointments, days) {
  const grouped = new Map(days.map((day) => [day.toISODate(), []]));
  const visible = appointments
    .filter((a) =>
      grouped.has(DateTime.fromISO(a.starts_at).setZone(ZONE).toISODate()),
    )
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
  const cancelled = visible.filter((a) => a.status === "cancelled");
  const scheduled = visible.filter((a) => a.status !== "cancelled");
  for (const appointment of scheduled)
    grouped
      .get(DateTime.fromISO(appointment.starts_at).setZone(ZONE).toISODate())
      .push(appointment);
  return { grouped, cancelled, scheduled };
}

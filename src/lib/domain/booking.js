import { DateTime } from "luxon";
export const ZONE = "Europe/Belgrade";
export const CANCELLATION_NOTICE_MINUTES = 0;
export function canCancel(start, now = new Date()) {
  return (
    new Date(start).getTime() - now.getTime() >
    CANCELLATION_NOTICE_MINUTES * 60000
  );
}
export function overlaps(a, b) {
  return (
    new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end)
  );
}
export function studioDate() {
  return DateTime.now().setZone(ZONE).toISODate();
}
export function displayTime(value) {
  return DateTime.fromISO(value, { zone: ZONE })
    .setLocale("sr-Latn")
    .toFormat("dd.MM.yyyy. HH:mm");
}
export function displayClock(value) {
  return DateTime.fromISO(value, { zone: ZONE }).toFormat("HH:mm");
}
export function safeNext(value) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !Array.from(value).some(
      (character) =>
        character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
    )
    ? value
    : "/zakazivanje";
}
export const statusLabels = {
  booked: "Zakazano",
  cancelled: "Otkazano",
  completed: "Završeno",
  no_show: "Nije došao/la",
};

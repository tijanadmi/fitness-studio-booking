import test from "node:test";
import assert from "node:assert/strict";
import { schedulePeriod, buildTimetable } from "../src/lib/domain/timetable.js";
const period = schedulePeriod("2026-11-18", "week");
const hours = [{ weekday: 1, start_time: "08:00:00", end_time: "17:00:00" }];
const appointment = (id, start, status = "booked", trainer = "one") => ({
  id,
  starts_at: start,
  status,
  trainer_id: trainer,
});

test("weekly view starts Monday and includes seven local calendar days", () => {
  assert.equal(period.start.toISODate(), "2026-11-16");
  assert.equal(period.end.toISODate(), "2026-11-23");
  assert.equal(period.selectedDate.toISODate(), "2026-11-18");
  assert.equal(period.days.length, 7);
  assert.equal(schedulePeriod("2026-11-18", "day").days.length, 1);
  assert.equal(schedulePeriod("2026-11-18", undefined).view, "week");
});
test("cancelled and terminal appointments are separated from the timetable", () => {
  const rows = [
    appointment("booked", "2026-11-16T07:00:00Z"),
    appointment("cancelled", "2026-11-16T00:00:00Z", "cancelled"),
    appointment("completed", "2026-11-16T09:00:00Z", "completed"),
    appointment("missed", "2026-11-16T10:00:00Z", "no_show"),
  ];
  const result = buildTimetable(rows, hours, period.days);
  assert.equal(result.booked.length, 1);
  assert.equal(result.cancelled.length, 1);
  assert.equal(result.finished.length, 2);
  assert.deepEqual(
    [...result.cells.values()].flat().map((a) => a.id),
    ["booked"],
  );
  assert.equal(result.times[0], "08:00");
  assert.equal(result.times.at(-1), "16:00");
});
test("simultaneous trainers remain visible in the same day and time cell", () => {
  const result = buildTimetable(
    [
      appointment("a", "2026-11-16T07:00:00Z"),
      appointment("b", "2026-11-16T07:00:00Z", "booked", "two"),
    ],
    hours,
    period.days,
  );
  assert.equal(result.cells.get("2026-11-16|08:00").length, 2);
});
test("non-hour starts and late appointments are never omitted", () => {
  const result = buildTimetable(
    [
      appointment("half", "2026-11-16T07:30:00Z"),
      appointment("late", "2026-11-16T21:00:00Z"),
    ],
    hours,
    period.days,
  );
  assert.ok(result.times.includes("08:30"));
  assert.ok(result.times.includes("22:00"));
  assert.equal(result.cells.get("2026-11-16|08:30")[0].id, "half");
});
test("records outside the displayed period do not appear in table or history", () => {
  const result = buildTimetable(
    [
      appointment("old", "2026-11-09T07:00:00Z"),
      appointment("old-cancelled", "2026-11-09T08:00:00Z", "cancelled"),
    ],
    [],
    period.days,
  );
  assert.equal(result.cells.size, 0);
  assert.equal(result.cancelled.length, 0);
  assert.equal(result.times[0], "08:00");
});

test("autumn DST keeps both appointments in the repeated local hour", () => {
  const autumn = schedulePeriod("2027-10-31", "week");
  assert.equal(autumn.end.diff(autumn.start, "hours").hours, 169);
  const result = buildTimetable(
    [
      appointment("summer-offset", "2027-10-31T00:00:00Z"),
      appointment("winter-offset", "2027-10-31T01:00:00Z"),
    ],
    [{ weekday: 7, start_time: "00:00", end_time: "05:00" }],
    autumn.days,
  );
  assert.equal(result.cells.get("2027-10-31|02:00").length, 2);
});

import test from "node:test";
import assert from "node:assert/strict";
import { schedulePeriod } from "../src/lib/domain/timetable.js";
import { personalSchedule } from "../src/lib/domain/personal-schedule.js";
import { periodHref } from "../src/lib/domain/period-links.js";
const record = (id, starts_at, status = "booked") => ({
  id,
  starts_at,
  status,
});

test("daily personal view includes only the selected local day", () => {
  const { days, start, end } = schedulePeriod("2026-11-18", "day");
  assert.equal(start.toISODate(), "2026-11-18");
  assert.equal(end.toISODate(), "2026-11-19");
  const result = personalSchedule(
    [
      record("selected", "2026-11-18T08:00:00+01:00"),
      record("other", "2026-11-19T08:00:00+01:00"),
      record("cancelled", "2026-11-18T09:00:00+01:00", "cancelled"),
    ],
    days,
  );
  assert.deepEqual(
    result.scheduled.map((a) => a.id),
    ["selected"],
  );
  assert.deepEqual(
    result.cancelled.map((a) => a.id),
    ["cancelled"],
  );
  assert.equal(result.grouped.size, 1);
});
test("personal weekly view retains completed and missed sessions in chronological order", () => {
  const { days } = schedulePeriod("2026-11-18", "week");
  const result = personalSchedule(
    [
      record("late", "2026-11-18T17:00:00+01:00"),
      record("done", "2026-11-18T08:00:00+01:00", "completed"),
      record("missed", "2026-11-18T10:00:00+01:00", "no_show"),
    ],
    days,
  );
  assert.deepEqual(
    result.grouped.get("2026-11-18").map((a) => a.id),
    ["done", "missed", "late"],
  );
  assert.equal(result.scheduled.length, 3);
});
test("day grouping uses Belgrade calendar boundaries instead of UTC date", () => {
  const { days } = schedulePeriod("2026-11-18", "day");
  const result = personalSchedule(
    [
      record("midnight", "2026-11-17T23:15:00Z"),
      record("following", "2026-11-18T23:15:00Z"),
    ],
    days,
  );
  assert.deepEqual(
    result.scheduled.map((a) => a.id),
    ["midnight"],
  );
});
test("day links preserve the clicked date and selected trainer", () => {
  const href = periodHref(
    "/administracija",
    "2026-11-18",
    "day",
    "trainer-two",
  );
  const url = new URL(href, "https://studio.example");
  assert.equal(url.pathname, "/administracija");
  assert.equal(url.searchParams.get("view"), "day");
  assert.equal(url.searchParams.get("date"), "2026-11-18");
  assert.equal(url.searchParams.get("trainer"), "trainer-two");
});
test("personal period links switch modes without adding an instructor filter", () => {
  const url = new URL(
    periodHref("/moji-termini", "2026-11-18", "week"),
    "https://studio.example",
  );
  assert.equal(url.searchParams.get("view"), "week");
  assert.equal(url.searchParams.has("trainer"), false);
});
test("daily range on autumn transition includes both instances of the repeated hour", () => {
  const { days, start, end } = schedulePeriod("2027-10-31", "day");
  assert.equal(end.diff(start, "hours").hours, 25);
  const result = personalSchedule(
    [
      record("first", "2027-10-31T00:00:00Z"),
      record("second", "2027-10-31T01:00:00Z"),
    ],
    days,
  );
  assert.equal(result.grouped.get("2027-10-31").length, 2);
});

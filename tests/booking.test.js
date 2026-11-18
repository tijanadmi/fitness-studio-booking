import test from "node:test";
import assert from "node:assert/strict";
import { DateTime } from "luxon";
import {
  canCancel,
  overlaps,
  safeNext,
  displayTime,
  displayClock,
  ZONE,
} from "../src/lib/domain/booking.js";
test("half-open periods allow consecutive appointments", () => {
  const a = { start: "2027-01-04T09:00Z", end: "2027-01-04T10:00Z" };
  assert.equal(
    overlaps(a, { start: "2027-01-04T10:00Z", end: "2027-01-04T11:00Z" }),
    false,
  );
  assert.equal(
    overlaps(a, { start: "2027-01-04T09:30Z", end: "2027-01-04T10:30Z" }),
    true,
  );
});
test("cancellation deadline is exclusive", () => {
  const now = new Date("2027-01-04T09:00Z");
  assert.equal(canCancel("2027-01-04T09:01Z", now), true);
  assert.equal(canCancel(now, now), false);
  assert.equal(canCancel("2027-01-04T08:59Z", now), false);
});
test("booking continuation rejects external and backslash redirects", () => {
  for (const path of [
    "https://example.org",
    "//example.org",
    "/\\example.org",
    "/\t/example.org",
    "/\n/example.org",
  ])
    assert.equal(safeNext(path), "/zakazivanje");
  assert.equal(safeNext("/zakazivanje?trainer=1"), "/zakazivanje?trainer=1");
});
test("Belgrade summer and winter times display without UTC suffixes", () => {
  assert.equal(displayTime("2027-01-04T09:00:00Z"), "04.01.2027. 10:00");
  assert.equal(displayTime("2027-07-05T08:00:00Z"), "05.07.2027. 10:00");
  assert.equal(displayClock("2027-01-04T09:00:00Z"), "10:00");
  assert.equal(displayClock("2027-07-05T08:00:00Z"), "10:00");
});
test("DST transition preserves 60 elapsed minutes", () => {
  for (const iso of ["2027-03-28T01:00:00", "2027-10-31T02:00:00"]) {
    const t = DateTime.fromISO(iso, { zone: ZONE });
    assert.equal(t.plus({ minutes: 60 }).toMillis() - t.toMillis(), 3600000);
  }
});

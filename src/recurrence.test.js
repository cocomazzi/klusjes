import test from "node:test";
import assert from "node:assert/strict";
import { matches, occurrence, futureRules } from "./recurrence.js";
test("monthly short months retain anchor", () => {
  const r = { start: "2024-01-31", freq: "monthly" };
  assert(matches(r, "2024-02-29"));
  assert(matches(r, "2024-03-31"));
  assert(!matches(r, "2024-03-29"));
});
test("custom weeks cross year", () => {
  const r = {
    start: "2025-12-29",
    freq: "weekly",
    interval: 2,
    weekdays: [1, 3],
  };
  assert(matches(r, "2025-12-31"));
  assert(!matches(r, "2026-01-05"));
  assert(matches(r, "2026-01-12"));
});
test("independent completion and preserved history", () => {
  let s = {
    id: "s",
    rules: [{ start: "2026-01-01", freq: "daily", title: "A" }],
  };
  s = {
    ...s,
    rules: futureRules(s, "2026-01-03", { freq: "daily", title: "B" }),
  };
  const st = [{ series_id: "s", day: "2026-01-01", done: true }];
  assert.equal(occurrence(s, "2026-01-01", st).done, true);
  assert.equal(occurrence(s, "2026-01-02", st).done, false);
  assert.equal(occurrence(s, "2026-01-02", st).title, "A");
  assert.equal(occurrence(s, "2026-01-03", st).title, "B");
});

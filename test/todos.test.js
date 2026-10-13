import assert from "node:assert/strict";
import test from "node:test";
import { parseDueOn, parseId, parseTitle, parseUrgent } from "../lib/todos.js";

test("trims the title", () => {
  assert.equal(parseTitle("  buy milk  "), "buy milk");
});

test("rejects an empty title", () => {
  assert.throws(() => parseTitle("   "), /required/);
});

test("accepts a positive integer id", () => {
  assert.equal(parseId("42"), 42);
});

test("rejects an id that is not a positive integer", () => {
  for (const id of [undefined, "", "abc", "1.5", "-3", "0"]) {
    assert.throws(() => parseId(id), /Invalid id/);
  }
});

test("accepts a missing or empty due date", () => {
  assert.equal(parseDueOn(undefined), null);
  assert.equal(parseDueOn(""), null);
});

test("accepts a calendar date", () => {
  assert.equal(parseDueOn("2026-10-14"), "2026-10-14");
});

test("rejects a due date that is not a calendar date", () => {
  for (const dueOn of ["tomorrow", "2026-02-30", "2026-1-5", 20261014]) {
    assert.throws(() => parseDueOn(dueOn), /Due date must be a date/);
  }
});

test("urgent defaults to false and accepts booleans", () => {
  assert.equal(parseUrgent(undefined), false);
  assert.equal(parseUrgent(true), true);
  assert.equal(parseUrgent(false), false);
});

test("rejects an urgent flag that is not a boolean", () => {
  for (const urgent of ["false", "true", 1, null]) {
    assert.throws(() => parseUrgent(urgent), /Urgent must be true or false/);
  }
});

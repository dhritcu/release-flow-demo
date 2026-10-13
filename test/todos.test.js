import assert from "node:assert/strict";
import test from "node:test";
import { parseDueOn, parseId, parseTitle } from "../lib/todos.js";

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

import assert from "node:assert/strict";
import test from "node:test";
import { parseId, parseTitle } from "../lib/todos.js";

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

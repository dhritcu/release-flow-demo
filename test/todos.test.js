import assert from "node:assert/strict";
import test from "node:test";
import { parseTitle } from "../lib/todos.js";

test("trims the title", () => {
  assert.equal(parseTitle("  buy milk  "), "buy milk");
});

test("rejects an empty title", () => {
  assert.throws(() => parseTitle("   "), /required/);
});

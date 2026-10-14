import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const script = resolve("scripts/previous-candidate.sh");

function repo() {
  const dir = mkdtempSync(join(tmpdir(), "previous-candidate-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
  for (const [k, v] of [["user.email", "t@example.com"], ["user.name", "T"], ["commit.gpgSign", "false"], ["tag.gpgSign", "false"]]) git("config", k, v);
  const commit = (m) => { git("commit", "-q", "--allow-empty", "-m", m); return git("rev-parse", "HEAD"); };
  const tag = (name, sha) => git("tag", name, sha);
  const previous = (candidate) => execFileSync(script, [candidate], { cwd: dir, encoding: "utf8" }).trim();
  return { git, commit, tag, previous };
}

test("the first candidate has nothing to compare with", () => {
  const r = repo();
  r.tag("v2026.10.14.1-rc.1", r.commit("a"));
  assert.equal(r.previous("v2026.10.14.1-rc.1"), "");
});

test("a re-pin compares with the candidate before it", () => {
  const r = repo();
  r.tag("v2026.10.14.1-rc.1", r.commit("a"));
  r.tag("v2026.10.14.1-rc.2", r.commit("b"));
  assert.equal(r.previous("v2026.10.14.1-rc.2"), "v2026.10.14.1-rc.1");
});

test("after a hotfix interrupts QA, the returning candidate compares with the interrupted one", () => {
  const r = repo();
  const base = r.commit("released");
  r.tag("v2026.10.14.1-rc.1", base);
  r.tag("v2026.10.14.1", base);
  const a = r.commit("feature A in QA");
  r.tag("v2026.10.14.2-rc.1", a);
  r.git("switch", "-q", "-c", "release/v2026.10.14.1", base);
  const fix = r.commit("hotfix");
  r.tag("v2026.10.14.3-rc.1", fix);
  r.tag("v2026.10.14.3", fix);
  r.git("switch", "-q", "main");
  r.tag("v2026.10.14.4-rc.1", r.commit("merged during the interruption"));
  assert.equal(r.previous("v2026.10.14.4-rc.1"), "v2026.10.14.2-rc.1");
});

test("a shipped candidate is not compared with: its release notes already cover it", () => {
  const r = repo();
  const a = r.commit("a");
  r.tag("v2026.10.14.1-rc.1", a);
  r.tag("v2026.10.14.1", a);
  r.tag("v2026.10.14.2-rc.1", r.commit("b"));
  assert.equal(r.previous("v2026.10.14.2-rc.1"), "");
});

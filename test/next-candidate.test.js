import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const script = resolve("scripts/next-candidate.sh");
const DAY = "2026.10.14";

/** A throwaway repo where `main` and a release branch get commits and tags. */
function repo() {
  const dir = mkdtempSync(join(tmpdir(), "next-candidate-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "Test");
  git("config", "tag.gpgSign", "false");
  git("config", "commit.gpgSign", "false");
  const commit = (message) => {
    git("commit", "-q", "--allow-empty", "-m", message);
    return git("rev-parse", "HEAD");
  };
  const tag = (name, sha) => git("tag", name, sha);
  const next = (sha) => execFileSync(script, [sha, DAY], { cwd: dir, encoding: "utf8" }).trim();
  return { git, commit, tag, next };
}

test("first candidate of the day", () => {
  const r = repo();
  assert.equal(r.next(r.commit("a")), `v${DAY}.1-rc.1`);
});

test("re-pin on the same line continues the open candidate", () => {
  const r = repo();
  const a = r.commit("a");
  r.tag(`v${DAY}.1-rc.1`, a);
  assert.equal(r.next(r.commit("b")), `v${DAY}.1-rc.2`);
});

test("a commit keeps its release or its unreleased candidate", () => {
  const r = repo();
  const a = r.commit("a");
  r.tag(`v${DAY}.1-rc.1`, a);
  assert.equal(r.next(a), `v${DAY}.1-rc.1`);
  r.tag(`v${DAY}.1`, a);
  assert.equal(r.next(a), `v${DAY}.1`);
});

test("after a release, the next commit starts the next version", () => {
  const r = repo();
  const a = r.commit("a");
  r.tag(`v${DAY}.1-rc.1`, a);
  r.tag(`v${DAY}.1`, a);
  assert.equal(r.next(r.commit("b")), `v${DAY}.2-rc.1`);
});

test("a hotfix during QA gets its own version, and the QA candidate is renumbered after it ships", () => {
  const r = repo();
  const base = r.commit("released");
  r.tag(`v${DAY}.1-rc.1`, base);
  r.tag(`v${DAY}.1`, base);
  const a = r.commit("feature A in QA");
  r.tag(`v${DAY}.2-rc.1`, a);

  r.git("switch", "-q", "-c", `release/v${DAY}.1`, base);
  const hotfix = r.commit("hotfix");
  assert.equal(r.next(hotfix), `v${DAY}.3-rc.1`, "hotfix is not a re-pin of A");
  r.tag(`v${DAY}.3-rc.1`, hotfix);
  r.tag(`v${DAY}.3`, hotfix);

  assert.equal(r.next(a), `v${DAY}.4-rc.1`, "A cannot ship under a number older than a shipped release");
});

test("a new day starts at 1", () => {
  const r = repo();
  const a = r.commit("a");
  r.tag("v2026.10.13.4-rc.1", a);
  assert.equal(r.next(r.commit("b")), `v${DAY}.1-rc.1`);
});

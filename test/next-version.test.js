import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const next = resolve("scripts/next-version.sh");
const previous = resolve("scripts/previous-version.sh");
const DAY = "2026.10.14";

/** A throwaway repo where commits get version tags. */
function repo() {
  const dir = mkdtempSync(join(tmpdir(), "versions-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
  for (const [k, v] of [["user.email", "t@example.com"], ["user.name", "T"], ["commit.gpgSign", "false"], ["tag.gpgSign", "false"]]) git("config", k, v);
  const commit = (m) => { git("commit", "-q", "--allow-empty", "-m", m); return git("rev-parse", "HEAD"); };
  const tag = (name, sha) => git("tag", name, sha);
  const run = (script, ...args) => execFileSync(script, args, { cwd: dir, encoding: "utf8" }).trim();
  return { git, commit, tag, nextVersion: (sha) => run(next, sha, DAY), previousVersion: (t) => run(previous, t) };
}

test("the first version of the day is .1", () => {
  const r = repo();
  assert.equal(r.nextVersion(r.commit("a")), `v${DAY}.1`);
});

test("every new commit on staging gets the next number", () => {
  const r = repo();
  r.tag(`v${DAY}.1`, r.commit("a"));
  assert.equal(r.nextVersion(r.commit("b")), `v${DAY}.2`);
});

test("a commit that already has a version keeps it", () => {
  const r = repo();
  const a = r.commit("a");
  r.tag(`v${DAY}.1`, a);
  assert.equal(r.nextVersion(a), `v${DAY}.1`);
});

test("a new day starts at 1, and old -rc tags are ignored", () => {
  const r = repo();
  r.tag("v2026.10.13.4", r.commit("a"));
  r.tag("v2026.10.13.5-rc.1", r.commit("b"));
  assert.equal(r.nextVersion(r.commit("c")), `v${DAY}.1`);
});

test("a hotfix during QA simply takes the next number", () => {
  const r = repo();
  const released = r.commit("released");
  r.tag(`v${DAY}.1`, released);
  r.tag(`v${DAY}.2`, r.commit("feature A in QA"));
  r.git("switch", "-q", "-c", `release/v${DAY}.1`, released);
  assert.equal(r.nextVersion(r.commit("hotfix")), `v${DAY}.3`);
});

test("the previous version is the newest one this commit builds on", () => {
  const r = repo();
  const released = r.commit("released");
  r.tag(`v${DAY}.1`, released);
  r.tag(`v${DAY}.2`, r.commit("feature A in QA"));
  r.git("switch", "-q", "-c", `release/v${DAY}.1`, released);
  r.tag(`v${DAY}.3`, r.commit("hotfix"));
  r.git("switch", "-q", "main");
  r.tag(`v${DAY}.4`, r.commit("merged during the hotfix"));
  assert.equal(r.previousVersion(`v${DAY}.4`), `v${DAY}.2`, "skips the hotfix on the release branch");
  assert.equal(r.previousVersion(`v${DAY}.3`), `v${DAY}.1`);
  assert.equal(r.previousVersion(`v${DAY}.1`), "");
});

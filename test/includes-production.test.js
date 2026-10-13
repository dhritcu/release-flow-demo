import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const script = resolve("scripts/includes-production.sh");

/** A throwaway repo with main and a release branch that gets a cherry-picked hotfix. */
function repo() {
  const dir = mkdtempSync(join(tmpdir(), "includes-production-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
  for (const [k, v] of [["user.email", "t@example.com"], ["user.name", "T"], ["commit.gpgSign", "false"]]) git("config", k, v);
  const commit = (message) => {
    git("commit", "-q", "--allow-empty", "-m", message);
    return git("rev-parse", "HEAD");
  };
  const includes = (candidate, production) => spawnSync(script, [candidate, production], { cwd: dir, encoding: "utf8" });
  return { git, commit, includes };
}

test("a later commit on the same line includes production", () => {
  const r = repo();
  const production = r.commit("released");
  assert.equal(r.includes(r.commit("next"), production).status, 0);
});

test("main includes a hotfix production runs when it has the original fix", () => {
  const r = repo();
  const base = r.commit("released");
  const fix = r.commit("fix on main");
  r.git("switch", "-q", "-c", "release/x", base);
  const hotfix = r.commit(`fix on main\n\n(cherry picked from commit ${fix})`);
  r.git("switch", "-q", "main");
  assert.equal(r.includes(r.commit("more work"), hotfix).status, 0);
});

test("a stale hotfix candidate does not include a newer production release", () => {
  const r = repo();
  const base = r.commit("released");
  r.git("switch", "-q", "-c", "release/x", base);
  const hotfix = r.commit("hotfix only on the release branch");
  r.git("switch", "-q", "main");
  const newer = r.commit("feature shipped from main");
  const result = r.includes(hotfix, newer);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /feature shipped from main/);
});

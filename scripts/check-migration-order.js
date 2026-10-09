// Fails when a branch adds a migration whose timestamp is older than the newest
// migration already on the target branch. Out-of-order files get skipped or
// rejected by `supabase migration up`, so the author renames the file instead.
import { execFileSync } from "node:child_process";

const base = process.argv[2];
const dir = "supabase/migrations";
const list = (args) => execFileSync("git", args, { encoding: "utf8" }).split("\n").filter(Boolean);
const version = (path) => path.split("/").pop().split("_")[0];

const baseVersions = list(["ls-tree", "--name-only", `${base}`, `${dir}/`]).map(version);
const newest = baseVersions.sort().at(-1) ?? "0";
const added = list(["diff", "--name-only", "--diff-filter=A", `${base}...HEAD`, "--", dir]);
const stale = added.filter((path) => version(path) <= newest);

for (const path of stale) {
  console.error(`::error file=${path}::${version(path)} is not newer than ${newest} on ${base}. Rename it with a fresh timestamp.`);
}
process.exit(stale.length > 0 ? 1 : 0);

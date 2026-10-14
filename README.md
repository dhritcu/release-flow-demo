# release-flow-demo

A small todo app (Vercel + Supabase Postgres) that demonstrates a trunk-based
release flow: one long-lived branch, environments that point at commits, and
hotfixes that never need a backmerge.

## The model

| Environment | Runs | Moves when |
|---|---|---|
| **preview** | a pull request's head commit | that pull request gets a push |
| **development** | the tip of `main` | anything merges to `main` (automatic) |
| **staging** | one pinned commit | someone runs **Deploy staging** (default: the tip of `main`) |
| **production** | the commit of a `v*` tag | someone runs **Cut release**, then a reviewer approves |

`main` is the only long-lived branch. Deploying never creates a commit, so there
is nothing to merge back.

## Normal release

1. Merge pull requests to `main`; `development` deploys each merge.
2. **Actions → Deploy staging → Run workflow**. The default puts the tip of
   `main` on staging as a release candidate: tag `v2026.10.14.1-rc.1` and a
   GitHub pre-release with the notes since the last production release.
3. QA tests staging. Merges to `main` keep going and never move staging. If QA
   rejects something, fix or revert it on `main` and deploy staging again:
   `v2026.10.14.1-rc.2`.
4. **Actions → Cut release → Run workflow** with the candidate QA signed off (required):
   it stops if staging runs anything else. It also stops if the
   candidate lacks something production runs. It ships the candidate
   staging runs as `v2026.10.14.1` (same commit, no `-rc`) and starts **Deploy
   production** for that tag. The pipeline always runs from `main`; only the code
   comes from the tag.
5. A reviewer approves the `production` environment. The workflow deploys and
   publishes the release, marked Latest.

## Hotfix when `main` is not ready to ship

1. Merge the fix to `main` with a normal pull request.
2. **Actions → Start hotfix → Run workflow** with that pull request's number. It
   reads the release production runs, creates `release/<tag>` if needed, cherry-picks
   the fix with `-x` and opens the hotfix pull request into that branch.
3. Review and merge the hotfix pull request.
4. Run **Deploy staging** with `release/<tag>` (a new candidate), then **Cut
   release**, as for a normal release.

The fix already lives on `main`, so the release branch is never merged anywhere.
When the cherry-pick conflicts, the workflow stops and prints the two commands to
run by hand.

## Versions

| Tag | Meaning |
|---|---|
| `v2026.10.14.1-rc.1` | release candidate on staging (GitHub pre-release) |
| `v2026.10.14.1-rc.2` | staging re-pinned to a later commit on the same line |
| `v2026.10.14.1` | shipped to production (GitHub release, Latest) |
| `v2026.10.14.2-rc.1` | the next candidate that day |

The number is `vYYYY.MM.DD.N` (UTC date, N from 1). Re-pinning staging to a later
commit on the same line continues the candidate (`-rc.2`). Anything else, such as a
hotfix while a candidate is in QA, takes the next number; once the hotfix ships, the
QA candidate is renumbered after it. A commit that already has a release, or a
candidate still ahead of every release, keeps it. `development` gets no tags; `/api/version`
shows the commit and, on staging and production, the version.

## Branches

`main` is the only long-lived branch. A `release/<tag>` branch exists only for a
release that needed a hotfix: **Start hotfix** creates it from that tag. Releases
without a hotfix have just their tag, which is all a rollback or a later hotfix
needs. Release branches are never merged and are kept (the ruleset blocks
deleting them).

## Rollback

Run **Deploy production** with an older tag, and its commit so the approver sees it.
It still needs a reviewer, and only takes tags that went through staging. The
release notes of that tag stay as they are, and the migration step keeps any newer
migrations the database already has.

## Approvals

- Pull requests into `main` and `release/**` need passing checks; the real repo
  also requires one approval. Bot-opened pull requests (like Start hotfix's) are
  approved by either developer.
- The `production` environment needs one reviewer. Admins cannot bypass it.
  Approving your own run is allowed, because the team has two developers.

## Migration rules

- **Expand only.** Add tables, nullable columns or columns with defaults. Remove
  old columns in a later release, once no deployed code reads them.
  `squawk` enforces this in CI.
- **New files sort last.** CI rejects a pull request whose migration timestamp is
  older than the newest migration on the target branch.
- **Production may receive migrations out of timestamp order.** A hotfix can
  ship migration C while migration B (older timestamp) still waits on `main`.
  The deploy runs `supabase migration up --include-all`, which applies every file
  missing from the target database's history, so nobody renames B and the other
  environments keep their history.

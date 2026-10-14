# release-flow-demo

A small todo app (Vercel + Supabase Postgres) that demonstrates a trunk-based
release flow, close to Microsoft's Release Flow: one long-lived branch (`main`),
environments that show one version, versions as tags, and urgent fixes that land
on `main` first and are copied onto the release, never merged back.

## The model

| Environment | Runs | Moves when |
|---|---|---|
| **preview** | a pull request's head commit | that pull request gets a push |
| **development** | the latest commit on `main` | anything merges to `main` (automatic) |
| **staging** | one version (a GitHub pre-release) | someone runs **Deploy staging** (default: the latest `main`) |
| **production** | one release | someone runs **Cut release**, then a reviewer approves |

`main` is the only long-lived branch. Deploying never creates a commit, so there
is nothing to merge back.

## Normal release

1. Merge pull requests to `main`; the development environment deploys each merge.
2. **Actions → Deploy staging → Run workflow**. The default puts the latest `main`
   on staging as the next version, e.g. `v2026.10.14.1`, published as a GitHub
   pre-release with the notes since the last production release.
3. QA tests staging. Merges to `main` keep going and never move staging. If QA
   rejects something, fix or revert it on `main` and deploy staging again: the next
   version, `v2026.10.14.2`, whose notes link to what changed since `v2026.10.14.1`.
4. **Actions → Cut release → Run workflow** with the version QA signed off
   (required). It stops if staging runs anything else, or if that version lacks
   something production runs, then starts **Deploy production** for it.
5. A reviewer approves the `production` environment. The workflow deploys, marks
   the version as released (Latest) and creates its branch `release/<version>`.

## Urgent fix while something else is in QA

1. Merge the fix to `main` with a normal pull request.
2. **Actions → Start hotfix → Run workflow** with that pull request's number. It
   reads the version production runs, cherry-picks the fix with `-x` onto
   `release/<that version>` and opens the hotfix pull request into it.
3. Review and merge the hotfix pull request.
4. Run **Deploy staging** with `release/<version>` (it gets the next version
   number), smoke-test, then **Cut release** with that version and approve.
5. Run **Deploy staging** with `main` again, so QA can continue; the notes link to
   what changed since the version QA was testing.

The fix already lives on `main`, so the release branch is never merged anywhere.
When the cherry-pick conflicts, the workflow stops and prints the two commands to
run by hand.

## Versions and branches

- Every new commit on staging gets the next version of the day: `vYYYY.MM.DD.N`
  (UTC date, N from 1), published as a pre-release. A commit that already has a
  version keeps it.
- **Cut release** ships that same version: it stops being a pre-release and
  becomes the Latest release. A version QA rejected stays a pre-release, so
  production's version numbers can skip one.
- Every release gets a branch `release/<version>` at the commit it shipped. Only
  urgent fixes go onto it, and it is never merged. (Releases before 2026-10-14 got
  their branch only when a hotfix needed one.)
- A feature that needs several stacked pull requests goes into `feature/<name>`,
  branched from `main`, and merges into `main` once it is done. `main` stays
  releasable throughout.
- `/api/version` shows each environment's commit and, on staging and production,
  its version.

## Rollback

Run **Deploy production** with an older release and its commit, so the approver sees
both. It still needs a reviewer, and only takes versions that are already released. The
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

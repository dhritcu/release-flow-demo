# release-flow-demo

A small todo app (Vercel + Supabase Postgres) that demonstrates a trunk-based
release flow: one long-lived branch, environments that point at commits, and
hotfixes that never need a backmerge.

## The model

| Environment | Runs | Moves when |
|---|---|---|
| **preview** | a pull request's head commit | that pull request gets a push |
| **development** | the tip of `main` | anything merges to `main` (automatic) |
| **staging** | one pinned commit | someone runs **Deploy staging** with a SHA |
| **production** | the commit of a `v*` tag | someone runs **Cut release**, then a reviewer approves |

`main` is the only long-lived branch. Deploying never creates a commit, so there
is nothing to merge back.

## Normal release

1. Merge pull requests to `main`. Unfinished work stays behind a flag in `flags.json`.
2. **Actions → Deploy staging → Run workflow**. The default puts the tip of
   `main` on staging and records its SHA.
3. QA tests staging. Merges to `main` keep going and never move staging.
4. **Actions → Cut release → Run workflow** with no input. It releases the
   commit staging runs, creates a `v*` tag and starts **Deploy production** for
   that tag. The pipeline always runs from `main`; only the code comes from the tag.
5. A reviewer approves the `production` environment. The workflow deploys and
   publishes release notes for everything since the previous tag.

## Hotfix when `main` is not ready to ship

```sh
git switch -c release/v2026.10.09 v2026.10.09   # start from what production runs
git cherry-pick -x <fix-sha>                   # the fix merged to main first
git push -u origin release/v2026.10.09
```

Then run **Deploy staging** with `release/v2026.10.09` and **Cut release**. The fix
already lives on `main`, so the release branch is never merged anywhere.

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

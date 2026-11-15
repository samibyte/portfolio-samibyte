# PROGRESS

**Phase:** P8 · **Next:** P7.1

Task index. `scripts/next-task.sh` reads the first unchecked line: `- [ ] <ID> <title>`.
Tick a box only when `npm run gate` printed `GATE: PASS`, the checks named in the task's **Done** passed, and the commit exists.
Append the session line to `qa/sessions.md`, not here. Completed phases P0–P6 live in `docs/PROGRESS-archive.md`.
Do not renumber. Do not delete a row. Split a hard task into `<ID>a`, `<ID>b` and insert it directly below.
Detail for each ID lives in `phases/P<n>.md` under `## <ID> <title>` — if `next-task.sh` says the heading is missing, stop and report.

## P8 Ocean overhaul (see `phases/P8.md`)
- [x] P8.0 Evidence harness
- [x] P8.1 Palette + tokens + fallback
- [x] P8.2 Sky + surface + waterline
- [x] P8.3 Refraction + caustics + rays
- [x] P8.4 Particles + marine-snow replacement
- [x] P8.5 Fauna
- [x] P8.6 Camera + vignette + grain
- [x] P8.7 Tune + evidence + final gate

## P9 Glass UI (see `phases/P9.md`)
- [x] P9.0 Contract + tokens + skill
- [x] P9.1 Chrome + content migration
- [x] P9.2 Evidence

## P7 Launch
- [ ] P7.1 Resolve content slots
- [ ] P7.2 SEO surface
- [ ] P7.3 Deploy
- [ ] P7.4 Evidence report
- [ ] P7.5 Final gate

## Blockers
None.

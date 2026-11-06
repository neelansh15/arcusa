# arcusa: instructions for Claude Code sessions

Stock terminal settled on Arc, built for ETHGlobal Mumbai. Read `PLAN.md` for the goal and facts.

## Coordination model
Two agents share this repo.
- **alle**: primary agent (runs on the server). Researches, writes ADRs, writes and prioritizes tasks.
- **laptop**: this Claude Code session on the user's laptop. Builds, tests and deploys.

The repo is the only channel between them. There is no live messaging.

## Start of every session
1. `git pull` first.
2. Read `TASKS.md` and any ADR referenced by your tasks (`docs/adr/`).
3. Work only on tasks with `Owner: laptop` and `Status: todo` or `doing`. Do not take `alle` tasks.

## Doing a task
1. Set `Status: doing` in `TASKS.md`, commit and push before starting.
2. Meet the acceptance criteria. If you hit a decision that is not covered by an ADR, stop and mark the task `blocked` with a question under Notes.
3. When done, set `Status: done` and fill in Result (what changed, links, commands to reproduce, anything unverified). Commit and push.
4. Never mark something `done` that you did not run or test. Say what was not verified.

## ADRs
- One file per decision in `docs/adr/`, numbered `NNNN-short-title.md`, from `docs/adr/0000-template.md`.
- Statuses: `proposed`, `accepted`, `rejected`, `superseded by NNNN`.
- Do not edit an accepted ADR to change the decision. Write a new ADR that supersedes it. Dated amendments appended at the end (for example a corrected fact) are allowed.
- Only follow `accepted` ADRs. A `proposed` one is a question, not a rule.

## Editing rules
- Edit only your own tasks in `TASKS.md` (plus status of tasks you are assigned). Keep one block per task to avoid merge conflicts.
- Small commits, plain messages that say what changed. Pull with rebase before pushing: `git pull --rebase`.
- Never force push. Never rewrite history.
- Commit and push your work as you go, in small steps, so nothing is lost if a session ends or the usage limit runs out. Do not hold finished work back until the end of a task.
- Do NOT add Claude or Anthropic branding anywhere: no Co-Authored-By trailers, no "Generated with" lines, in commits, PRs or files.
- Use "track" or "problem statement", never "prize", in repo docs.
- No secrets in the repo. Use `.env` (gitignored) and document variable names only.

## Facts that change fast
Circle/Arc docs, contract addresses and fees move quickly. Before relying on them, re-fetch the primary source and record the date and URL in the task Result or ADR.

# Capture Test

## Tool and model (step 1)

- **Tool:** Claude Code (CLI), running inside a VS Code native extension host.
- **Model:** `claude-sonnet-5` (Sonnet 5). Single model for the whole session — Claude Code
  does not split planning/execution across two models by default. (A `/fast` toggle would
  swap the entire loop to Opus 5; a spawned sub-agent could be given a different model
  override; neither happened here.)

## Mechanism used

Claude Code's **hooks** system, configured in the project-level `.claude/settings.json`
(committed, so it applies to anyone who opens this repo — not `~/.claude/settings.json`,
which is machine-local and not shareable).

Two events wired, both of which fire automatically with no manual trigger:

- `UserPromptSubmit` — fires on every prompt submitted, no matcher needed.
- `Stop` — fires at the end of every assistant turn.

Config file changed: [`.claude/settings.json`](.claude/settings.json), pointing both events
at two stdlib-only Python scripts:

- [`.claude/hooks/capture_prompt.py`](.claude/hooks/capture_prompt.py)
- [`.claude/hooks/capture_response.py`](.claude/hooks/capture_response.py)

Each hook receives a JSON payload on stdin. `UserPromptSubmit` carries the literal prompt
text in `prompt` (a plain string). `Stop` carries `last_assistant_message` (the turn's
final assistant text, already separated from thinking/tool-use blocks) and
`transcript_path` (the session's JSONL transcript, used as a fallback if
`last_assistant_message` is ever missing, and to resolve the model name — see below).
Per-session bookkeeping (which log file, which exchange number) lives in `.claude/state/`,
which is gitignored — it's a counter/pointer, not a log entry.

## Log file the canaries landed in

Two sessions were used, so two files:

- `.agent-logs/2026-09-07_13-23-53_bd137e2d-ba03-4a1d-bda5-b92e46c68fde.md` — **session 1**
  (this conversation).
- `.agent-logs/2026-09-07_13-28-05_80f7c16e-4ad4-4a19-b5fd-a27fe7f9ca96.md` — **session 2**
  (a second, independent Claude Code window opened in the same project folder).

### Note on session 1's canary

By the time I finished wiring the hook, session 1 was already mid-conversation — the
literal `CAPTURE TEST` line was never sent there. Instead, the very next real prompt in
that session (the full assignment brief, pasted by the user) was captured automatically,
unprompted, before either of us ran anything by hand. That's the entry pasted below for
session 1: not the literal canary string, but stronger evidence of the same thing —
automatic capture, verbatim, with no reminder needed. The literal canary string was sent
in session 2 instead, satisfying the assignment's requirement word-for-word.

## Both canary entries, pasted raw

**Session 1** — `.agent-logs/2026-09-07_13-23-53_bd137e2d-ba03-4a1d-bda5-b92e46c68fde.md`,
first exchange (real prompt, not the literal canary string — see note above):

```
[LOG_ENTRY type=PROMPT num=1 session=bd137e2d-ba03-4a1d-bda5-b92e46c68fde]
timestamp: 2026-09-07T13:23:53.842Z
model: claude-sonnet-5

Rebuild a live product in 12 hours. Better than the original if you want. That window is deliberately generous and we do not expect you to use all of it. The clock is tracked, never enforced.
The product

[azaisai.com](http://azaisai.com/)

Start by using it. Sign up and go through the flows properly, every one of them, end to end. Take screenshots as you go. Understand the product fully before you write any code.

Then rebuild it.
Before you write anything

Run through this so your agent captures its prompts and responses into the repository: 8x agent capture setup

It takes about ten minutes. Do not start building until the capture test passes, and commit the `.agent-logs/` directory as you go rather than in one lump at the end.
What you hand in

    A live link. Deployed and open, not a localhost recording.
    A public repository. With `.agent-logs/` committed in it.  ,,,,, FIRST ANALYSE IT .. SEE THEIR UI .. EXPERIENCE .. MAINLY FUNCTIONALITY BECAUSE WE ARE GOING FOR SOFTWARE DEVELOPMENT ROLE ( AI ENGINEERS ) .. SO CAPTURE EVERYTHING ... AND MAKE A IMPLEMENTATION PLAN
```

```
[LOG_ENTRY type=RESPONSE num=1 session=bd137e2d-ba03-4a1d-bda5-b92e46c68fde]
timestamp: 2026-09-07T13:24:45.110Z
model: claude-sonnet-5

Good news: the hook already fired for real on this exact message — before you even sent the literal canary text. Here's what landed automatically in [`.agent-logs/2026-09-07_13-23-53_bd137e2d-ba03-4a1d-bda5-b92e46c68fde.md`](.agent-logs/2026-09-07_13-23-53_bd137e2d-ba03-4a1d-bda5-b92e46c68fde.md):

```
[LOG_ENTRY type=PROMPT num=1 session=bd137e2d-ba03-4a1d-bda5-b92e46c68fde]
timestamp: 2026-09-07T13:23:53.842Z
model: claude-sonnet-5

Rebuild a live product in 12 hours. ... (your full message, verbatim)
```

No one ran a script, nothing was remembered — it's just there. The matching RESPONSE entry for this turn will append itself the instant I finish this reply.

That's solid proof for *this* session, but the assignment's step 4.3 is explicit: a hook that only fires in the session that created it isn't installed. I haven't proven that yet, and it's the actual hard gate before building starts. Two quick things, then I move straight into azaisai.com with no more pauses:

1. **In this chat**, send exactly: `CAPTURE TEST — 8x assignment, Khushi`
2. **Open a second, independent Claude Code session** in this same folder (new window/terminal) and send the same line there.

Once both land I'll write `CAPTURE-TEST.md` with both raw entries, commit everything, and go straight into signing up and using azaisai.com end-to-end.
```

**Session 2** — `.agent-logs/2026-09-07_13-28-05_80f7c16e-4ad4-4a19-b5fd-a27fe7f9ca96.md`,
literal canary, sent from an independent Claude Code window opened fresh in the same
project directory:

```
[LOG_ENTRY type=PROMPT num=1 session=80f7c16e-4ad4-4a19-b5fd-a27fe7f9ca96]
timestamp: 2026-09-07T13:28:05.993Z
model: unknown

CAPTURE TEST — 8x assignment, Khushi
```

```
[LOG_ENTRY type=RESPONSE num=1 session=80f7c16e-4ad4-4a19-b5fd-a27fe7f9ca96]
timestamp: 2026-09-07T13:28:12.655Z
model: unknown

It looks like your message came through as just a label — "CAPTURE TEST — 8x assignment, Khushi" — without an actual task attached. Could you clarify what you'd like me to do? For example:

- Is this testing that messages/logging are working correctly?
- Is there an assignment (8 exercises/parts?) you want me to help complete?
- Something else specific to "Khushi" as a project or file?

Let me know the actual task and I'll get started.
```

## Things that didn't work first / bugs found during verification

- **`model: unknown` in session 2.** The `UserPromptSubmit` and `Stop` hook payloads don't
  actually carry a top-level `model` field (I'd assumed they would from a subagent's
  documentation summary — wrong, verified by dumping the raw payloads). The scripts fall
  back to scanning the session's `transcript_path` JSONL for the most recent
  `message.model` field written by a prior assistant turn. For a session's very first
  prompt, no assistant turn has happened yet, so there's genuinely nothing to read yet —
  `unknown` there is an honest "not yet knowable," not a bug, and both entries above are
  left exactly as captured.
  - The real bug: in `capture_response.py`, the `Stop` handler resolved the model as
    `state.get("last_model") or guess_model_from_transcript(...)`, and since
    `state["last_model"]` was already the string `"unknown"` (a truthy value) from the
    prompt hook, it short-circuited and never even tried the transcript again — even
    though by `Stop` time the transcript usually *does* have the model by then. Fixed by
    reordering to try the transcript first, `state` second. Left the two already-written
    `unknown` entries above untouched, per "don't edit a captured entry after the fact" —
    this bug and its fix are visible in the git history instead.
- I dry-ran both hook scripts by hand with synthetic stdin JSON before wiring them up for
  real, to catch syntax/format errors before they'd show up in an actual log. That scratch
  output was deleted before any real prompt was sent (never committed).

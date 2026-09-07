#!/usr/bin/env python3
"""
UserPromptSubmit hook: fires on every prompt submitted in this project.
Appends a PROMPT entry to the session's .agent-logs/*.md file, creating
the file (with frontmatter) on the first prompt of a session.

Never blocks the prompt: any internal failure is swallowed and we exit 0.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from capture_common import (
    AUTHOR, PROJECT, TOOL, LOG_DIR,
    now_iso, read_stdin_json, dump_debug, load_state, save_state,
    guess_model_from_transcript, build_frontmatter, update_frontmatter,
)


def main():
    data, raw = read_stdin_json()
    dump_debug("prompt_raw.jsonl", raw)

    session_id = data.get("session_id", "unknown-session")
    prompt = data.get("prompt")
    if isinstance(prompt, dict):
        prompt_text = prompt.get("text", "")
    elif isinstance(prompt, str):
        prompt_text = prompt
    else:
        prompt_text = ""

    transcript_path = data.get("transcript_path")
    model = data.get("model") or guess_model_from_transcript(transcript_path) or "unknown"
    ts = now_iso()
    date = ts[:10]

    state = load_state(session_id)
    if state is None:
        num = 1
        time_part = ts[11:19].replace(":", "-")
        logfile_name = "{}_{}_{}.md".format(date, time_part, session_id)
        logfile_path = os.path.join(LOG_DIR, logfile_name)
        os.makedirs(LOG_DIR, exist_ok=True)
        fm = build_frontmatter(session_id, date, AUTHOR, model, TOOL, PROJECT, num, ts, ts)
        header = "\n# Session Log - {date}\n\nSession: `{short}` | Project: `{project}` | Author: `{author}`\n\n---\n".format(
            date=date, short=session_id.split("-")[0], project=PROJECT, author=AUTHOR
        )
        with open(logfile_path, "w") as f:
            f.write(fm + header)
        state = {"logfile": logfile_path, "num": 0, "first_prompt_time": ts}
    else:
        logfile_path = state["logfile"]
        num = state.get("num", 0) + 1

    state["num"] = num
    state["last_prompt_time"] = ts
    state["last_model"] = model
    save_state(session_id, state)

    entry = (
        "\n[LOG_ENTRY type=PROMPT num={num} session={session_id}]\n"
        "timestamp: {ts}\n"
        "model: {model}\n\n"
        "{prompt_text}\n\n"
    ).format(num=num, session_id=session_id, ts=ts, model=model, prompt_text=prompt_text)

    with open(logfile_path, "a") as f:
        f.write(entry)

    update_frontmatter(
        logfile_path,
        total_exchanges=num,
        last_prompt_time=ts,
        model=model,
        first_prompt_time=state.get("first_prompt_time", ts),
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        dump_debug("prompt_errors.log", "ERROR: {}".format(e))
    sys.exit(0)

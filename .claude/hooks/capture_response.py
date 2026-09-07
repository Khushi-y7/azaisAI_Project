#!/usr/bin/env python3
"""
Stop hook: fires at the end of every assistant turn in this project.
Appends the matching RESPONSE entry (final text only - no thinking, no
tool calls) to the same session log file the PROMPT hook created.

If no PROMPT was captured yet for this session (e.g. the hook was
installed mid-turn, so UserPromptSubmit never fired for the prompt this
turn is answering), there is nothing to pair the response with, so this
is a deliberate no-op rather than writing an orphaned entry.

Never blocks: any internal failure is swallowed and we exit 0.
"""
import sys

sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
from capture_common import (
    now_iso, read_stdin_json, dump_debug, load_state,
    extract_text_blocks, extract_last_assistant_text_from_transcript,
    guess_model_from_transcript,
)


def main():
    data, raw = read_stdin_json()
    dump_debug("stop_raw.jsonl", raw)

    session_id = data.get("session_id", "unknown-session")
    state = load_state(session_id)
    if state is None:
        # No prompt captured yet this session - nothing to pair with. Skip.
        return

    transcript_path = data.get("transcript_path")
    last_msg = data.get("last_assistant_message")
    response_text = None
    if isinstance(last_msg, dict):
        response_text = extract_text_blocks(last_msg.get("content"))
    elif isinstance(last_msg, str):
        response_text = last_msg

    if not response_text:
        response_text = extract_last_assistant_text_from_transcript(transcript_path)
    if not response_text:
        response_text = "[no final text content captured]"

    # Prefer the transcript's own record of the model actually used for this turn
    # (state["last_model"] can be stale/"unknown" if the prompt hook fired before
    # the transcript had any assistant entries yet, e.g. a session's first turn).
    model = (
        data.get("model")
        or guess_model_from_transcript(transcript_path)
        or state.get("last_model")
        or "unknown"
    )
    ts = now_iso()
    num = state.get("num", 1)
    logfile_path = state["logfile"]

    entry = (
        "\n[LOG_ENTRY type=RESPONSE num={num} session={session_id}]\n"
        "timestamp: {ts}\n"
        "model: {model}\n\n"
        "{response_text}\n\n"
        "---\n"
    ).format(num=num, session_id=session_id, ts=ts, model=model, response_text=response_text)

    with open(logfile_path, "a") as f:
        f.write(entry)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        dump_debug("stop_errors.log", "ERROR: {}".format(e))
    sys.exit(0)

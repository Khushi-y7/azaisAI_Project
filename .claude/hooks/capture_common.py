"""
Shared helpers for the .agent-logs capture hooks.

Used by capture_prompt.py (UserPromptSubmit hook) and
capture_response.py (Stop hook). Kept dependency-free (stdlib only)
so it runs with the system python3 with no install step.
"""
import json
import os
import re
import sys
from datetime import datetime, timezone

REPO_ROOT = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
LOG_DIR = os.path.join(REPO_ROOT, ".agent-logs")
STATE_DIR = os.path.join(REPO_ROOT, ".claude", "state")
DEBUG_DIR = os.path.join(STATE_DIR, "debug")

AUTHOR = "khushiyadav"
PROJECT = "azaisai_rebuild-version"
TOOL = "claude-code"


def now_iso():
    dt = datetime.now(timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + "{:03d}Z".format(dt.microsecond // 1000)


def read_stdin_json():
    raw = sys.stdin.read()
    try:
        return json.loads(raw), raw
    except Exception:
        return {}, raw


def dump_debug(name, raw):
    """Best-effort raw payload dump for debugging hook schemas. Never fatal."""
    try:
        os.makedirs(DEBUG_DIR, exist_ok=True)
        with open(os.path.join(DEBUG_DIR, name), "a") as f:
            f.write(raw + "\n---\n")
    except Exception:
        pass


def state_path(session_id):
    os.makedirs(STATE_DIR, exist_ok=True)
    return os.path.join(STATE_DIR, "{}.json".format(session_id))


def load_state(session_id):
    p = state_path(session_id)
    if os.path.exists(p):
        try:
            with open(p) as f:
                return json.load(f)
        except Exception:
            return None
    return None


def save_state(session_id, state):
    with open(state_path(session_id), "w") as f:
        json.dump(state, f)


def extract_text_blocks(content):
    """Pull only type=='text' blocks out of an Anthropic-style content array,
    skipping thinking/tool_use/tool_result blocks. Falls back to str content."""
    if isinstance(content, str):
        return content
    texts = []
    if isinstance(content, list):
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                texts.append(block.get("text", ""))
    return "\n".join(t for t in texts if t)


def extract_model(obj):
    if not isinstance(obj, dict):
        return None
    msg = obj.get("message")
    if isinstance(msg, dict) and msg.get("model"):
        return msg["model"]
    if obj.get("model"):
        return obj["model"]
    return None


def guess_model_from_transcript(transcript_path):
    """Scan the transcript JSONL from the end for the most recent model field."""
    if not transcript_path or not os.path.exists(transcript_path):
        return None
    try:
        with open(transcript_path, "r", errors="ignore") as f:
            lines = f.readlines()
        for line in reversed(lines):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except Exception:
                continue
            model = extract_model(obj)
            if model:
                return model
    except Exception:
        return None
    return None


def extract_last_assistant_text_from_transcript(transcript_path):
    """Fallback for when the Stop hook payload has no usable last_assistant_message:
    walk the transcript backward for the last assistant message's text blocks."""
    if not transcript_path or not os.path.exists(transcript_path):
        return None
    try:
        with open(transcript_path, "r", errors="ignore") as f:
            lines = f.readlines()
        for line in reversed(lines):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except Exception:
                continue
            role, content = None, None
            msg = obj.get("message") if isinstance(obj, dict) else None
            if isinstance(msg, dict):
                role = msg.get("role")
                content = msg.get("content")
            elif isinstance(obj, dict) and obj.get("type") == "assistant":
                role = "assistant"
                content = obj.get("content")
            if role == "assistant" and content:
                text = extract_text_blocks(content)
                if text:
                    return text
    except Exception:
        return None
    return None


def frontmatter_and_body(text):
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not m:
        return None, text
    return m.group(1), m.group(2)


def build_frontmatter(session_id, date, author, model, tool, project,
                       total_exchanges, first_prompt_time, last_prompt_time):
    return (
        "---\n"
        "session_id: {session_id}\n"
        "date: {date}\n"
        "author: {author}\n"
        "model: {model}\n"
        "tool: {tool}\n"
        "project: {project}\n"
        "total_exchanges: {total_exchanges}\n"
        "first_prompt_time: {first_prompt_time}\n"
        "last_prompt_time: {last_prompt_time}\n"
        "---\n"
    ).format(
        session_id=session_id, date=date, author=author, model=model, tool=tool,
        project=project, total_exchanges=total_exchanges,
        first_prompt_time=first_prompt_time, last_prompt_time=last_prompt_time,
    )


def update_frontmatter(logfile_path, **kwargs):
    with open(logfile_path) as f:
        content = f.read()
    fm, body = frontmatter_and_body(content)
    if fm is None:
        return
    new_lines = []
    for line in fm.split("\n"):
        key = line.split(":", 1)[0].strip()
        if key in kwargs and kwargs[key] is not None:
            new_lines.append("{}: {}".format(key, kwargs[key]))
        else:
            new_lines.append(line)
    new_fm = "\n".join(new_lines)
    with open(logfile_path, "w") as f:
        f.write("---\n{}\n---\n{}".format(new_fm, body))

import json
import os
from typing import List

from models import StoryItem

HISTORY_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "story_history.json")


def _read() -> List[dict]:
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def _write(data: List[dict]) -> None:
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_all() -> List[StoryItem]:
    return [StoryItem(**item) for item in _read()]


def add(item: StoryItem) -> None:
    data = _read()
    data.append(item.model_dump())
    _write(data)


def delete(story_id: str) -> bool:
    data = _read()
    filtered = [d for d in data if d.get("id") != story_id]
    if len(filtered) == len(data):
        return False
    _write(filtered)
    return True


def clear() -> None:
    _write([])

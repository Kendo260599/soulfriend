"""
core/quiz_engine.py — Quiz logic authority.
Responsible for: quiz generation, answer checking, score update.
Forbidden: UI rendering, microphone access, database schema creation.
"""

import random
import sqlite3
from typing import Optional
from app.db import repository


CORRECT_MEMORY_DELTA = 0.2   # Memory law rule #10
WRONG_MEMORY_DELTA   = 0.3   # Memory law rule #10


class QuizItem:
    """Represents a single quiz question with one correct answer and 3 distractors."""

    def __init__(
        self,
        word_id: int,
        word: str,
        ipa: str,
        correct_answer: str,
        choices: list[str],
    ):
        self.word_id = word_id
        self.word = word
        self.ipa = ipa
        self.correct_answer = correct_answer
        self.choices = choices  # 4 items total, shuffled

    def check_answer(self, selected: str) -> bool:
        return selected == self.correct_answer


def build_quiz_item(target_word: sqlite3.Row, all_words: list[sqlite3.Row]) -> Optional[QuizItem]:
    """
    Build one QuizItem for target_word.
    Distractors must be within similar CEFR range — no semantic absurdity (rule #9).
    Returns None if not enough words to build distractors.
    """
    correct_answer = target_word["meaning_vi"]
    target_cefr = target_word["cefr_level"]

    # Prefer distractors with same CEFR level first, fallback to adjacent
    cefr_order = ["A1", "A2", "B1", "B2", "C1", "C2"]
    target_idx = cefr_order.index(target_cefr) if target_cefr in cefr_order else 0
    adjacent_levels = set()
    for offset in range(len(cefr_order)):
        adjacent_levels.add(cefr_order[max(0, target_idx - offset)])
        adjacent_levels.add(cefr_order[min(len(cefr_order) - 1, target_idx + offset)])
        if len(adjacent_levels) >= 3:
            break

    # Pool: same or adjacent CEFR, not the target word itself
    pool = [
        w for w in all_words
        if w["id"] != target_word["id"] and w["cefr_level"] in adjacent_levels
    ]

    if len(pool) < 3:
        pool = [w for w in all_words if w["id"] != target_word["id"]]

    if len(pool) < 3:
        return None

    distractors = random.sample(pool, 3)
    distractor_meanings = [d["meaning_vi"] for d in distractors]

    choices = distractor_meanings + [correct_answer]
    random.shuffle(choices)

    return QuizItem(
        word_id=target_word["id"],
        word=target_word["word"],
        ipa=target_word["ipa"],
        correct_answer=correct_answer,
        choices=choices,
    )


def get_quiz_batch(batch_size: int = 10) -> list[QuizItem]:
    """
    Generate a batch of quiz items.
    Prioritizes words with lower memory_strength.
    """
    all_words = repository.get_all_words()
    if len(all_words) < 4:
        return []

    # Score each word: lower memory_strength → higher priority
    scored: list[tuple[float, sqlite3.Row]] = []
    for word in all_words:
        progress = repository.get_progress(word["id"])
        strength = progress["memory_strength"] if progress else 0.0
        scored.append((strength, word))

    # Sort ascending by strength, then shuffle within equal groups
    scored.sort(key=lambda x: x[0])
    candidates = [row for _, row in scored]

    # Build quiz items from the weakest candidates first
    items: list[QuizItem] = []
    used_ids: set[int] = set()
    for candidate in candidates:
        if len(items) >= batch_size:
            break
        if candidate["id"] in used_ids:
            continue
        item = build_quiz_item(candidate, all_words)
        if item:
            items.append(item)
            used_ids.add(candidate["id"])

    return items


def submit_answer(word_id: int, is_correct: bool) -> float:
    """
    Update memory strength after an answer. Returns new memory_strength.
    Formula from Memory Law rule #10:
        correct → +0.2
        wrong   → -0.3
    Memory stays in [0.0, 1.0].
    """
    progress = repository.get_progress(word_id)

    if progress:
        strength      = progress["memory_strength"]
        correct_count = progress["correct_count"]
        wrong_count   = progress["wrong_count"]
    else:
        strength      = 0.0
        correct_count = 0
        wrong_count   = 0

    if is_correct:
        new_strength = strength + CORRECT_MEMORY_DELTA
        correct_count += 1
    else:
        new_strength = strength - WRONG_MEMORY_DELTA
        wrong_count += 1

    new_strength = max(0.0, min(1.0, new_strength))

    # Delegate DB write + SM-2 scheduling to review_scheduler
    from app.core import review_scheduler  # lazy import avoids circular refs
    review_scheduler.schedule_after_answer(
        word_id, is_correct, new_strength, correct_count, wrong_count
    )
    return new_strength


def get_review_batch(batch_size: int = 10) -> list[QuizItem]:
    """
    Generate quiz items for words due for spaced-repetition review.
    Fetches due words via difficulty_engine, builds QuizItems the same way
    as get_quiz_batch.
    """
    from app.core import difficulty_engine  # lazy import
    due_words = difficulty_engine.get_review_words(n=batch_size + 5)
    if not due_words:
        return []

    all_words = repository.get_all_words()
    if len(all_words) < 4:
        return []

    items: list[QuizItem] = []
    used_ids: set[int] = set()
    for word in due_words:
        if len(items) >= batch_size:
            break
        if word["id"] in used_ids:
            continue
        item = build_quiz_item(word, all_words)
        if item:
            items.append(item)
            used_ids.add(word["id"])
    return items

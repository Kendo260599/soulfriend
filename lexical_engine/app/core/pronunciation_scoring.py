"""
core/pronunciation_scoring.py - Pronunciation text scoring utilities (Phase E).

Converts (target_word, recognized_text) into:
- score: integer 0..100
- feedback: human-readable coaching message
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from itertools import zip_longest


@dataclass
class PronunciationScore:
    score: int
    feedback: str
    target_normalized: str
    recognized_normalized: str
    ending_score: int
    stress_score: int
    phrase_score: int
    char_score: int


def normalize_text(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _similarity(a: str, b: str) -> float:
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def _tokenize(text: str) -> list[str]:
    return [token for token in normalize_text(text).split(" ") if token]


def _vowel_group_count(word: str) -> int:
    groups = re.findall(r"[aeiouy]+", word)
    return max(1, len(groups)) if word else 0


def _ending_similarity(target_tokens: list[str], recognized_tokens: list[str]) -> float:
    if not target_tokens:
        return 0.0

    points = 0.0
    for t_token, r_token in zip_longest(target_tokens, recognized_tokens, fillvalue=""):
        if not t_token:
            continue
        t_end = t_token[-2:] if len(t_token) >= 2 else t_token
        r_end = r_token[-2:] if len(r_token) >= 2 else r_token
        points += _similarity(t_end, r_end)
    return points / len(target_tokens)


def _stress_rhythm_similarity(target_tokens: list[str], recognized_tokens: list[str]) -> float:
    if not target_tokens:
        return 0.0

    points = 0.0
    for t_token, r_token in zip_longest(target_tokens, recognized_tokens, fillvalue=""):
        if not t_token:
            continue
        t_syl = _vowel_group_count(t_token)
        r_syl = _vowel_group_count(r_token) if r_token else 0
        gap = abs(t_syl - r_syl)
        points += max(0.0, 1.0 - (gap / max(1, t_syl)))
    return points / len(target_tokens)


def _phrase_similarity(target_tokens: list[str], recognized_tokens: list[str]) -> float:
    if not target_tokens:
        return 0.0
    if not recognized_tokens:
        return 0.0

    target_phrase = " ".join(target_tokens)
    recognized_phrase = " ".join(recognized_tokens)
    order_score = _similarity(target_phrase, recognized_phrase)

    coverage_hits = sum(1 for token in target_tokens if token in recognized_tokens)
    coverage_score = coverage_hits / len(target_tokens)
    return (order_score * 0.65) + (coverage_score * 0.35)


def score_pronunciation(target_word: str, recognized_text: str) -> PronunciationScore:
    target = normalize_text(target_word)
    recognized = normalize_text(recognized_text)

    if not target:
        return PronunciationScore(
            score=0,
            feedback="Tu muc tieu khong hop le.",
            target_normalized=target,
            recognized_normalized=recognized,
            ending_score=0,
            stress_score=0,
            phrase_score=0,
            char_score=0,
        )

    if not recognized:
        return PronunciationScore(
            score=0,
            feedback="Chua nhan dien duoc tu ban vua doc. Thu noi ro hon.",
            target_normalized=target,
            recognized_normalized=recognized,
            ending_score=0,
            stress_score=0,
            phrase_score=0,
            char_score=0,
        )

    target_tokens = _tokenize(target)
    recognized_tokens = _tokenize(recognized)

    char_score = int(round(_similarity(target, recognized) * 100))
    ending_score = int(round(_ending_similarity(target_tokens, recognized_tokens) * 100))
    stress_score = int(round(_stress_rhythm_similarity(target_tokens, recognized_tokens) * 100))
    phrase_score = int(round(_phrase_similarity(target_tokens, recognized_tokens) * 100))

    # When Whisper merges a phrase into one token (e.g. "breakup"),
    # preserve credit for phrase-level correctness instead of over-penalizing.
    if len(target_tokens) > 1:
        target_compact = "".join(target_tokens)
        recognized_compact = "".join(recognized_tokens)
        if target_compact and target_compact == recognized_compact:
            phrase_score = max(phrase_score, 90)
            ending_score = max(ending_score, 80)
            stress_score = max(stress_score, 75)

    if len(target_tokens) > 1:
        weighted = (
            (char_score * 0.30) +
            (phrase_score * 0.35) +
            (ending_score * 0.20) +
            (stress_score * 0.15)
        )
    else:
        weighted = (
            (char_score * 0.45) +
            (ending_score * 0.35) +
            (stress_score * 0.20)
        )

    score = int(round(weighted))

    if score >= 90:
        feedback = "Rat tot. Phat am gan nhu chinh xac."
    elif score >= 70:
        feedback = "Gan dung. Thu cham hon o am cuoi va giu nhip trong am deu hon."
    elif score >= 50:
        feedback = "Tam on. Can luyen them do ro am cuoi va nhip am tiet."
    else:
        feedback = "Chua dung nhieu. Hay nghe lai mau va thu lai."

    weakest = min(
        ("am cuoi", ending_score),
        ("trong am", stress_score),
        ("cum tu", phrase_score if len(target_tokens) > 1 else 100),
        key=lambda x: x[1],
    )[0]
    feedback = f"{feedback} Diem yeu nhat hien tai: {weakest}."

    return PronunciationScore(
        score=max(0, min(100, score)),
        feedback=feedback,
        target_normalized=target,
        recognized_normalized=recognized,
        ending_score=max(0, min(100, ending_score)),
        stress_score=max(0, min(100, stress_score)),
        phrase_score=max(0, min(100, phrase_score)),
        char_score=max(0, min(100, char_score)),
    )

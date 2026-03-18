"""
Enrich existing vocabulary with synonyms and structured collocations.
Uses a curated mapping approach for common words, with fallback patterns
for the remaining vocabulary.
"""
import json
import sqlite3
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1].parent))

DB_PATH = Path(__file__).resolve().parents[1] / "db" / "english_foundation.db"

# Common collocation patterns by part of speech
COLLOCATION_TEMPLATES = {
    "v": [
        "{word} + noun",
        "{word} + preposition",
        "adverb + {word}",
    ],
    "n": [
        "adjective + {word}",
        "{word} + of",
        "verb + {word}",
    ],
    "adj": [
        "be + {word}",
        "{word} + noun",
        "extremely/very + {word}",
    ],
}

# Top synonym map for ~200 very common IELTS words
SYNONYM_MAP = {
    "important": "significant, crucial, essential",
    "good": "excellent, beneficial, positive",
    "bad": "negative, harmful, detrimental",
    "big": "large, significant, substantial",
    "small": "minor, slight, minimal",
    "show": "demonstrate, indicate, reveal",
    "help": "assist, support, aid",
    "change": "alter, modify, transform",
    "use": "utilize, employ, apply",
    "make": "create, produce, generate",
    "give": "provide, offer, supply",
    "get": "obtain, acquire, receive",
    "think": "consider, believe, regard",
    "say": "state, express, mention",
    "go": "proceed, travel, move",
    "tell": "inform, notify, describe",
    "come": "arrive, approach, emerge",
    "want": "desire, wish, seek",
    "need": "require, demand, necessitate",
    "know": "understand, recognize, realize",
    "see": "observe, notice, perceive",
    "find": "discover, locate, identify",
    "take": "accept, seize, capture",
    "keep": "maintain, retain, preserve",
    "start": "begin, commence, initiate",
    "stop": "cease, halt, discontinue",
    "try": "attempt, endeavor, strive",
    "ask": "inquire, request, question",
    "work": "function, operate, perform",
    "move": "shift, transfer, relocate",
    "run": "operate, manage, execute",
    "grow": "increase, expand, develop",
    "pay": "compensate, reimburse, fund",
    "play": "participate, perform, engage",
    "live": "reside, inhabit, dwell",
    "feel": "sense, experience, perceive",
    "put": "place, position, set",
    "read": "study, examine, review",
    "write": "compose, draft, record",
    "learn": "study, acquire, master",
    "leave": "depart, abandon, exit",
    "call": "contact, summon, name",
    "turn": "rotate, shift, convert",
    "hold": "grasp, contain, maintain",
    "bring": "deliver, carry, introduce",
    "happen": "occur, take place, arise",
    "set": "establish, configure, arrange",
    "open": "unlock, reveal, launch",
    "close": "shut, seal, conclude",
    "follow": "pursue, trail, obey",
    "look": "observe, examine, appear",
    "carry": "transport, bear, convey",
    "talk": "speak, converse, discuss",
    "stand": "endure, tolerate, remain",
    "increase": "rise, grow, escalate",
    "decrease": "decline, reduce, diminish",
    "develop": "advance, evolve, progress",
    "provide": "supply, offer, furnish",
    "create": "produce, generate, design",
    "improve": "enhance, upgrade, refine",
    "support": "assist, back, advocate",
    "affect": "influence, impact, alter",
    "produce": "generate, manufacture, yield",
    "include": "contain, comprise, encompass",
    "consider": "contemplate, evaluate, ponder",
    "suggest": "propose, recommend, advise",
    "require": "demand, need, necessitate",
    "continue": "persist, proceed, resume",
    "remain": "stay, persist, endure",
    "achieve": "accomplish, attain, reach",
    "reduce": "decrease, minimize, lower",
    "establish": "create, found, set up",
    "describe": "depict, illustrate, portray",
    "explain": "clarify, elaborate, interpret",
    "receive": "obtain, get, accept",
    "allow": "permit, enable, authorize",
    "compare": "contrast, relate, evaluate",
    "discuss": "debate, examine, analyze",
    "report": "announce, state, document",
    "maintain": "preserve, sustain, uphold",
    "accept": "agree, approve, acknowledge",
    "solve": "resolve, fix, address",
    "different": "distinct, diverse, varied",
    "possible": "feasible, viable, potential",
    "available": "accessible, obtainable, ready",
    "common": "frequent, widespread, usual",
    "difficult": "challenging, complex, tough",
    "easy": "simple, straightforward, effortless",
    "similar": "alike, comparable, analogous",
    "specific": "particular, precise, exact",
    "general": "broad, overall, universal",
    "clear": "obvious, evident, transparent",
    "certain": "definite, sure, particular",
    "necessary": "essential, required, vital",
    "true": "accurate, correct, genuine",
    "able": "capable, competent, qualified",
    "likely": "probable, expected, possible",
    "large": "big, vast, extensive",
    "old": "ancient, former, aged",
    "new": "modern, recent, novel",
    "long": "extended, lengthy, prolonged",
    "great": "remarkable, outstanding, significant",
    "high": "elevated, superior, lofty",
    "low": "minimal, reduced, inferior",
    "main": "primary, chief, principal",
    "young": "youthful, junior, adolescent",
    "right": "correct, proper, appropriate",
    "late": "delayed, overdue, recent",
    "early": "initial, premature, prompt",
    "hard": "difficult, tough, demanding",
    "strong": "powerful, robust, intense",
    "weak": "feeble, fragile, vulnerable",
    "fast": "rapid, quick, swift",
    "slow": "gradual, unhurried, sluggish",
    "happy": "joyful, pleased, content",
    "sad": "unhappy, sorrowful, melancholy",
    "rich": "wealthy, affluent, prosperous",
    "poor": "impoverished, deprived, needy",
    "hot": "warm, heated, scorching",
    "cold": "chilly, freezing, frigid",
    "idea": "concept, notion, thought",
    "problem": "issue, challenge, difficulty",
    "result": "outcome, consequence, effect",
    "reason": "cause, motive, rationale",
    "answer": "response, reply, solution",
    "question": "inquiry, query, issue",
    "example": "instance, illustration, sample",
    "fact": "truth, reality, evidence",
    "part": "section, portion, component",
    "place": "location, site, area",
    "point": "aspect, detail, argument",
    "world": "globe, planet, earth",
    "area": "region, zone, district",
    "group": "team, collection, cluster",
    "system": "structure, framework, network",
    "number": "figure, quantity, amount",
    "study": "research, investigation, analysis",
    "power": "authority, strength, influence",
    "money": "funds, capital, currency",
    "water": "liquid, fluid, H2O",
    "story": "tale, narrative, account",
    "opinion": "view, perspective, belief",
    "effect": "impact, influence, consequence",
}


def enrich_vocabulary():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    # Run migration
    from english_foundation.db.bootstrap import migrate_schema
    migrate_schema(conn)

    rows = conn.execute("SELECT id, word, part_of_speech, collocation FROM vocabulary").fetchall()
    updated = 0

    for row in rows:
        word = row["word"]
        pos = (row["part_of_speech"] or "").strip().lower()
        existing_collocation = row["collocation"] or ""

        # Generate synonyms
        synonyms = SYNONYM_MAP.get(word.lower(), "")

        # Generate structured collocations
        templates = COLLOCATION_TEMPLATES.get(pos, COLLOCATION_TEMPLATES.get("n", []))
        collocations = []
        # First, keep the original collocation
        if existing_collocation and existing_collocation != f"common {word}":
            collocations.append({"phrase": existing_collocation, "type": "original"})
        # Add template-based collocations
        for tmpl in templates:
            collocations.append({"phrase": tmpl.format(word=word), "type": "pattern"})

        collocations_json = json.dumps(collocations, ensure_ascii=False)

        conn.execute(
            "UPDATE vocabulary SET synonyms = ?, collocations_json = ? WHERE id = ?",
            (synonyms, collocations_json, row["id"]),
        )
        updated += 1

    conn.commit()
    conn.close()
    print(f"Enriched {updated} vocabulary items with synonyms and collocations.")


if __name__ == "__main__":
    enrich_vocabulary()

"""
Import the Academic Word List (AWL) — 570 word families — into the English Foundation database.
Tags them with source_standard='AWL' and cefr_target='B1-B2'.
Words that already exist will be tagged as AWL without overwriting other data.
"""
import sqlite3
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1].parent))

DB_PATH = Path(__file__).resolve().parents[1] / "db" / "english_foundation.db"

# AWL Sublist 1-10 (570 headwords, the most authoritative academic vocabulary set)
AWL_WORDS = [
    # Sublist 1 (most frequent)
    "analyse", "approach", "area", "assess", "assume", "authority", "available", "benefit",
    "concept", "consist", "constitute", "context", "contract", "create", "data", "define",
    "derive", "distribute", "economy", "environment", "establish", "estimate", "evident",
    "export", "factor", "finance", "formula", "function", "identify", "income", "indicate",
    "individual", "interpret", "involve", "issue", "labour", "legal", "legislate", "major",
    "method", "occur", "percent", "period", "policy", "principle", "proceed", "process",
    "require", "research", "respond", "role", "section", "sector", "significant", "similar",
    "source", "specific", "structure", "theory", "vary",
    # Sublist 2
    "achieve", "acquire", "administrate", "affect", "appropriate", "aspect", "assist",
    "category", "chapter", "commission", "community", "complex", "compute", "conclude",
    "conduct", "consequent", "construct", "consume", "credit", "culture", "design",
    "distinct", "element", "equate", "evaluate", "feature", "final", "focus", "impact",
    "injure", "institute", "invest", "item", "journal", "maintain", "normal", "obtain",
    "participate", "perceive", "positive", "potential", "previous", "primary", "purchase",
    "range", "region", "regulate", "relevant", "reside", "resource", "restrict", "secure",
    "seek", "select", "site", "strategy", "survey", "text", "tradition", "transfer",
    # Sublist 3
    "alternative", "circumstance", "comment", "compensate", "component", "consent",
    "considerable", "constant", "constrain", "contribute", "convene", "coordinate",
    "core", "corporate", "correspond", "criteria", "deduce", "demonstrate", "document",
    "dominate", "emphasise", "ensure", "exclude", "framework", "fund", "illustrate",
    "immigrate", "imply", "initial", "instance", "interact", "justify", "layer", "link",
    "locate", "maximise", "minor", "negate", "outcome", "partner", "philosophy",
    "physical", "proportion", "publish", "react", "register", "rely", "remove", "scheme",
    "sequence", "sex", "shift", "specify", "sufficient", "task", "technical", "technique",
    "technology", "valid", "volume",
    # Sublist 4
    "access", "adequate", "annual", "apparent", "approximate", "attitude", "attribute",
    "civil", "code", "commit", "communicate", "concentrate", "confer", "contrast", "cycle",
    "debate", "despite", "dimension", "domestic", "emerge", "error", "ethnic", "goal",
    "grant", "hence", "hypothesis", "implement", "implicate", "impose", "integrate",
    "internal", "investigate", "job", "label", "mechanism", "obvious", "occupy", "option",
    "output", "overall", "parallel", "parameter", "phase", "predict", "principal",
    "prior", "professional", "project", "promote", "regime", "resolve", "retain",
    "series", "statistic", "status", "stress", "subsequent", "sum", "summary",
    "undertake",
    # Sublist 5
    "academic", "adjust", "alter", "amend", "aware", "capacity", "challenge", "clause",
    "compound", "conflict", "consult", "contact", "decline", "discrete", "draft",
    "enable", "energy", "enforce", "entity", "equivalent", "evolve", "expand", "expose",
    "external", "facilitate", "fundamental", "generate", "generation", "image",
    "liberal", "licence", "logic", "margin", "medical", "mental", "modify", "monitor",
    "network", "notion", "objective", "orient", "perspective", "precise", "prime",
    "psychology", "pursue", "ratio", "reject", "revenue", "stable", "style",
    "substitute", "sustain", "symbol", "target", "transit", "trend", "version",
    "welfare",
    # Sublist 6
    "abstract", "accurate", "acknowledge", "aggregate", "allocate", "assign", "attach",
    "author", "bond", "brief", "capable", "cite", "cooperate", "discriminate", "display",
    "diverse", "domain", "edit", "enhance", "estate", "exceed", "expert", "explicit",
    "federal", "fee", "flexible", "furthermore", "gender", "ignorant", "incentive",
    "incidence", "incorporate", "index", "inhibit", "initiate", "input", "instruct",
    "intelligence", "interval", "lecture", "migrate", "minimum", "ministry", "motive",
    "neutral", "nonetheless", "overseas", "precede", "presume", "rational", "recover",
    "reveal", "scope", "subsidy", "tape", "trace", "transform", "transport", "underlie",
    "utility",
    # Sublist 7
    "adapt", "adult", "advocate", "aid", "channel", "chemical", "classic", "comprehensive",
    "comprise", "confirm", "contrary", "convert", "couple", "decade", "definite", "deny",
    "differentiate", "dispose", "dynamic", "eliminate", "empirical", "equip", "extract",
    "file", "finite", "foundation", "globe", "grade", "guarantee", "hierarchy",
    "identical", "ideology", "infer", "innovate", "insert", "intervene", "isolate",
    "media", "mode", "paradigm", "phenomenon", "priority", "prohibit", "publication",
    "quote", "release", "reverse", "simulate", "sole", "somewhat", "submit",
    "successor", "survive", "thesis", "topic", "transmit", "ultimate", "unique",
    "visible", "voluntary",
    # Sublist 8
    "abandon", "accompany", "accumulate", "ambiguous", "append", "appreciate",
    "arbitrary", "automate", "bias", "chart", "clarify", "commodity", "complement",
    "conform", "contemporary", "contradict", "crucial", "currency", "denote", "detect",
    "deviate", "displace", "drama", "eventual", "exhibit", "exploit", "fluctuate",
    "guideline", "highlight", "implicit", "induce", "inevitable", "infrastructure",
    "inspect", "intense", "manipulate", "minimise", "nuclear", "offset", "paragraph",
    "plus", "practitioner", "predominant", "prospect", "radical", "random", "reinforce",
    "restore", "revise", "schedule", "tense", "terminate", "theme", "thereby",
    "uniform", "vehicle", "via", "virtual", "visual", "widespread",
    # Sublist 9
    "accommodate", "analogy", "anticipate", "assure", "attain", "behalf", "bulk",
    "cease", "coherent", "coincide", "commence", "compatible", "concurrent", "confine",
    "controversy", "converse", "device", "devote", "diminish", "distort", "duration",
    "erode", "ethic", "format", "found", "inherent", "insight", "integral", "intermediate",
    "manual", "mature", "mediate", "medium", "military", "minimal", "mutual", "norm",
    "overlap", "passive", "portion", "preliminary", "protocol", "qualitative",
    "refine", "relax", "restrain", "revolution", "rigid", "route", "scenario",
    "sphere", "subordinate", "supplement", "suspend", "team", "temporary", "trigger",
    "unify", "violate", "vision",
    # Sublist 10
    "adjacent", "albeit", "assemble", "collapse", "colleague", "compile", "conceive",
    "convince", "depress", "encounter", "enormous", "forthcoming", "incline", "integrity",
    "intrinsic", "invoke", "levy", "likewise", "nonetheless", "notwithstanding",
    "odd", "ongoing", "panel", "persist", "pose", "reluctant", "so-called",
    "straightforward", "undergo", "whereby",
]

def import_awl():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    from english_foundation.db.bootstrap import migrate_schema
    migrate_schema(conn)

    inserted = 0
    tagged = 0

    for word in AWL_WORDS:
        word_lower = word.strip().lower()
        if not word_lower:
            continue

        row = conn.execute("SELECT id, source_standard FROM vocabulary WHERE word = ?", (word_lower,)).fetchone()
        if row:
            # Tag existing word as AWL if not already
            current_source = row["source_standard"] or ""
            if "AWL" not in current_source:
                new_source = f"{current_source},AWL" if current_source else "AWL"
                conn.execute("UPDATE vocabulary SET source_standard = ?, cefr_target = 'B1-B2' WHERE id = ?",
                             (new_source, row["id"]))
                tagged += 1
        else:
            conn.execute("""
                INSERT INTO vocabulary 
                (word, ipa, meaning_vi, difficulty, example_sentence, collocation, topic_ielts, cefr_target, source_standard)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (word_lower, "", "Academic vocabulary", 3, f"Example using {word_lower}.",
                  f"academic {word_lower}", "Academic", "B1-B2", "AWL"))
            inserted += 1

    conn.commit()
    conn.close()
    print(f"AWL Import complete! Inserted {inserted} new words. Tagged {tagged} existing words as AWL.")


if __name__ == "__main__":
    import_awl()

"""
Seed 3 more IELTS Listening Part 1 sections:
  Section 3 — Library Membership
  Section 4 — Airport Lost Property
  Section 5 — Gym Membership
"""
import sqlite3
import pathlib
from gtts import gTTS

ROOT_DIR = pathlib.Path(__file__).parent.parent.parent
DB_PATH = ROOT_DIR / "english_foundation" / "db" / "english_foundation.db"
AUDIO_DIR = ROOT_DIR / "frontend" / "public" / "audio"

AUDIO_DIR.mkdir(parents=True, exist_ok=True)

def gen(text: str, filename: str) -> str:
    print(f"  Generating {filename} ...")
    tts = gTTS(text=text, lang='en', tld='co.uk')
    tts.save(AUDIO_DIR / filename)
    return f"/audio/{filename}"

def seed():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # ── Section 3: Library Membership ────────────────────────────────────
    s3_script = """
    Librarian: Good afternoon. Welcome to Greenfield Public Library. Are you here to register for a library card?
    Visitor: Yes, I'd like to become a member, please.
    Librarian: Wonderful. I just need a few details from you. Could I have your full name?
    Visitor: Sure. My first name is Michael, and my surname is Henderson. That's H-E-N-D-E-R-S-O-N.
    Librarian: Thank you, Michael. And what's your date of birth?
    Visitor: The 3rd of September, 1995.
    Librarian: Got it. Do you have an email address we can use for notifications?
    Visitor: Yes, it's michael dot henderson at gmail dot com.
    Librarian: M-I-C-H-A-E-L dot henderson at gmail dot com. And what is your home address?
    Visitor: I live at 27 Oak Lane, Greenfield.
    Librarian: Lovely. Your membership card will be ready in about ten minutes. You can borrow up to six books at a time.
    Visitor: That's great, thank you.
    """
    s3_url = gen(s3_script, "library_membership.mp3")
    cur.execute(
        "INSERT INTO listening_sections (part_num, title, context_description, audio_url, audio_script, duration_seconds) VALUES (?,?,?,?,?,?)",
        (1, "Library Membership", "A visitor registering for a public library card.", s3_url, s3_script, 65)
    )
    s3_id = cur.lastrowid
    for i, (prompt, regex) in enumerate([
        ("Visitor's First Name:", r"^(?i)(Michael)$"),
        ("Visitor's Surname:", r"^(?i)(Henderson)$"),
        ("Date of Birth:", r"^(?i)(3rd of September|3 September|September 3)$"),
        ("Email Address:", r"^(?i)(michael\.?henderson@gmail\.com|michael dot henderson at gmail dot com)$"),
        ("Home Address — Street:", r"^(?i)(Oak Lane|27 Oak Lane)$"),
        ("Maximum Books to Borrow:", r"^(?i)(6|six)$"),
    ], start=1):
        cur.execute(
            "INSERT INTO listening_questions (section_id, question_num, question_type, prompt, correct_answer_regex) VALUES (?,?,?,?,?)",
            (s3_id, i, "form_completion", prompt, regex)
        )

    # ── Section 4: Airport Lost Property ─────────────────────────────────
    s4_script = """
    Officer: Good evening. Airport Lost Property office. How can I help you?
    Passenger: Hello. I think I've lost my bag. I left it at the departure gate.
    Officer: I'm sorry to hear that, sir. Let me take down the details. Which flight were you on?
    Passenger: I was on flight BA 2-4-7 to Madrid.
    Officer: BA 247. And which gate was that?
    Passenger: Gate 15.
    Officer: Okay. Can you describe the bag for me?
    Passenger: It's a small black leather backpack. It has a silver zip on the front pocket.
    Officer: A black leather backpack with a silver zip. Is there anything valuable inside?
    Passenger: Yes, there's a laptop and a pair of sunglasses. Oh, and my passport is in the side pocket.
    Officer: Understood. Could I have your full name for the report?
    Passenger: It's James Crawford. That's C-R-A-W-F-O-R-D.
    Officer: And a contact number?
    Passenger: 07456 321 890.
    Officer: Thank you, Mr. Crawford. We'll contact you as soon as we locate it.
    """
    s4_url = gen(s4_script, "airport_lost_property.mp3")
    cur.execute(
        "INSERT INTO listening_sections (part_num, title, context_description, audio_url, audio_script, duration_seconds) VALUES (?,?,?,?,?,?)",
        (1, "Airport Lost Property", "A passenger reporting a lost bag at the airport.", s4_url, s4_script, 75)
    )
    s4_id = cur.lastrowid
    for i, (prompt, regex) in enumerate([
        ("Flight Number:", r"^(?i)(BA\s?247|BA 2-4-7)$"),
        ("Gate Number:", r"^(?i)(15|gate 15)$"),
        ("Bag Description — Colour:", r"^(?i)(black)$"),
        ("Bag Description — Material:", r"^(?i)(leather)$"),
        ("Valuable Item 1:", r"^(?i)(laptop|a laptop)$"),
        ("Passenger's Surname:", r"^(?i)(Crawford)$"),
        ("Contact Number:", r"^(?i)(07456\s?321\s?890|07456321890)$"),
    ], start=1):
        cur.execute(
            "INSERT INTO listening_questions (section_id, question_num, question_type, prompt, correct_answer_regex) VALUES (?,?,?,?,?)",
            (s4_id, i, "form_completion", prompt, regex)
        )

    # ── Section 5: Gym Membership ────────────────────────────────────────
    s5_script = """
    Receptionist: Hello! Welcome to FitLife Gym. Are you interested in joining?
    Customer: Yes, I am. I've just moved to the area and I'm looking for a gym.
    Receptionist: Great! We have three membership plans. The Basic plan is 25 pounds per month and gives you access to the gym floor. The Standard plan is 40 pounds and includes group classes. And the Premium plan is 60 pounds with personal training sessions.
    Customer: I think I'll go with the Standard plan. I enjoy group classes.
    Receptionist: Excellent choice. Could I have your name, please?
    Customer: Yes, I'm Emma Watson. That's W-A-T-S-O-N.
    Receptionist: And a contact email?
    Customer: It's emma dot watson at outlook dot com.
    Receptionist: How would you like to pay? We accept bank transfer, credit card, or direct debit.
    Customer: Direct debit, please.
    Receptionist: Perfect. Your membership starts from next Monday, the 22nd of April. The gym opens at 6 a.m. and closes at 10 p.m.
    Customer: Wonderful. Thank you!
    """
    s5_url = gen(s5_script, "gym_membership.mp3")
    cur.execute(
        "INSERT INTO listening_sections (part_num, title, context_description, audio_url, audio_script, duration_seconds) VALUES (?,?,?,?,?,?)",
        (1, "Gym Membership", "A customer signing up for a gym membership.", s5_url, s5_script, 70)
    )
    s5_id = cur.lastrowid
    for i, (prompt, regex) in enumerate([
        ("Plan Chosen:", r"^(?i)(Standard|the Standard plan|Standard plan)$"),
        ("Monthly Cost:", r"^(?i)(40|40 pounds|\£40)$"),
        ("Customer's Surname:", r"^(?i)(Watson)$"),
        ("Payment Method:", r"^(?i)(direct debit)$"),
        ("Start Date:", r"^(?i)(22nd of April|22 April|April 22)$"),
        ("Gym Opening Time:", r"^(?i)(6\s?a\.?m\.?|6:00|6 am)$"),
    ], start=1):
        cur.execute(
            "INSERT INTO listening_questions (section_id, question_num, question_type, prompt, correct_answer_regex) VALUES (?,?,?,?,?)",
            (s5_id, i, "form_completion", prompt, regex)
        )

    conn.commit()
    conn.close()
    print("Done! 3 new sections seeded.")

if __name__ == "__main__":
    seed()

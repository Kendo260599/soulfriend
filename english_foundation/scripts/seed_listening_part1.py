import os
import sqlite3
import pathlib
from gtts import gTTS
import time

ROOT_DIR = pathlib.Path(__file__).parent.parent.parent
DB_PATH = ROOT_DIR / "english_foundation" / "db" / "english_foundation.db"
AUDIO_DIR = ROOT_DIR / "frontend" / "public" / "audio"

def ensure_audio_dir():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

def generate_audio(text: str, filename: str) -> str:
    """Generates MP3 using gTTS and returns the web-accessible URL path."""
    filepath = AUDIO_DIR / filename
    print(f"Generating audio for {filename}...")
    
    # We speak it slowly to mimic IELTS Part 1 pacing (or we use standard and rely on the UI speed control)
    tts = gTTS(text=text, lang='en', tld='co.uk') # British accent
    tts.save(filepath)
    
    # Return the path relative to the public directory for the frontend audio src
    return f"/audio/{filename}"

def seed_database():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Clear old listening mock data if it exists
    cursor.execute("DELETE FROM listening_sections")
    cursor.execute("DELETE FROM listening_questions")

    # ==========================================
    # Section 1: Hotel Booking
    # ==========================================
    s1_title = "Hotel Booking Enquiry"
    s1_context = "A phone conversation between a hotel receptionist and a customer wishing to book a room."
    
    s1_script = """
    Receptionist: Good morning, Grand Plaza Hotel, Reception speaking. How can I help you?
    Caller: Hello. I'd like to book a double room for next weekend, please.
    Receptionist: Certainly, sir. For which dates exactly?
    Caller: That would be arriving on Friday the 15th of June, and checking out on Sunday the 17th.
    Receptionist: Let me check our availability. Yes, we have standard double rooms available. Could I have your name, please?
    Caller: Yes, my surname is Smith. That's S-M-I-T-H. And my first name is David.
    Receptionist: Thank you, Mr. Smith. And could I take a contact phone number?
    Caller: Sure, my mobile number is 07789 556 432.
    Receptionist: 07789 556 432. Great. Do you have any special requirements for the room?
    Caller: Yes, please. Could we have a room with a view of the sea? Oh, and we need a cot for our baby.
    Receptionist: A sea view and a baby cot. Noted. Your booking reference is GP992.
    Caller: Thank you very much!
    """

    s1_audio_url = generate_audio(s1_script, "hotel_booking.mp3")

    cursor.execute(
        """
        INSERT INTO listening_sections (part_num, title, context_description, audio_url, audio_script, duration_seconds)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (1, s1_title, s1_context, s1_audio_url, s1_script, 70) 
    )
    s1_id = cursor.lastrowid

    s1_questions = [
        ("form_completion", "Customer's First Name:", "^(?i)(David)$"),
        ("form_completion", "Customer's Surname:", "^(?i)(Smith)$"),
        ("form_completion", "Arrival Date:", "^(?i)(15th of June|15 June)$"),
        ("form_completion", "Contact Phone Number:", "^(?i)(07789\\s?556\\s?432|07789556432)$"),
        ("form_completion", "Special Requirement 1:", "^(?i)(sea|sea view|view of the sea)$"),
        ("form_completion", "Special Requirement 2 Needs a:", "^(?i)(cot|baby cot)$"),
    ]

    for i, (q_type, prompt, regex) in enumerate(s1_questions, start=1):
        cursor.execute(
            """
            INSERT INTO listening_questions (section_id, question_num, question_type, prompt, correct_answer_regex)
            VALUES (?, ?, ?, ?, ?)
            """,
            (s1_id, i, q_type, prompt, regex)
        )

    # ==========================================
    # Section 2: Clinic Registration
    # ==========================================
    s2_title = "Clinic Registration"
    s2_context = "A patient registering at a new local clinic."
    
    s2_script = """
    Receptionist: Good afternoon, Riverside Clinic. Are you here to register as a new patient?
    Patient: Yes, I am. I just moved to the area.
    Receptionist: Welcome! I just need to take some details from you. What's your full name?
    Patient: It's Sarah Thompson. Thompson is spelt T-H-O-M-P-S-O-N.
    Receptionist: Excellent. And what is your current address?
    Patient: I live at 42 Willow Street, that's W-I-L-L-O-W Street. The postcode is DE4 9HR.
    Receptionist: DE4 9HR, got it. What is your occupation, Sarah?
    Patient: I work as a dentist.
    Receptionist: A dentist, okay. Do you have any previous medical conditions we should know about?
    Patient: Yes, I suffer from asthma. I’ve had it since I was a child.
    Receptionist: Asthma, noted. We will register your details on the system. Someone will call you next week for an initial checkup.
    Patient: Thank you.
    """

    s2_audio_url = generate_audio(s2_script, "clinic_registration.mp3")

    cursor.execute(
        """
        INSERT INTO listening_sections (part_num, title, context_description, audio_url, audio_script, duration_seconds)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (1, s2_title, s2_context, s2_audio_url, s2_script, 60)
    )
    s2_id = cursor.lastrowid

    s2_questions = [
        ("form_completion", "Patient's Surname:", "^(?i)(Thompson)$"),
        ("form_completion", "Street Name:", "^(?i)(Willow|Willow Street)$"),
        ("form_completion", "Postcode:", "^(?i)(DE4\\s?9HR|DE49HR)$"),
        ("form_completion", "Occupation:", "^(?i)(dentist|a dentist)$"),
        ("form_completion", "Previous Medical Condition:", "^(?i)(asthma)$"),
    ]

    for i, (q_type, prompt, regex) in enumerate(s2_questions, start=1):
        cursor.execute(
            """
            INSERT INTO listening_questions (section_id, question_num, question_type, prompt, correct_answer_regex)
            VALUES (?, ?, ?, ?, ?)
            """,
            (s2_id, i, q_type, prompt, regex)
        )

    conn.commit()
    conn.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    ensure_audio_dir()
    seed_database()

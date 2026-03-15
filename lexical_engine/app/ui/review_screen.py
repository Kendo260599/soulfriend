"""
ui/review_screen.py — Review mode screen widget.

Displays quiz items for words due for spaced-repetition review.
Adds a review-mode badge and shows current interval so users understand
the spaced-repetition schedule.

Forbidden: SQL, scoring logic, memory calculation.
"""
from __future__ import annotations

import tkinter as tk
from tkinter import font as tkfont
from typing import Callable


class ReviewScreen(tk.Frame):
    """
    Review Mode variant of the quiz widget.
    Shows a '🔁 ÔN TẬP' banner and the word's current repeat interval.
    Answer flow is identical to QuizScreen.
    """

    CHOICE_COLORS = {
        "default": {"bg": "#2D2D44", "fg": "#E8E8F0", "active_bg": "#3D3D5C"},
        "correct": {"bg": "#1A5C3A", "fg": "#FFFFFF", "active_bg": "#1A5C3A"},
        "wrong":   {"bg": "#7A2020", "fg": "#FFFFFF", "active_bg": "#7A2020"},
    }

    def __init__(
        self,
        parent: tk.Widget,
        on_answered: Callable[[bool], None],
        on_speak: Callable[[str, str], None] | None = None,
    ):
        super().__init__(parent, bg="#1A1A2E")
        self._on_answered = on_answered
        self._on_speak = on_speak
        self._choice_buttons: list[tk.Button] = []
        self._correct_answer: str = ""
        self._current_word: str = ""
        self._audio_speed_var = tk.StringVar(value="normal")
        self._answered = False
        self._build_ui()

    def _build_ui(self) -> None:
        badge_font = tkfont.Font(family="Segoe UI", size=10, weight="bold")
        info_font  = tkfont.Font(family="Segoe UI", size=10)
        word_font  = tkfont.Font(family="Segoe UI", size=30, weight="bold")
        ipa_font   = tkfont.Font(family="Segoe UI", size=13)
        btn_font   = tkfont.Font(family="Segoe UI", size=14)

        # Review mode banner
        banner = tk.Frame(self, bg="#1E1040", pady=6)
        banner.pack(fill="x")
        tk.Label(
            banner, text="🔁  ÔN TẬP  —  Spaced Repetition",
            bg="#1E1040", fg="#9977FF", font=badge_font
        ).pack()

        # Progress indicator
        self._lbl_progress = tk.Label(
            self, text="", bg="#1A1A2E", fg="#8888AA", font=info_font
        )
        self._lbl_progress.pack(pady=(10, 0))

        # Interval context: "Đã học N ngày trước"
        self._lbl_interval = tk.Label(
            self, text="", bg="#1A1A2E", fg="#6666A0", font=info_font
        )
        self._lbl_interval.pack()

        # Word
        self._lbl_word = tk.Label(
            self, text="", bg="#1A1A2E", fg="#FFFFFF", font=word_font
        )
        self._lbl_word.pack(pady=(10, 0))

        # IPA
        self._lbl_ipa = tk.Label(
            self, text="", bg="#1A1A2E", fg="#7878BB", font=ipa_font
        )
        self._lbl_ipa.pack(pady=(2, 18))

        # Audio controls for review mode
        audio_frame = tk.Frame(self, bg="#1A1A2E")
        audio_frame.pack(pady=(0, 12))

        tk.Button(
            audio_frame,
            text="🔊 Nghe phát âm",
            font=tkfont.Font(family="Segoe UI", size=10, weight="bold"),
            bg="#25306A", fg="#DDE2FF",
            activebackground="#304084", activeforeground="#FFFFFF",
            relief="flat", bd=0, cursor="hand2", padx=10, pady=6,
            command=self._on_speak_click,
        ).grid(row=0, column=0, padx=(0, 10))

        tk.Radiobutton(
            audio_frame,
            text="Normal",
            variable=self._audio_speed_var,
            value="normal",
            bg="#1A1A2E", fg="#AAB0D8",
            selectcolor="#1A1A2E",
            activebackground="#1A1A2E", activeforeground="#FFFFFF",
            font=tkfont.Font(family="Segoe UI", size=10),
        ).grid(row=0, column=1)

        tk.Radiobutton(
            audio_frame,
            text="Slow",
            variable=self._audio_speed_var,
            value="slow",
            bg="#1A1A2E", fg="#AAB0D8",
            selectcolor="#1A1A2E",
            activebackground="#1A1A2E", activeforeground="#FFFFFF",
            font=tkfont.Font(family="Segoe UI", size=10),
        ).grid(row=0, column=2)

        # Answer choices
        choices_frame = tk.Frame(self, bg="#1A1A2E")
        choices_frame.pack(pady=8, padx=30, fill="x")

        colors = self.CHOICE_COLORS["default"]
        for i in range(4):
            btn = tk.Button(
                choices_frame,
                text="",
                font=btn_font,
                bg=colors["bg"], fg=colors["fg"],
                activebackground=colors["active_bg"],
                activeforeground=colors["fg"],
                relief="flat", bd=0, cursor="hand2",
                padx=10, pady=14, wraplength=500,
                command=lambda idx=i: self._on_choice_click(idx),
            )
            btn.pack(fill="x", pady=5)
            self._choice_buttons.append(btn)

        # Feedback label
        self._lbl_feedback = tk.Label(
            self, text="", bg="#1A1A2E", fg="#AAAACC", font=ipa_font
        )
        self._lbl_feedback.pack(pady=(10, 0))

    def load_item(
        self,
        word: str,
        ipa: str,
        choices: list[str],
        correct_answer: str,
        progress_text: str = "",
        interval_days: int = 0,
    ) -> None:
        """Populate the screen with a review quiz item and reset all state."""
        self._correct_answer = correct_answer
        self._current_word = word
        self._answered = False

        self._lbl_progress.config(text=progress_text)
        self._lbl_word.config(text=word)
        self._lbl_ipa.config(text=ipa)
        self._lbl_feedback.config(text="")

        if interval_days > 0:
            self._lbl_interval.config(text=f"Chu kỳ ôn tập: {interval_days} ngày")
        else:
            self._lbl_interval.config(text="Lần ôn tập đầu tiên")

        colors = self.CHOICE_COLORS["default"]
        for i, btn in enumerate(self._choice_buttons):
            label = choices[i] if i < len(choices) else ""
            btn.config(
                text=label,
                bg=colors["bg"], fg=colors["fg"],
                activebackground=colors["active_bg"],
                state="normal",
            )

    def _on_choice_click(self, idx: int) -> None:
        """Handle answer selection — colour feedback then fire callback."""
        if self._answered:
            return
        self._answered = True

        selected = self._choice_buttons[idx].cget("text")
        is_correct = selected == self._correct_answer

        for btn in self._choice_buttons:
            btn.config(state="disabled")
            if btn.cget("text") == self._correct_answer:
                c = self.CHOICE_COLORS["correct"]
                btn.config(bg=c["bg"], fg=c["fg"])
            elif btn == self._choice_buttons[idx] and not is_correct:
                c = self.CHOICE_COLORS["wrong"]
                btn.config(bg=c["bg"], fg=c["fg"])

        if is_correct:
            self._lbl_feedback.config(text="✓ Chính xác!", fg="#4CAF50")
        else:
            self._lbl_feedback.config(
                text=f"✗ Đáp án đúng: {self._correct_answer}", fg="#EF5350"
            )

        self.after(1200, lambda: self._on_answered(is_correct))

    def _on_speak_click(self) -> None:
        """Ask parent layer to play current word audio at selected speed."""
        if self._on_speak is None or not self._current_word:
            return
        self._on_speak(self._current_word, self._audio_speed_var.get())

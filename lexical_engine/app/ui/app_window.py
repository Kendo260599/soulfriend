"""
ui/app_window.py  Main application window.
Responsible for: screen layout, screen switching, audio trigger feedback.
Forbidden: direct SQL queries, score algorithms, memory calculation.
"""

import tkinter as tk
from tkinter import font as tkfont

from app.api import lexical_service, progress_service, recommendation_service
from app.db.schema import create_tables
from app.db.seed_loader import load_seed
from app.speech import audio_player
from app.speech.recorder import LocalRecorder
from app.speech.whisper_engine import WhisperEngine
from app.ui.pronunciation_screen import PronunciationScreen
from app.ui.progress_screen import ProgressScreen
from app.ui.quiz_screen import QuizScreen
from app.ui.review_screen import ReviewScreen


class AppWindow(tk.Tk):
    """Root application window. Owns all screens and manages transitions."""

    def __init__(self):
        super().__init__()
        self.title("SoulFriend Lexical Engine")
        self.geometry("700x580")
        self.resizable(True, True)
        self.configure(bg="#1A1A2E")

        self._quiz_batch: list[dict] = []
        self._current_idx: int = 0
        self._session_correct: int = 0
        self._session_total: int = 0
        self._session_mode: str = "learn"  # "learn" | "review"
        self._recorder = LocalRecorder()
        self._whisper_engine = WhisperEngine(model_size="base", language="en")

        self._build_ui()
        self._show_home()

    # ------------------------------------------------------------------ #
    # UI construction                                                     #
    # ------------------------------------------------------------------ #

    def _build_ui(self) -> None:
        header_font = tkfont.Font(family="Segoe UI", size=22, weight="bold")
        body_font = tkfont.Font(family="Segoe UI", size=12)
        btn_font = tkfont.Font(family="Segoe UI", size=13, weight="bold")
        small_font = tkfont.Font(family="Segoe UI", size=10)

        # ---- HOME SCREEN ----
        self._frame_home = tk.Frame(self, bg="#1A1A2E")

        tk.Label(
            self._frame_home,
            text="SoulFriend",
            bg="#1A1A2E",
            fg="#7878EE",
            font=header_font,
        ).pack(pady=(50, 4))

        tk.Label(
            self._frame_home,
            text="Lexical Engine",
            bg="#1A1A2E",
            fg="#FFFFFF",
            font=tkfont.Font(family="Segoe UI", size=16),
        ).pack()

        tk.Label(
            self._frame_home,
            text="Học từ vựng tiếng Anh",
            bg="#1A1A2E",
            fg="#8888AA",
            font=body_font,
        ).pack(pady=(8, 40))

        self._lbl_status = tk.Label(
            self._frame_home,
            text="",
            bg="#1A1A2E",
            fg="#AAAACC",
            font=small_font,
        )
        self._lbl_status.pack()

        self._home_summary_card = tk.Frame(
            self._frame_home,
            bg="#20203A",
            bd=0,
            highlightthickness=1,
            highlightbackground="#34345A",
        )
        self._home_summary_card.pack(fill="x", padx=70, pady=(12, 8))

        self._lbl_today_mission = tk.Label(
            self._home_summary_card,
            text="",
            bg="#20203A",
            fg="#DDE2FF",
            font=tkfont.Font(family="Segoe UI", size=10, weight="bold"),
            justify="left",
            anchor="w",
        )
        self._lbl_today_mission.pack(fill="x", padx=12, pady=(10, 4))

        self._lbl_next_lesson = tk.Label(
            self._home_summary_card,
            text="",
            bg="#20203A",
            fg="#BFC7ED",
            font=tkfont.Font(family="Segoe UI", size=10),
            justify="left",
            anchor="w",
            wraplength=540,
        )
        self._lbl_next_lesson.pack(fill="x", padx=12, pady=2)

        self._lbl_review_due_hint = tk.Label(
            self._home_summary_card,
            text="",
            bg="#20203A",
            fg="#A8B2E0",
            font=tkfont.Font(family="Segoe UI", size=9),
            justify="left",
            anchor="w",
        )
        self._lbl_review_due_hint.pack(fill="x", padx=12, pady=(2, 10))

        btn_grid = tk.Frame(self._frame_home, bg="#1A1A2E")
        btn_grid.pack(pady=16)

        button_specs = [
            ("Học mới", "#3344BB", "#4455CC", self._start_quiz),
            ("Ôn tập", "#2A3A7A", "#3A4A8A", self._start_review),
            ("Phát âm", "#2A3A7A", "#3A4A8A", self._show_pronunciation),
            ("Tiến trình", "#2A3A7A", "#3A4A8A", self._show_progress),
        ]
        for idx, (label, bg, hover, cmd) in enumerate(button_specs):
            tk.Button(
                btn_grid,
                text=label,
                font=tkfont.Font(family="Segoe UI", size=12, weight="bold"),
                bg=bg,
                fg="#CCCCFF" if cmd else "#555577",
                activebackground=hover,
                activeforeground="#FFFFFF",
                relief="flat",
                bd=0,
                cursor="hand2" if cmd else "arrow",
                padx=16,
                pady=14,
                width=14,
                state="normal" if cmd else "disabled",
                command=cmd if cmd else (lambda: None),
            ).grid(row=idx // 2, column=idx % 2, padx=8, pady=8)

        self._lbl_due = tk.Label(
            self._frame_home,
            text="",
            bg="#1A1A2E",
            fg="#9977FF",
            font=small_font,
        )
        self._lbl_due.pack(pady=4)

        # ---- QUIZ SCREEN ----
        self._frame_quiz = tk.Frame(self, bg="#1A1A2E")
        self._quiz_widget = QuizScreen(
            self._frame_quiz,
            on_answered=self._on_answered,
            on_speak=self._play_audio_for_word,
        )
        self._quiz_widget.pack(fill="both", expand=True)

        # ---- REVIEW SCREEN ----
        self._frame_review = tk.Frame(self, bg="#1A1A2E")
        self._review_widget = ReviewScreen(
            self._frame_review,
            on_answered=self._on_answered,
            on_speak=self._play_audio_for_word,
        )
        self._review_widget.pack(fill="both", expand=True)

        # ---- PRONUNCIATION SCREEN ----
        self._frame_pronunciation = tk.Frame(self, bg="#1A1A2E")
        self._pronunciation_widget = PronunciationScreen(
            self._frame_pronunciation,
            recorder=self._recorder,
            whisper_engine=self._whisper_engine,
            on_back=self._show_home,
            on_status=self._set_status,
        )
        self._pronunciation_widget.pack(fill="both", expand=True)

        # ---- PROGRESS SCREEN ----
        self._frame_progress = tk.Frame(self, bg="#1A1A2E")
        self._progress_widget = ProgressScreen(
            self._frame_progress,
            on_back=self._show_home,
            on_status=self._set_status,
        )
        self._progress_widget.pack(fill="both", expand=True)

        # ---- RESULT SCREEN ----
        self._frame_result = tk.Frame(self, bg="#1A1A2E")

        self._lbl_result_title = tk.Label(
            self._frame_result,
            text="Kết quả phiên học",
            bg="#1A1A2E",
            fg="#FFFFFF",
            font=tkfont.Font(family="Segoe UI", size=18, weight="bold"),
        )
        self._lbl_result_title.pack(pady=(50, 10))

        self._lbl_score = tk.Label(
            self._frame_result,
            text="",
            bg="#1A1A2E",
            fg="#7878EE",
            font=tkfont.Font(family="Segoe UI", size=40, weight="bold"),
        )
        self._lbl_score.pack()

        self._lbl_result_sub = tk.Label(
            self._frame_result,
            text="",
            bg="#1A1A2E",
            fg="#AAAACC",
            font=body_font,
        )
        self._lbl_result_sub.pack(pady=(6, 40))

        tk.Button(
            self._frame_result,
            text="Học thêm",
            font=btn_font,
            bg="#4C4CCC",
            fg="#FFFFFF",
            activebackground="#6666EE",
            activeforeground="#FFFFFF",
            relief="flat",
            bd=0,
            cursor="hand2",
            padx=24,
            pady=12,
            command=self._start_quiz,
        ).pack(pady=6)

        tk.Button(
            self._frame_result,
            text="Về trang chủ",
            font=body_font,
            bg="#2D2D44",
            fg="#CCCCDD",
            activebackground="#3D3D5C",
            activeforeground="#FFFFFF",
            relief="flat",
            bd=0,
            cursor="hand2",
            padx=24,
            pady=10,
            command=self._show_home,
        ).pack(pady=4)

    # ------------------------------------------------------------------ #
    # Screen switching                                                    #
    # ------------------------------------------------------------------ #

    def _show_home(self) -> None:
        self._hide_all()
        self._refresh_home_summary()
        self._frame_home.pack(fill="both", expand=True)

    def _refresh_home_summary(self) -> None:
        """Refresh calm, read-only home guidance for V2 lesson structure."""
        plan = recommendation_service.recommend_next_payload(lesson_size=8)
        recommendation = plan.get("nextLesson", {})
        due_count = int(plan.get("dueCount", 0) or 0)

        if due_count > 0:
            mission = f"Today's mission: Complete 1 focused step and review {due_count} due words."
            due_text = f"Review due count: {due_count}"
        else:
            mission = "Today's mission: Complete 1 focused step at a calm rhythm."
            due_text = "Review due count: 0"

        preview_words = list(recommendation.get("lessonWords", []))[:3]
        if preview_words:
            words_preview = ", ".join(preview_words)
            next_lesson = (
                f"Next best lesson: {recommendation.get('skill', 'core')} ({words_preview})\n"
                f"{recommendation.get('reason', '')}"
            )
        else:
            next_lesson = "Next best lesson: Preparing content for your next step."

        self._lbl_today_mission.config(text=mission)
        self._lbl_next_lesson.config(text=next_lesson)
        self._lbl_review_due_hint.config(text=due_text)

        if due_count > 0:
            self._lbl_due.config(text=f"{due_count} từ đang chờ ôn tập")
        else:
            self._lbl_due.config(text="Không có từ nào cần ôn tập lúc này")

    def _show_quiz(self) -> None:
        self._hide_all()
        self._frame_quiz.pack(fill="both", expand=True)

    def _show_review(self) -> None:
        self._hide_all()
        self._frame_review.pack(fill="both", expand=True)

    def _show_pronunciation(self) -> None:
        self._hide_all()
        self._frame_pronunciation.pack(fill="both", expand=True)

    def _show_progress(self) -> None:
        self._hide_all()
        self._progress_widget.refresh()
        self._frame_progress.pack(fill="both", expand=True)

    def _show_result(self) -> None:
        self._hide_all()
        pct = int(self._session_correct / self._session_total * 100) if self._session_total else 0
        self._lbl_score.config(text=f"{self._session_correct}/{self._session_total}")
        self._lbl_result_sub.config(text=f"Độ chính xác: {pct}%")
        self._frame_result.pack(fill="both", expand=True)

    def _hide_all(self) -> None:
        for frame in (
            self._frame_home,
            self._frame_quiz,
            self._frame_review,
            self._frame_pronunciation,
            self._frame_progress,
            self._frame_result,
        ):
            frame.pack_forget()

    # ------------------------------------------------------------------ #
    # Quiz flow                                                           #
    # ------------------------------------------------------------------ #

    def _start_quiz(self) -> None:
        payload = lexical_service.get_quiz_batch_payload(batch_size=10, mode="learn")
        self._quiz_batch = list(payload.get("items", []))
        if not self._quiz_batch:
            self._lbl_status.config(text="Chưa có từ vựng. Kiểm tra dữ liệu seed.")
            return
        self._session_mode = "learn"
        self._current_idx = 0
        self._session_correct = 0
        self._session_total = len(self._quiz_batch)
        self._show_quiz()
        self._show_current_item()

    def _start_review(self) -> None:
        payload = lexical_service.get_quiz_batch_payload(batch_size=10, mode="review")
        self._quiz_batch = list(payload.get("items", []))
        if not self._quiz_batch:
            self._lbl_status.config(text="Không có từ nào cần ôn tập lúc này.")
            return
        self._session_mode = "review"
        self._current_idx = 0
        self._session_correct = 0
        self._session_total = len(self._quiz_batch)
        self._show_review()
        self._show_current_review_item()

    def _show_current_item(self) -> None:
        item = self._quiz_batch[self._current_idx]
        progress_text = f"{self._current_idx + 1} / {self._session_total}"
        self._quiz_widget.load_item(
            word=str(item["word"]),
            ipa=str(item["ipa"]),
            choices=list(item["choices"]),
            correct_answer=str(item["correctAnswer"]),
            progress_text=progress_text,
        )

    def _show_current_review_item(self) -> None:
        item = self._quiz_batch[self._current_idx]
        progress = progress_service.get_word_progress_payload(int(item["wordId"]))
        interval_days = int(progress.get("intervalDays", 0) or 0)
        progress_text = f"Ôn tập  {self._current_idx + 1} / {self._session_total}"
        self._review_widget.load_item(
            word=str(item["word"]),
            ipa=str(item["ipa"]),
            choices=list(item["choices"]),
            correct_answer=str(item["correctAnswer"]),
            progress_text=progress_text,
            interval_days=interval_days,
        )

    def _on_answered(self, is_correct: bool) -> None:
        item = self._quiz_batch[self._current_idx]
        lexical_service.submit_quiz_answer_payload(int(item["wordId"]), is_correct)

        if is_correct:
            self._session_correct += 1

        self._current_idx += 1
        if self._current_idx < self._session_total:
            if self._session_mode == "review":
                self._show_current_review_item()
            else:
                self._show_current_item()
        else:
            self._show_result()

    # ------------------------------------------------------------------ #
    # Audio integration                                                   #
    # ------------------------------------------------------------------ #

    def _set_status(self, text: str) -> None:
        self._lbl_status.config(text=text)

    def _play_audio_for_word(self, word: str, speed: str) -> None:
        result = audio_player.play_word(word, speed=speed)
        if result.mode == "file":
            self._set_status(f"Đang phát âm: {word} ({speed})")
        elif result.mode == "fallback":
            self._set_status(f"Thiếu audio local cho '{word}' ({speed}).")
        else:
            self._set_status(f"Lỗi audio: {result.message}")


def run() -> None:
    """Bootstrap DB and launch app window."""
    create_tables()
    load_seed()
    app = AppWindow()
    app.mainloop()

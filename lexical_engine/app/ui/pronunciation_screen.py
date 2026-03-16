"""
ui/pronunciation_screen.py — Pronunciation practice screen (Phase D).

Features:
- Record/Stop button state
- Save local WAV via speech.recorder.LocalRecorder
- Replay last recording
"""
from __future__ import annotations

import tkinter as tk
from tkinter import font as tkfont
from typing import Callable

from app.api import progress_service
from app.speech.recorder import LocalRecorder, RecorderResult, MicrophoneCheckResult
from app.speech.whisper_engine import WhisperEngine


class PronunciationScreen(tk.Frame):
    """Standalone pronunciation practice UI."""

    def __init__(
        self,
        parent: tk.Widget,
        recorder: LocalRecorder,
        whisper_engine: WhisperEngine,
        on_back: Callable[[], None],
        on_status: Callable[[str], None] | None = None,
    ):
        super().__init__(parent, bg="#1A1A2E")
        self._recorder = recorder
        self._whisper_engine = whisper_engine
        self._on_back = on_back
        self._on_status = on_status
        self._last_path: str | None = None

        self._build_ui()

    def _build_ui(self) -> None:
        title_font = tkfont.Font(family="Segoe UI", size=20, weight="bold")
        body_font = tkfont.Font(family="Segoe UI", size=12)
        btn_font = tkfont.Font(family="Segoe UI", size=12, weight="bold")

        tk.Label(
            self,
            text="Luyện Phát Âm",
            bg="#1A1A2E",
            fg="#FFFFFF",
            font=title_font,
        ).pack(pady=(40, 8))

        tk.Label(
            self,
            text="Bấm ghi âm, nói rõ từ mục tiêu, sau đó nghe lại.",
            bg="#1A1A2E",
            fg="#AAB0D8",
            font=body_font,
        ).pack(pady=(0, 16))

        self._lbl_mic_warning = tk.Label(
            self,
            text="",
            bg="#1A1A2E",
            fg="#FF8686",
            font=tkfont.Font(family="Segoe UI", size=10, weight="bold"),
            wraplength=620,
            justify="center",
        )
        self._lbl_mic_warning.pack(pady=(0, 8))

        center = tk.Frame(self, bg="#1A1A2E")
        center.pack(pady=10)

        tk.Label(
            center,
            text="Target word",
            bg="#1A1A2E",
            fg="#7F86B8",
            font=body_font,
        ).grid(row=0, column=0, sticky="w")

        self._entry_word = tk.Entry(
            center,
            font=body_font,
            width=28,
            bg="#23233A",
            fg="#E8E8F0",
            relief="flat",
            insertbackground="#FFFFFF",
        )
        self._entry_word.insert(0, "trust")
        self._entry_word.grid(row=1, column=0, pady=(4, 16), ipady=6)

        self._btn_record = tk.Button(
            center,
            text="● Record",
            font=btn_font,
            bg="#A52727",
            fg="#FFFFFF",
            activebackground="#C73737",
            activeforeground="#FFFFFF",
            relief="flat",
            bd=0,
            cursor="hand2",
            padx=18,
            pady=10,
            command=self._toggle_record,
        )
        self._btn_record.grid(row=2, column=0, pady=(0, 8), sticky="ew")

        self._btn_replay = tk.Button(
            center,
            text="▶ Replay",
            font=btn_font,
            bg="#2D2D44",
            fg="#DDE2FF",
            activebackground="#3D3D5C",
            activeforeground="#FFFFFF",
            relief="flat",
            bd=0,
            cursor="hand2",
            padx=18,
            pady=10,
            command=self._on_replay,
        )
        self._btn_replay.grid(row=3, column=0, pady=(0, 14), sticky="ew")

        self._lbl_file = tk.Label(
            center,
            text="Chưa có file ghi âm.",
            bg="#1A1A2E",
            fg="#7F86B8",
            font=tkfont.Font(family="Segoe UI", size=10),
            wraplength=520,
            justify="left",
        )
        self._lbl_file.grid(row=4, column=0, sticky="w")

        self._lbl_recognized = tk.Label(
            center,
            text="Whisper: chua transcribe.",
            bg="#1A1A2E",
            fg="#9FA8D4",
            font=tkfont.Font(family="Segoe UI", size=10),
            wraplength=520,
            justify="left",
        )
        self._lbl_recognized.grid(row=5, column=0, sticky="w", pady=(8, 0))

        self._lbl_score = tk.Label(
            center,
            text="Score: --",
            bg="#1A1A2E",
            fg="#9FA8D4",
            font=tkfont.Font(family="Segoe UI", size=10, weight="bold"),
            wraplength=520,
            justify="left",
        )
        self._lbl_score.grid(row=6, column=0, sticky="w", pady=(2, 0))

        tk.Button(
            self,
            text="← Về trang chủ",
            font=body_font,
            bg="#2D2D44",
            fg="#CCCCDD",
            activebackground="#3D3D5C",
            activeforeground="#FFFFFF",
            relief="flat",
            bd=0,
            cursor="hand2",
            padx=20,
            pady=10,
            command=self._on_back,
        ).pack(pady=26)

    def _toggle_record(self) -> None:
        if not self._recorder.is_recording:
            mic_check = self._recorder.check_input_device()
            if not mic_check.available:
                self._show_mic_warning(mic_check)
                self._set_status("Khong the bat dau ghi am: khong co microphone input.")
                return

            self._clear_mic_warning()
            word = self._entry_word.get().strip() or "word"
            result = self._recorder.start_recording(target_word=word)
            if result.ok:
                self._btn_record.config(text="■ Stop", bg="#237A3A", activebackground="#2E9B4A")
                if mic_check.device_name:
                    self._set_status(f"Dang ghi am: {word} | Mic: {mic_check.device_name}")
                else:
                    self._set_status(f"Dang ghi am: {word}")
            else:
                self._set_status(f"Không thể bắt đầu ghi âm: {result.message}")
            return

        result = self._recorder.stop_recording()
        self._btn_record.config(text="● Record", bg="#A52727", activebackground="#C73737")
        self._handle_record_result(result)

    def _on_replay(self) -> None:
        result = self._recorder.replay(self._last_path)
        if result.ok:
            self._set_status("Đang phát lại bản ghi.")
        else:
            self._set_status(f"Replay lỗi: {result.message}")

    def _handle_record_result(self, result: RecorderResult) -> None:
        if not result.ok:
            self._set_status(f"Lưu ghi âm thất bại: {result.message}")
            return

        self._last_path = result.path
        short_path = result.path or "(unknown)"
        self._lbl_file.config(text=f"File: {short_path}\nDuration: {result.seconds:.2f}s")
        if result.mode == "recorded":
            self._set_status("Đã ghi âm và lưu thành công.")
        else:
            self._set_status("Thiết bị ghi âm chưa sẵn sàng, đã lưu file fallback.")

        target_word = self._entry_word.get().strip() or "word"
        self._evaluate_pronunciation(target_word, result.path)

    def _set_status(self, text: str) -> None:
        if self._on_status:
            self._on_status(text)

    def _show_mic_warning(self, check: MicrophoneCheckResult) -> None:
        self._lbl_mic_warning.config(
            text=(
                "Khong tim thay microphone input. "
                "Hay ket noi mic va cap quyen thu am cho ung dung. "
                f"Chi tiet: {check.message}"
            )
        )

    def _clear_mic_warning(self) -> None:
        self._lbl_mic_warning.config(text="")

    def _evaluate_pronunciation(self, target_word: str, record_path: str | None) -> None:
        if not record_path:
            self._lbl_recognized.config(text="Whisper: khong co file ghi am de phan tich.")
            self._lbl_score.config(text="Score: 0/100 | Chua du du lieu.", fg="#FF8686")
            return

        transcription = self._whisper_engine.transcribe(record_path)
        if not transcription.ok:
            self._lbl_recognized.config(text=f"Whisper: {transcription.message}")
            self._lbl_score.config(text="Score: -- | Chua the cham diem.", fg="#FFB366")
            return

        scored_payload = progress_service.score_and_record_pronunciation_payload(
            target_word=target_word,
            recognized_text=transcription.text,
            audio_path=record_path,
            transcription_model=f"whisper:{self._whisper_engine.model_size}",
        )
        result = scored_payload.get("result", {})
        score = int(result.get("score", 0) or 0)
        feedback = str(result.get("feedback", ""))
        recognized = str(result.get("recognized", ""))

        self._lbl_recognized.config(text=f"Whisper nghe duoc: {transcription.text}")

        if score >= 80:
            score_color = "#76D275"
        elif score >= 60:
            score_color = "#F2C46D"
        else:
            score_color = "#FF8686"

        self._lbl_score.config(
            text=f"Score: {score}/100 | {feedback}",
            fg=score_color,
        )
        self._set_status(f"Cham diem phat am: {score}/100")
        if recognized:
            self._lbl_recognized.config(text=f"Whisper nghe duoc: {recognized}")

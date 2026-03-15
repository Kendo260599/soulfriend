"""
ui/progress_screen.py - Pronunciation progress dashboard.

Shows pronunciation history with:
- Word filter
- 7-day average score
- 7-day trend (up/down/flat)
"""
from __future__ import annotations

import tkinter as tk
from tkinter import ttk
from tkinter import font as tkfont
from typing import Callable

from app.db import repository


class ProgressScreen(tk.Frame):
    """Pronunciation progress screen with filtering and trend metrics."""

    def __init__(
        self,
        parent: tk.Widget,
        on_back: Callable[[], None],
        on_status: Callable[[str], None] | None = None,
    ):
        super().__init__(parent, bg="#1A1A2E")
        self._on_back = on_back
        self._on_status = on_status

        self._word_var = tk.StringVar(value="")
        self._build_ui()
        self.refresh()

    def _build_ui(self) -> None:
        title_font = tkfont.Font(family="Segoe UI", size=20, weight="bold")
        body_font = tkfont.Font(family="Segoe UI", size=11)

        tk.Label(
            self,
            text="Tien Trinh Phat Am",
            bg="#1A1A2E",
            fg="#FFFFFF",
            font=title_font,
        ).pack(pady=(26, 6))

        top = tk.Frame(self, bg="#1A1A2E")
        top.pack(fill="x", padx=20, pady=(6, 10))

        tk.Label(
            top,
            text="Loc theo tu:",
            bg="#1A1A2E",
            fg="#AAB0D8",
            font=body_font,
        ).pack(side="left")

        self._entry_word = tk.Entry(
            top,
            textvariable=self._word_var,
            width=24,
            bg="#23233A",
            fg="#E8E8F0",
            insertbackground="#FFFFFF",
            relief="flat",
            font=body_font,
        )
        self._entry_word.pack(side="left", padx=(8, 8), ipady=3)

        self._combo_word = ttk.Combobox(
            top,
            textvariable=self._word_var,
            width=18,
            state="readonly",
            values=[""],
        )
        self._combo_word.pack(side="left", padx=(0, 8))
        self._combo_word.bind("<<ComboboxSelected>>", lambda _e: self.refresh())

        tk.Button(
            top,
            text="Refresh",
            bg="#3344BB",
            fg="#FFFFFF",
            activebackground="#4455CC",
            activeforeground="#FFFFFF",
            relief="flat",
            bd=0,
            cursor="hand2",
            padx=12,
            pady=6,
            command=self.refresh,
        ).pack(side="left")

        tk.Button(
            top,
            text="Clear",
            bg="#2D2D44",
            fg="#DDE2FF",
            activebackground="#3D3D5C",
            activeforeground="#FFFFFF",
            relief="flat",
            bd=0,
            cursor="hand2",
            padx=12,
            pady=6,
            command=self._clear_filter,
        ).pack(side="left", padx=(8, 0))

        self._lbl_metrics = tk.Label(
            self,
            text="",
            bg="#1A1A2E",
            fg="#DDE2FF",
            font=tkfont.Font(family="Segoe UI", size=11, weight="bold"),
            justify="left",
            anchor="w",
        )
        self._lbl_metrics.pack(fill="x", padx=20, pady=(0, 6))

        self._lbl_insight = tk.Label(
            self,
            text="",
            bg="#1A1A2E",
            fg="#AAB0D8",
            font=tkfont.Font(family="Segoe UI", size=10),
            justify="left",
            anchor="w",
        )
        self._lbl_insight.pack(fill="x", padx=20, pady=(0, 8))

        self._lbl_hint = tk.Label(
            self,
            text="Meo: Double-click vao dong trong Top Tang/Giam de loc nhanh theo tu.",
            bg="#1A1A2E",
            fg="#7F86B8",
            font=tkfont.Font(family="Segoe UI", size=9),
            justify="left",
            anchor="w",
        )
        self._lbl_hint.pack(fill="x", padx=20, pady=(0, 6))

        recommend_frame = tk.Frame(self, bg="#1A1A2E")
        recommend_frame.pack(fill="x", padx=20, pady=(0, 8))
        tk.Label(
            recommend_frame,
            text="Practice Recommendation (Top 3)",
            bg="#1A1A2E",
            fg="#FFD36E",
            font=tkfont.Font(family="Segoe UI", size=10, weight="bold"),
            anchor="w",
        ).pack(fill="x")

        self._list_recommend = tk.Listbox(
            recommend_frame,
            bg="#202036",
            fg="#E8E8F0",
            relief="flat",
            height=3,
            font=tkfont.Font(family="Consolas", size=9),
        )
        self._list_recommend.pack(fill="x")
        self._list_recommend.bind("<Double-Button-1>", self._on_recommend_double_click)

        self._chart_canvas = tk.Canvas(
            self,
            bg="#202036",
            highlightthickness=0,
            height=170,
        )
        self._chart_canvas.pack(fill="x", padx=20, pady=(2, 10))

        trend_frame = tk.Frame(self, bg="#1A1A2E")
        trend_frame.pack(fill="x", padx=20, pady=(0, 8))

        left = tk.Frame(trend_frame, bg="#1A1A2E")
        left.pack(side="left", fill="both", expand=True, padx=(0, 6))
        tk.Label(
            left,
            text="Top Tang (7d)",
            bg="#1A1A2E",
            fg="#76D275",
            font=tkfont.Font(family="Segoe UI", size=10, weight="bold"),
            anchor="w",
        ).pack(fill="x")
        self._list_up = tk.Listbox(
            left,
            bg="#202036",
            fg="#E8E8F0",
            relief="flat",
            height=4,
            font=tkfont.Font(family="Consolas", size=9),
        )
        self._list_up.pack(fill="both", expand=True)
        self._list_up.bind("<Double-Button-1>", self._on_up_double_click)

        right = tk.Frame(trend_frame, bg="#1A1A2E")
        right.pack(side="left", fill="both", expand=True, padx=(6, 0))
        tk.Label(
            right,
            text="Top Giam (7d)",
            bg="#1A1A2E",
            fg="#FF8686",
            font=tkfont.Font(family="Segoe UI", size=10, weight="bold"),
            anchor="w",
        ).pack(fill="x")
        self._list_down = tk.Listbox(
            right,
            bg="#202036",
            fg="#E8E8F0",
            relief="flat",
            height=4,
            font=tkfont.Font(family="Consolas", size=9),
        )
        self._list_down.pack(fill="both", expand=True)
        self._list_down.bind("<Double-Button-1>", self._on_down_double_click)

        self._listbox = tk.Listbox(
            self,
            bg="#202036",
            fg="#E8E8F0",
            selectbackground="#4455CC",
            selectforeground="#FFFFFF",
            relief="flat",
            font=tkfont.Font(family="Consolas", size=10),
            height=14,
        )
        self._listbox.pack(fill="both", expand=True, padx=20, pady=(8, 12))

        tk.Button(
            self,
            text="<- Ve trang chu",
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
        ).pack(pady=(0, 18))

    def _clear_filter(self) -> None:
        self._word_var.set("")
        self.refresh()

    def refresh(self) -> None:
        self._refresh_word_options()
        target_word = self._word_var.get().strip() or None

        metrics = repository.get_pronunciation_progress_metrics(target_word=target_word)
        history = repository.get_pronunciation_history(limit=120, target_word=target_word)
        daily_points = repository.get_pronunciation_daily_averages(target_word=target_word, days=14)
        word_trends = repository.get_pronunciation_word_trends(limit=5)
        recommendations = repository.get_practice_recommendations(limit=3)

        trend = metrics["trend_direction"]
        if trend == "up":
            trend_text = f"Tang (+{metrics['trend_delta_7d']})"
            trend_color = "#76D275"
        elif trend == "down":
            trend_text = f"Giam ({metrics['trend_delta_7d']})"
            trend_color = "#FF8686"
        else:
            trend_text = f"On dinh ({metrics['trend_delta_7d']})"
            trend_color = "#F2C46D"

        self._lbl_metrics.config(
            text=(
                f"Attempts: {metrics['attempts_total']}    "
                f"Attempts(7d): {metrics['attempts_7d']}    "
                f"ActiveDays(7d): {metrics['active_days_7d']}    "
                f"Streak: {metrics['streak_days']}d\n"
                f"Avg(7d): {metrics['avg_score_7d']}    "
                f"Avg(prev7d): {metrics['avg_score_prev_7d']}    "
                f"Best: {metrics['best_score'] if metrics['best_score'] is not None else '--'}    "
                f"Last: {metrics['last_score'] if metrics['last_score'] is not None else '--'}    "
                f"Trend: {trend_text}"
            ),
            fg=trend_color,
        )

        insight = self._build_insight(metrics)
        self._lbl_insight.config(text=f"Insight: {insight}")

        self._draw_daily_chart(daily_points)
        self._fill_word_trends(word_trends)
        self._fill_recommendations(recommendations)

        self._listbox.delete(0, tk.END)
        if not history:
            self._listbox.insert(tk.END, "Khong co du lieu phat am cho bo loc hien tai.")
        else:
            self._listbox.insert(tk.END, "Date                | Word         | Score | Recognized")
            self._listbox.insert(tk.END, "-" * 92)
            for row in history:
                created = str(row["created_at"] or "")
                created = created[:19]
                word = str(row["target_word"] or "")[:12].ljust(12)
                score = "--" if row["score"] is None else str(row["score"]).rjust(3)
                recognized = str(row["recognized_text"] or "")
                if len(recognized) > 44:
                    recognized = recognized[:41] + "..."
                line = f"{created.ljust(19)} | {word} | {score}  | {recognized}"
                self._listbox.insert(tk.END, line)

        if self._on_status:
            filter_label = target_word if target_word else "(all)"
            self._on_status(f"Progress refreshed for filter: {filter_label}")

    def _refresh_word_options(self) -> None:
        words = repository.get_pronunciation_words()
        values = [""] + words
        self._combo_word["values"] = values

    @staticmethod
    def _extract_word_from_trend_line(line: str) -> str:
        # Trend line format starts with fixed-width word field.
        return line[:12].strip()

    def _on_up_double_click(self, _event) -> None:
        selection = self._list_up.curselection()
        if not selection:
            return
        line = self._list_up.get(selection[0])
        if line.startswith("("):
            return
        word = self._extract_word_from_trend_line(line)
        if word:
            self._word_var.set(word)
            self.refresh()

    def _on_down_double_click(self, _event) -> None:
        selection = self._list_down.curselection()
        if not selection:
            return
        line = self._list_down.get(selection[0])
        if line.startswith("("):
            return
        word = self._extract_word_from_trend_line(line)
        if word:
            self._word_var.set(word)
            self.refresh()

    def _on_recommend_double_click(self, _event) -> None:
        selection = self._list_recommend.curselection()
        if not selection:
            return
        line = self._list_recommend.get(selection[0])
        if line.startswith("("):
            return
        word = self._extract_word_from_trend_line(line)
        if word:
            self._word_var.set(word)
            self.refresh()

    def _build_insight(self, metrics: dict) -> str:
        if metrics["attempts_total"] == 0:
            return "Chua co du lieu phat am. Hay ghi am it nhat 1 lan de bat dau theo doi."

        if metrics["trend_direction"] == "up":
            return "Tien bo tot. Duy tri nhip luyen 3-5 lan/tuan de giu da tang."

        if metrics["trend_direction"] == "down":
            return "Diem dang giam. Thu tap trung 5 phut/ngay vao am cuoi va doc cham hon."

        if metrics["streak_days"] >= 3:
            return "Nhip luyen on dinh. Co the tang do kho bang cum tu dai hon."

        return "Tien do dang on dinh. Tang tan suat luyen trong 7 ngay toi de thay doi ro hon."

    def _draw_daily_chart(self, points: list[dict]) -> None:
        canvas = self._chart_canvas
        canvas.delete("all")

        width = max(canvas.winfo_width(), 700)
        height = int(canvas.cget("height"))
        pad_l, pad_r, pad_t, pad_b = 30, 12, 14, 24

        canvas.create_text(
            pad_l,
            6,
            text="Avg score 14 days",
            anchor="nw",
            fill="#AAB0D8",
            font=("Segoe UI", 9, "bold"),
        )

        if not points:
            canvas.create_text(width // 2, height // 2, text="No data", fill="#8D92BA")
            return

        plot_w = max(1, width - pad_l - pad_r)
        plot_h = max(1, height - pad_t - pad_b)

        canvas.create_rectangle(pad_l, pad_t, pad_l + plot_w, pad_t + plot_h, outline="#34395C")
        for y in (0, 25, 50, 75, 100):
            py = pad_t + plot_h - (plot_h * (y / 100.0))
            canvas.create_line(pad_l, py, pad_l + plot_w, py, fill="#2A2F4F")
            canvas.create_text(8, py, text=str(y), fill="#6F75A6", anchor="w", font=("Segoe UI", 8))

        n = len(points)
        coords = []
        for i, point in enumerate(points):
            x = pad_l + (plot_w * i / max(1, n - 1))
            score = float(point.get("avg_score", 0.0))
            score = max(0.0, min(100.0, score))
            y = pad_t + plot_h - (plot_h * (score / 100.0))
            coords.extend([x, y])

            if i in (0, n - 1):
                day = str(point.get("day", ""))[5:]
                canvas.create_text(x, pad_t + plot_h + 10, text=day, fill="#8D92BA", font=("Consolas", 8))

        if len(coords) >= 4:
            canvas.create_line(*coords, fill="#63A4FF", width=2, smooth=True)
        for idx in range(0, len(coords), 2):
            x, y = coords[idx], coords[idx + 1]
            canvas.create_oval(x - 2, y - 2, x + 2, y + 2, fill="#9BD1FF", outline="")

    def _fill_word_trends(self, trends: dict) -> None:
        self._list_up.delete(0, tk.END)
        self._list_down.delete(0, tk.END)

        top_up = trends.get("top_up", [])
        top_down = trends.get("top_down", [])

        if not top_up:
            self._list_up.insert(tk.END, "(khong co du lieu tang)")
        else:
            for item in top_up:
                self._list_up.insert(
                    tk.END,
                    f"{item['word'][:12].ljust(12)} +{item['delta']:>5}  ({item['avg_7d']}|{item['avg_prev_7d']})",
                )

        if not top_down:
            self._list_down.insert(tk.END, "(khong co du lieu giam)")
        else:
            for item in top_down:
                self._list_down.insert(
                    tk.END,
                    f"{item['word'][:12].ljust(12)} {item['delta']:>6}  ({item['avg_7d']}|{item['avg_prev_7d']})",
                )

    def _fill_recommendations(self, recommendations: list[dict]) -> None:
        self._list_recommend.delete(0, tk.END)

        if not recommendations:
            self._list_recommend.insert(tk.END, "(khong co de xuat uu tien luc nay)")
            return

        for item in recommendations:
            self._list_recommend.insert(
                tk.END,
                (
                    f"{item['word'][:12].ljust(12)} p={item['priority']:>5} "
                    f"last={item['last_score']:>3} avg7={item['avg_7d']:>5} | {item['reason']}"
                ),
            )

"""
main.py — Entry point for SoulFriend Lexical Engine.
Phase 1: UI + local database + quiz engine.
"""

import sys
import os

# Ensure the lexical_engine root is on the Python path regardless of CWD
sys.path.insert(0, os.path.dirname(__file__))

from app.ui.app_window import run

if __name__ == "__main__":
    run()

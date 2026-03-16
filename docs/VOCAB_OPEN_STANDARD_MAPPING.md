# Vocab Open Standard Mapping

This module uses an open-list triangulation strategy for vocabulary curation.

## Source strategy

- Oxford 3000 aligned usage (publicly discussed high-frequency core words)
- CEFR public level descriptors (A1/A2/B1 progression)
- COCA frequency bands (1-1000, 1001-2000, 2001-3000)
- EVP-style CEFR mapping (derived internal mapping for lesson planning)

## Important note

- This is an independent curriculum aligned to trusted open standards.
- It is not an official Cambridge export or licensed Cambridge dataset.

## Required vocab metadata

Each vocab lesson in curriculum must include:

- topic_ielts
- focus_en
- focus_vi
- objective_en
- objective_vi
- cefr_target
- coca_frequency_band
- source_standard (must be `open-triangulated`)
- source_refs (at least 2 references)

## Quality checks

- Vietnamese fields must contain diacritics.
- Lesson order must be unique per track.
- Vocab lessons are sorted by order then id.

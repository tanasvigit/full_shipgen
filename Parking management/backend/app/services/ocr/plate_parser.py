from __future__ import annotations

import re

ALNUM_RE = re.compile(r"[A-Z0-9]+")

LETTER_FIXES = {
    "0": "O",
    "1": "I",
    "2": "Z",
    "5": "S",
    "6": "G",
    "7": "T",
    "8": "B",
}

DIGIT_FIXES = {
    "B": "8",
    "D": "0",
    "G": "6",
    "I": "1",
    "L": "1",
    "O": "0",
    "Q": "0",
    "S": "5",
    "T": "7",
    "Z": "2",
}

PLATE_PATTERNS = [
    "DDLLDDDDLL",
    "LLDLDDDD",
    "LLDLLDDDD",
    "LLDLLLDDDD",
    "LLDDLDDDD",
    "LLDDLLDDDD",
    "LLDDLLLDDDD",
]


def normalize_text(raw_text: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", raw_text.upper())


def extract_plate_candidates(raw_text: str) -> list[str]:
    normalized = normalize_text(raw_text)
    sequences: list[str] = []
    seen_sequences: set[str] = set()

    for chunk in ALNUM_RE.findall(raw_text.upper()):
        cleaned = normalize_text(chunk)
        if cleaned and cleaned not in seen_sequences:
            seen_sequences.add(cleaned)
            sequences.append(cleaned)

    if normalized and normalized not in seen_sequences:
        sequences.append(normalized)

    matches: list[str] = []
    seen_matches: set[str] = set()
    for sequence in sequences:
        for pattern in PLATE_PATTERNS:
            window_size = len(pattern)
            if len(sequence) < window_size:
                continue
            for start in range(len(sequence) - window_size + 1):
                candidate = _repair_for_pattern(sequence[start : start + window_size], pattern)
                if candidate and candidate not in seen_matches:
                    seen_matches.add(candidate)
                    matches.append(candidate)

    return matches


def _repair_for_pattern(value: str, pattern: str) -> str | None:
    repaired: list[str] = []
    for index, rule in enumerate(pattern):
        char = value[index]
        if rule == "L":
            if char.isalpha():
                repaired.append(char)
                continue
            mapped = LETTER_FIXES.get(char)
            if mapped:
                repaired.append(mapped)
                continue
            return None

        if char.isdigit():
            repaired.append(char)
            continue
        mapped = DIGIT_FIXES.get(char)
        if mapped:
            repaired.append(mapped)
            continue
        return None

    return "".join(repaired)

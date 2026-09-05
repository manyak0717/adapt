"""Procedural step extractor module.

Extracts numbered procedural steps from instructional webpages (e.g. wikiHow,
how-to guides, documentation) using regex pattern recognition and heuristic NLP
without relying on an external LLM or API.
"""

import logging
import re
from typing import List, Optional, Tuple

from .models import ProceduralStep

logger = logging.getLogger(__name__)

# Regular expressions for identifying instructional section headers
SECTION_START_PATTERNS = [
    re.compile(r"^\s*(?:###?\s*)?Steps\s*$", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^\s*(?:###?\s*)?Instructions\s*$", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^\s*(?:###?\s*)?Directions\s*$", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^\s*(?:###?\s*)?Procedure\s*$", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^\s*(?:###?\s*)?Method\s+\d+\b.*$", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^\s*(?:###?\s*)?Part\s+\d+\b.*$", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^\s*(?:###?\s*)?How\s+to\b.*$", re.IGNORECASE | re.MULTILINE),
]

# Regular expressions for identifying sections where procedure ends
SECTION_END_PATTERNS = [
    re.compile(
        r"^\s*(?:###?\s*)?(?:Tips(?:\s+and\s+Warnings)?|Warnings|Things\s+You(?:\'ll)?\s+Need|"
        r"References|Related\s+Articles|Article\s+Summary|Community\s+Q&A|"
        r"Questions\s+and\s+Answers|Reader\s+Success\s+Stories|Featured\s+Videos?|"
        r"Trending\s+Articles|Expert\s+Q&A)\b",
        re.IGNORECASE | re.MULTILINE,
    ),
]

# Patterns for lines that represent webpage/scraping boilerplate
BOILERPLATE_LINE_PATTERNS = [
    re.compile(r"^Download\s+Article$", re.IGNORECASE),
    re.compile(r"^Advertisement$", re.IGNORECASE),
    re.compile(r"^Explore\s+this\s+Article$", re.IGNORECASE),
    re.compile(r"^IN\s+THIS\s+ARTICLE$", re.IGNORECASE),
    re.compile(r"^Things\s+You\s+Should\s+Know$", re.IGNORECASE),
    re.compile(r"^Skip\s+to\s+Content$", re.IGNORECASE),
    re.compile(r"^\[\d+\]$"),
    re.compile(r"^(?:X\s+)?Research\s+source$", re.IGNORECASE),
    re.compile(r"^Community\s+Q&A$", re.IGNORECASE),
    re.compile(r"^\d+\s+votes\s*-\s*\d+%$", re.IGNORECASE),
    re.compile(r"^Co-authored\s+by", re.IGNORECASE),
    re.compile(r"^Updated:\s+[A-Za-z]+", re.IGNORECASE),
    re.compile(r"^Fact\s+Checked$", re.IGNORECASE),
    re.compile(r"^Watch\s+Now$", re.IGNORECASE),
]

# Action categorization keywords
ACTION_TYPE_PATTERNS = [
    (
        "input",
        re.compile(
            r"\b(?:enter|type|fill(?:\s+out|\s+in)?|input|provide|specify|write|submit|form|credentials?|password)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "select",
        re.compile(
            r"\b(?:choose|select|pick|decide|opt\s+for|click(?:\s+on)?|toggle)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "search",
        re.compile(
            r"\b(?:search|look\s+for|find|compare|research|query|explore|check\s+prices?|filter)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "navigate",
        re.compile(
            r"\b(?:go\s+to|visit|navigate|open|browse|head\s+to|arrive|access|log\s+in|sign\s+in)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "verify",
        re.compile(
            r"\b(?:review|verify|check|confirm|double-check|ensure|inspect|assess|validate)\b",
            re.IGNORECASE,
        ),
    ),
]

INPUT_REQUIRED_PATTERN = re.compile(
    r"\b(?:enter|type|input|fill(?:\s+out|\s+in)?|form|credit\s+card|debit\s+card|passport|payment|billing|email|phone|address|credentials?|username|cvv)\b",
    re.IGNORECASE,
)

HIGH_DIFFICULTY_PATTERN = re.compile(
    r"\b(?:caution|danger|complex|warning|difficult|strict|penalty|emergency|crucial|technical|mechanic|hazardous|safety\s+hazard)\b",
    re.IGNORECASE,
)


class StepExtractor:
    """Extracts structured procedural steps from plain text instructional content."""

    def __init__(self):
        pass

    def extract(self, raw_text: str) -> List[ProceduralStep]:
        """Extract numbered procedural steps from the given text.

        Args:
            raw_text: Cleaned text from an instructional webpage.

        Returns:
            List of ProceduralStep objects ordered sequentially.
        """
        if not raw_text or not raw_text.strip():
            return []

        # 1. Isolate procedural section (e.g. from "Steps" to "Tips")
        procedural_text = self._extract_procedural_section(raw_text)

        # 2. Segment into raw candidate step chunks
        raw_step_chunks = self._segment_steps(procedural_text)

        # 3. Clean and convert chunks to structured ProceduralStep objects
        steps: List[ProceduralStep] = []
        for index, lines in enumerate(raw_step_chunks, start=1):
            cleaned_lines = self._clean_lines(lines)
            if not cleaned_lines:
                continue

            step = self._build_step(step_number=index, lines=cleaned_lines)
            if step:
                steps.append(step)

        return steps

    def _extract_procedural_section(self, text: str) -> str:
        """Find the section containing steps and trim leading/trailing boilerplate."""
        # Prioritize exact procedural headings like 'Steps', 'Instructions', etc.
        primary_headings = [
            re.compile(r"^\s*(?:###?\s*)?Steps\s*$", re.IGNORECASE | re.MULTILINE),
            re.compile(r"^\s*(?:###?\s*)?Instructions\s*$", re.IGNORECASE | re.MULTILINE),
            re.compile(r"^\s*(?:###?\s*)?Directions\s*$", re.IGNORECASE | re.MULTILINE),
            re.compile(r"^\s*(?:###?\s*)?Procedure\s*$", re.IGNORECASE | re.MULTILINE),
            re.compile(r"^\s*(?:###?\s*)?Method\s+\d+\b.*$", re.IGNORECASE | re.MULTILINE),
            re.compile(r"^\s*(?:###?\s*)?Part\s+\d+\b.*$", re.IGNORECASE | re.MULTILINE),
        ]

        start_idx = -1
        for pattern in primary_headings:
            match = pattern.search(text)
            if match:
                start_idx = match.end()
                break

        # If no explicit header, search for 'How to' or use full text
        if start_idx == -1:
            m_howto = re.search(r"^\s*(?:###?\s*)?How\s+to\b.*$", text, re.IGNORECASE | re.MULTILINE)
            if m_howto:
                start_idx = m_howto.end()

        scoped_text = text[start_idx:] if start_idx != -1 else text

        # Find where procedural steps end (e.g. 'Tips', 'Warnings', etc.)
        end_idx = -1
        for pattern in SECTION_END_PATTERNS:
            match = pattern.search(scoped_text)
            if match:
                if end_idx == -1 or match.start() < end_idx:
                    end_idx = match.start()

        if end_idx != -1:
            scoped_text = scoped_text[:end_idx]

        return scoped_text.strip()

    def _segment_steps(self, text: str) -> List[List[str]]:
        """Identify numbered steps using patterns like '1', 'Step 1:', '1.', etc."""
        lines = [line.strip() for line in text.splitlines()]
        step_chunks: List[List[str]] = []
        current_lines: List[str] = []
        in_step = False

        for line in lines:
            if not line:
                continue

            # Check if line indicates a new step
            is_new_step, remaining_content = self._match_step_header(line)

            if is_new_step:
                if current_lines:
                    step_chunks.append(current_lines)
                    current_lines = []
                in_step = True
                if remaining_content:
                    current_lines.append(remaining_content)
            else:
                if in_step:
                    current_lines.append(line)

        if current_lines:
            step_chunks.append(current_lines)

        return step_chunks

    def _match_step_header(self, line: str) -> Tuple[bool, Optional[str]]:
        """Check if a line represents the start of a step.

        Supported formats:
        1. Standalone number on a line: '1', '2', '3'
        2. Explicit step label: 'Step 1:', 'Step 1 -', 'Step 1'
        3. Numbered list format: '1.', '1)', '(1)', '1 -'
        """
        # Standalone number (1..99)
        m_standalone = re.match(r"^(\d{1,2})$", line)
        if m_standalone:
            return True, None

        # Explicit 'Step 1', 'Step 1:', 'Step 1 -'
        m_step_label = re.match(r"^Step\s+(\d{1,2})\b[:\.\-\s]*(.*)$", line, re.IGNORECASE)
        if m_step_label:
            content = m_step_label.group(2).strip()
            return True, content if content else None

        # Numbered list '1.', '1)', '1 -', '(1)'
        m_numbered_list = re.match(r"^\(?(\d{1,2})\)?[\.\:\)\-]\s+(.+)$", line)
        if m_numbered_list:
            content = m_numbered_list.group(2).strip()
            return True, content if content else None

        return False, None

    def _clean_lines(self, lines: List[str]) -> List[str]:
        """Strip citation marks and discard boilerplate lines."""
        cleaned: List[str] = []
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            # Remove citations like [1], [2], [X]
            line_str = re.sub(r"\[(?:\d+|X)\]", "", line_str).strip()

            # Discard boilerplate lines
            if any(pat.match(line_str) for pat in BOILERPLATE_LINE_PATTERNS):
                continue

            if line_str:
                cleaned.append(line_str)

        return cleaned

    def _build_step(self, step_number: int, lines: List[str]) -> Optional[ProceduralStep]:
        """Formulate a structured ProceduralStep from cleaned step lines."""
        if not lines:
            return None

        first_line = lines[0]
        # Clean leading step numbers or bullets if present in first line
        cleaned_first = re.sub(r"^(?:Step\s+\d+\b[:\.\-\s]*|\(?\d+\)?[\.\:\)\-]\s*)", "", first_line).strip()

        # Derive short instruction: headline line or first sentence
        short_instruction = self._extract_short_instruction(cleaned_first)

        # Full instruction text
        if len(lines) > 1:
            instruction = f"{cleaned_first}\n" + "\n".join(lines[1:])
        else:
            instruction = cleaned_first

        # Ensure instruction is not empty
        if not instruction.strip():
            return None

        # Infer action type
        action_type = self._infer_action_type(short_instruction, instruction)

        # Infer input requirement
        requires_input = bool(INPUT_REQUIRED_PATTERN.search(instruction))

        # Infer difficulty
        difficulty = self._infer_difficulty(instruction, len(lines))

        # Build clean audio narration text
        clean_narrative = short_instruction.rstrip(".!?;:, ")
        audio_text = f"Step {step_number}: {clean_narrative}."

        return ProceduralStep(
            step_number=step_number,
            instruction=instruction.strip(),
            short_instruction=short_instruction.strip(),
            difficulty=difficulty,
            action_type=action_type,
            requires_input=requires_input,
            audio_text=audio_text,
        )

    def _extract_short_instruction(self, text: str) -> str:
        """Derive a concise headline or first sentence from text."""
        # Split by sentence end punctuation (. ! ?)
        sentences = re.split(r"(?<=[.!?])\s+", text)
        first_sentence = sentences[0].strip() if sentences else text.strip()

        # If sentence is reasonably concise (< 120 chars), use it
        if len(first_sentence) <= 120:
            return first_sentence

        # Otherwise, trim cleanly at word boundary
        return first_sentence[:117].rsplit(" ", 1)[0] + "..."

    def _infer_action_type(self, short_text: str, full_text: str) -> str:
        """Classify action type based on keywords."""
        # Prioritize checking short_text (headline), then full_text
        for category, pattern in ACTION_TYPE_PATTERNS:
            if pattern.search(short_text):
                return category

        for category, pattern in ACTION_TYPE_PATTERNS:
            if pattern.search(full_text):
                return category

        return "action"

    def _infer_difficulty(self, text: str, line_count: int) -> str:
        """Heuristic difficulty estimation: easy, medium, or hard."""
        if HIGH_DIFFICULTY_PATTERN.search(text):
            return "hard"
        if len(text) > 300 or line_count > 3:
            return "medium"
        return "easy"


def extract_steps(raw_text: str) -> List[ProceduralStep]:
    """Extract procedural steps from raw text.

    Args:
        raw_text: Cleaned text from an instructional webpage.

    Returns:
        List of structured ProceduralStep objects.
    """
    extractor = StepExtractor()
    return extractor.extract(raw_text)

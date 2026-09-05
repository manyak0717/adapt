"""
Prompt templates for the three instruction variants. Kept separate from
generator.py so wording can be iterated on without touching orchestration
logic or the LLM-client plumbing.
"""

STANDARD_INSTRUCTION_PROMPT = """You are helping make a digital task step accessible.

Step title: {title}
Original instruction: {raw_instruction}

Rewrite this as a single clear, standard instruction sentence. Do not add
steps that aren't implied by the original. Return only the instruction text,
with no preamble, quotation marks, or labels.
"""

SIMPLIFIED_INSTRUCTION_PROMPT = """You are helping make a digital task step accessible to someone who
finds standard instructions hard to follow (e.g. due to cognitive load,
low literacy, or attention difficulty).

Step title: {title}
Original instruction: {raw_instruction}

Rewrite this as one short, plain-language sentence. Use simple everyday
words, short sentence structure, and no jargon. Preserve the exact meaning
and required action. Return only the instruction text, with no preamble,
quotation marks, or labels.
"""

MICRO_STEPS_PROMPT = """You are helping make a digital task step accessible by breaking it into
the smallest reasonable actions.

Step title: {title}
Original instruction: {raw_instruction}

Break this single step into 2-5 short, sequential micro-steps. Each
micro-step should describe exactly one action. Return ONLY a numbered list,
one micro-step per line, formatted as:
1. <action>
2. <action>
No preamble, no extra commentary.
"""

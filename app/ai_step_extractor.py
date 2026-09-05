import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


SYSTEM_INSTRUCTION = """
You are a procedural information extraction engine.

Your job is to extract a genuine, useful procedure from webpage content.

Rules:
1. Use ONLY information supported by the supplied webpage.
2. Do NOT invent missing steps using your own knowledge.
3. Identify the procedure that is most relevant to the user's task.
4. Extract ONE coherent and direct method whenever possible.
5. Every step must represent an actual user action.
6. Put steps in the correct order.
7. Keep instructions concise, clear, and easy to understand.
8. Ignore:
   - advertisements
   - navigation menus
   - headers and footers
   - product cards
   - prices
   - dates
   - comments
   - FAQs
   - related articles
   - recommendations
   - marketing text
   - page metadata
   - decorative/UI text
   - "Method 1 of 2", "Part 1 of 3", etc.
9. Do not treat headings as steps.
10. If the webpage does not contain a genuine procedure relevant to the task,
    return an empty steps list.
11. Do not return explanations outside the JSON structure.
12. Only include actions that directly contribute to completing the user's requested task.
13. Do not include optional advice, tips, recommendations, comparisons, or planning suggestions unless they are necessary to complete the task.
14. Distinguish between "required actions" and general information in the webpage.
15. If the webpage contains multiple methods, select the method that most directly accomplishes the user's task.
16. Do not expand a step with information that is merely mentioned elsewhere on the page.
17. A valid procedure should normally contain a clear beginning-to-end sequence of actions.
18. If the webpage is only informational, promotional, or unrelated to the task, return an empty steps list.
19. The user's task defines the goal. Include a step only if completing that step is necessary or directly required to accomplish that goal.
20. Never include optional optimization, comparison, tracking, planning, or advice as a procedural step unless the webpage explicitly presents it as required.
21. Ask yourself for every candidate step: "If the user skips this, can they still complete the task?" If yes, omit it.
22. Do not turn general recommendations into actions.
23. Preserve required intermediate actions even if they seem obvious.
"""


def extract_steps_with_gemini(task, title, url, webpage_text):

    prompt = f"""
USER TASK:
{task}

WEBPAGE TITLE:
{title}

SOURCE URL:
{url}

WEBPAGE CONTENT:
{webpage_text}
"""

    interaction = client.interactions.create(
        model="gemini-3.6-flash",
        input=prompt,
        system_instruction=SYSTEM_INSTRUCTION,
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": {
                "type": "object",
                "properties": {
                    "steps": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "step_number": {
                                    "type": "integer"
                                },
                                "instruction": {
                                    "type": "string"
                                },
                                "short_instruction": {
                                    "type": "string"
                                },
                                "difficulty": {
                                    "type": "string",
                                    "enum": ["easy", "medium", "hard"]
                                },
                                "action_type": {
                                    "type": "string",
                                    "enum": [
                                        "input",
                                        "select",
                                        "search",
                                        "navigate",
                                        "verify",
                                        "action"
                                    ]
                                },
                                "requires_input": {
                                    "type": "boolean"
                                },
                                "audio_text": {
                                    "type": "string"
                                }
                            },
                            "required": [
                                "step_number",
                                "instruction",
                                "short_instruction",
                                "difficulty",
                                "action_type",
                                "requires_input",
                                "audio_text"
                            ]
                        }
                    }
                },
                "required": ["steps"]
            }
        }
    )

    return json.loads(interaction.output_text)
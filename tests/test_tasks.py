from app.search import search_webpages
from app.extractor import extract_content
from app.ai_step_extractor import extract_steps_with_gemini
from app.step_extractor import extract_steps


TASKS = [
    "how to book a flight",
    "how to book a hotel",
    "how to book a train ticket",
    "how to create a Gmail account",
    "how to send an email with an attachment",
    "how to create a Google Meet",
    "how to pay an electricity bill online",
    "how to book a doctor's appointment online",
    "how to order food online",
    "how to fill an online form",
    "how to upload a document",
    "how to create a PDF",
    "how to reset a password",
    "how to change a password",
    "how to buy a product online",
    "how to return an online purchase",
    "how to submit an assignment online",
    "how to download a document",
    "how to create an online account",
    "how to book a restaurant",
]


def test_task(task):
    print("\n" + "=" * 70)
    print("TASK:", task)

    try:
        results = search_webpages(task, max_results=5)

        if not results:
            print("❌ NO SEARCH RESULTS")
            return False

        print("Search results:", len(results))

        success = False

        for result in results:
            try:
                print("\nTrying:", result.title)
                print("URL:", result.url)

                source, text = extract_content(result.url)

                ai_result = extract_steps_with_gemini(
                    task,
                    source.title,
                    result.url,
                    text
                )

                steps = ai_result.get("steps", [])

                if len(steps) >= 2:
                    print("✅ STEPS FOUND:", len(steps))

                    for step in steps[:5]:
                        print(
                            f"  {step['step_number']}. "
                            f"{step['short_instruction']}"
                        )

                    success = True
                    break

            except Exception as e:
                print("⚠️ Failed:", type(e).__name__)

        if not success:
            print("❌ NO USABLE PROCEDURE FOUND")

        return success

    except Exception as e:
        print("❌ TASK FAILED:", type(e).__name__, e)
        return False


if __name__ == "__main__":
    passed = 0

    for task in TASKS:
        if test_task(task):
            passed += 1

    print("\n" + "=" * 70)
    print(f"FINAL RESULT: {passed}/{len(TASKS)} tasks produced usable steps")
    print("=" * 70)
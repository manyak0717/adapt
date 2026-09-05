"""Unit tests for the procedural step extractor module.
"""

import unittest
from app.step_extractor import StepExtractor, extract_steps
from app.models import ProceduralStep

# Realistic wikiHow flight-booking text fixture
WIKIHOW_FLIGHT_BOOKING_TEXT = """
How to Book a Flight: 10 Steps (with Pictures) - wikiHow

Skip to Content
Explore this Article
IN THIS ARTICLE
Methods
Part 1 of 2: Searching and Selecting Flights

Steps

1
Decide on your travel dates and destination.
Download Article
Determine your travel dates and where you need to travel before booking. Having flexible travel dates can help you find significantly lower airfares.
[1]
X Research source

2
Compare flights using aggregator websites.
Download Article
Use flight comparison search engines like Google Flights, Skyscanner, or Kayak. Compare different airlines, layover durations, and ticket prices.

3
Choose your preferred flight and seat class.
Download Article
Select the departure time that fits your itinerary and pick an economy or business class fare. Make sure to check airline baggage policies.

4
Enter passenger details.
Download Article
Type in each passenger's legal name, date of birth, contact phone number, email address, and passport number. Ensure details match government IDs accurately.

5
Review your itinerary and complete payment.
Download Article
Double-check the flight dates, enter your credit card information and billing address, and submit the booking form to confirm your reservation.

Tips
Book at least two to three weeks in advance for domestic flights.
Clear your browser cookies when searching for multiple dates.

Warnings
Be careful to avoid cancellation penalties by selecting refundable fares when needed.
"""


class TestStepExtractor(unittest.TestCase):
    """Test suite for StepExtractor and extract_steps."""

    def setUp(self):
        self.extractor = StepExtractor()

    def test_wikihow_flight_booking_extraction(self):
        """Test extraction against wikiHow flight booking text structure."""
        steps = self.extractor.extract(WIKIHOW_FLIGHT_BOOKING_TEXT)

        # Verify correct number of steps detected
        self.assertEqual(len(steps), 5)

        # Step 1 Assertions
        step1 = steps[0]
        self.assertEqual(step1.step_number, 1)
        self.assertEqual(step1.short_instruction, "Decide on your travel dates and destination.")
        self.assertIn("Having flexible travel dates can help you find significantly lower airfares.", step1.instruction)
        self.assertNotIn("Download Article", step1.instruction)
        self.assertNotIn("Research source", step1.instruction)
        self.assertFalse(step1.requires_input)
        self.assertEqual(step1.audio_text, "Step 1: Decide on your travel dates and destination.")

        # Step 2 Assertions (Search action)
        step2 = steps[1]
        self.assertEqual(step2.step_number, 2)
        self.assertEqual(step2.action_type, "search")
        self.assertEqual(step2.audio_text, "Step 2: Compare flights using aggregator websites.")

        # Step 3 Assertions (Select action)
        step3 = steps[2]
        self.assertEqual(step3.step_number, 3)
        self.assertEqual(step3.action_type, "select")

        # Step 4 Assertions (Input required for passenger details)
        step4 = steps[3]
        self.assertEqual(step4.step_number, 4)
        self.assertEqual(step4.action_type, "input")
        self.assertTrue(step4.requires_input)
        self.assertIn("passport", step4.instruction.lower())

        # Step 5 Assertions (Input required for payment)
        step5 = steps[4]
        self.assertEqual(step5.step_number, 5)
        self.assertTrue(step5.requires_input)
        self.assertIn("credit card", step5.instruction.lower())

    def test_data_contract_fields_and_dict_serialization(self):
        """Verify that each step object satisfies the required model schema."""
        steps = self.extractor.extract(WIKIHOW_FLIGHT_BOOKING_TEXT)
        self.assertGreater(len(steps), 0)

        for step in steps:
            self.assertIsInstance(step, ProceduralStep)
            data = step.to_dict()

            # Ensure all required contract fields are present
            required_keys = {
                "step_number",
                "instruction",
                "short_instruction",
                "difficulty",
                "action_type",
                "requires_input",
                "audio_text",
            }
            self.assertTrue(required_keys.issubset(data.keys()))

            # Type checks
            self.assertIsInstance(data["step_number"], int)
            self.assertIsInstance(data["instruction"], str)
            self.assertIsInstance(data["short_instruction"], str)
            self.assertIsInstance(data["difficulty"], str)
            self.assertIn(data["difficulty"], {"easy", "medium", "hard"})
            self.assertIsInstance(data["action_type"], str)
            self.assertIsInstance(data["requires_input"], bool)
            self.assertIsInstance(data["audio_text"], str)
            self.assertTrue(data["audio_text"].startswith(f"Step {step.step_number}:"))

    def test_numbered_list_format(self):
        """Test extraction from standard numbered list format (1. ..., 2. ...)."""
        numbered_text = """
        Instructions for Booking a Flight:

        1. Select your departure city and arrival airport.
        Make sure you know which terminal your airline operates from.

        2. Enter the number of passengers and travel dates.
        Fill in the passenger count including adults, children, and infants.

        3. Pay for your flight tickets.
        Enter your billing details to confirm.
        """
        steps = extract_steps(numbered_text)
        self.assertEqual(len(steps), 3)
        self.assertEqual(steps[0].step_number, 1)
        self.assertIn("Select your departure city", steps[0].short_instruction)
        self.assertEqual(steps[1].step_number, 2)
        self.assertTrue(steps[1].requires_input)
        self.assertEqual(steps[2].step_number, 3)

    def test_step_label_format(self):
        """Test extraction from explicit 'Step 1:', 'Step 2:' labeled formats."""
        labeled_text = """
        How to Reserve Flight Seats

        Step 1: Open the airline website or mobile app.
        Navigate to the official portal.

        Step 2: Enter your 6-digit booking reference code.
        Type in your confirmation number and passenger last name.

        Step 3: Select your preferred seat from the cabin map.
        Click on an available aisle or window seat.
        """
        steps = extract_steps(labeled_text)
        self.assertEqual(len(steps), 3)
        self.assertEqual(steps[0].short_instruction, "Open the airline website or mobile app.")
        self.assertEqual(steps[0].action_type, "navigate")
        self.assertEqual(steps[1].action_type, "input")
        self.assertTrue(steps[1].requires_input)
        self.assertEqual(steps[2].action_type, "select")

    def test_empty_and_non_procedural_text(self):
        """Test edge cases with empty text or text without steps."""
        self.assertEqual(extract_steps(""), [])
        self.assertEqual(extract_steps("   "), [])
        self.assertEqual(extract_steps("Just a random blog post about traveling with no steps."), [])


if __name__ == "__main__":
    unittest.main()

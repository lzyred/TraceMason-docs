"""Executed by Python unittest in a disposable copied workspace."""
import unittest
from price import compute_total

class PriceTests(unittest.TestCase):
    def test_discount(self):
        self.assertEqual(compute_total(100, 0.20), 80)

    def test_no_discount(self):
        self.assertEqual(compute_total(42.50, 0), 42.50)

    def test_invalid_discount(self):
        with self.assertRaises(ValueError):
            compute_total(50, 1.5)

if __name__ == "__main__":
    unittest.main()

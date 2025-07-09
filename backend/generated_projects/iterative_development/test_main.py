#!/usr/bin/env python3
"""
Unit tests for the calculator application
"""

import unittest
import sys
import os

# Add the parent directory to the path to import main
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import add, subtract, multiply, divide

class TestCalculator(unittest.TestCase):
    """Test cases for calculator functions."""
    
    def test_add(self):
        """Test addition function."""
        self.assertEqual(add(2, 3), 5)
        self.assertEqual(add(-1, 1), 0)
        self.assertEqual(add(0, 0), 0)
        self.assertEqual(add(1.5, 2.5), 4.0)
    
    def test_subtract(self):
        """Test subtraction function."""
        self.assertEqual(subtract(5, 3), 2)
        self.assertEqual(subtract(1, 1), 0)
        self.assertEqual(subtract(0, 5), -5)
        self.assertEqual(subtract(2.5, 1.5), 1.0)
    
    def test_multiply(self):
        """Test multiplication function."""
        self.assertEqual(multiply(3, 4), 12)
        self.assertEqual(multiply(0, 5), 0)
        self.assertEqual(multiply(-2, 3), -6)
        self.assertEqual(multiply(2.5, 2), 5.0)
    
    def test_divide(self):
        """Test division function."""
        self.assertEqual(divide(10, 2), 5)
        self.assertEqual(divide(7, 2), 3.5)
        self.assertEqual(divide(-6, 3), -2)
        
        # Test division by zero
        with self.assertRaises(ValueError):
            divide(5, 0)
    
    def test_edge_cases(self):
        """Test edge cases."""
        # Large numbers
        self.assertEqual(add(1000000, 2000000), 3000000)
        
        # Floating point precision
        result = add(0.1, 0.2)
        self.assertAlmostEqual(result, 0.3, places=10)

if __name__ == '__main__':
    unittest.main()

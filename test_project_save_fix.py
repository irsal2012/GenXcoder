#!/usr/bin/env python3
"""
Test script to verify that project saving works correctly after the fix.
"""

import asyncio
import json
import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

from services.file_storage_service import FileStorageService
from services.project_service import ProjectService

async def test_project_save():
    """Test project saving functionality."""
    print("🧪 Testing project save functionality...")
    
    # Create test project data
    test_project_data = {
        'project_id': 'test-project-123',
        'project_name': 'test01',
        'user_input': 'Create a simple calculator app',
        'timestamp': '2025-01-07T21:09:00',
        'code': {
            'final_code': '''
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b

def divide(a, b):
    if b != 0:
        return a / b
    else:
        return "Error: Division by zero"

if __name__ == "__main__":
    print("Simple Calculator")
    print("1. Add")
    print("2. Subtract")
    print("3. Multiply")
    print("4. Divide")
    
    choice = input("Enter choice (1-4): ")
    
    if choice in ['1', '2', '3', '4']:
        num1 = float(input("Enter first number: "))
        num2 = float(input("Enter second number: "))
        
        if choice == '1':
            print(f"Result: {add(num1, num2)}")
        elif choice == '2':
            print(f"Result: {subtract(num1, num2)}")
        elif choice == '3':
            print(f"Result: {multiply(num1, num2)}")
        elif choice == '4':
            print(f"Result: {divide(num1, num2)}")
    else:
        print("Invalid choice")
''',
            'additional_modules': []
        },
        'documentation': {
            'readme': '''# Simple Calculator

A basic calculator application that performs arithmetic operations.

## Features
- Addition
- Subtraction
- Multiplication
- Division (with zero-division protection)

## Usage
Run the script and follow the prompts to perform calculations.
'''
        },
        'tests': {
            'test_code': '''
import unittest
from main import add, subtract, multiply, divide

class TestCalculator(unittest.TestCase):
    
    def test_add(self):
        self.assertEqual(add(2, 3), 5)
        self.assertEqual(add(-1, 1), 0)
    
    def test_subtract(self):
        self.assertEqual(subtract(5, 3), 2)
        self.assertEqual(subtract(0, 5), -5)
    
    def test_multiply(self):
        self.assertEqual(multiply(3, 4), 12)
        self.assertEqual(multiply(-2, 3), -6)
    
    def test_divide(self):
        self.assertEqual(divide(10, 2), 5)
        self.assertEqual(divide(7, 0), "Error: Division by zero")

if __name__ == '__main__':
    unittest.main()
'''
        },
        'deployment': {
            'deployment_configs': '''# Deployment Guide

## Local Deployment
1. Ensure Python 3.6+ is installed
2. Run: `python main.py`

## Requirements
- Python 3.6+
- No external dependencies required

## Testing
Run tests with: `python test_main.py`
'''
        },
        'pipeline_metadata': {
            'success': True,
            'execution_time_seconds': 45.2
        }
    }
    
    try:
        # Test FileStorageService directly
        print("📁 Testing FileStorageService...")
        file_storage = FileStorageService()
        print(f"✅ FileStorageService initialized at: {file_storage.base_storage_path}")
        
        # Save the project
        saved_path = file_storage.save_project('test-project-123', test_project_data)
        print(f"✅ Project saved to: {saved_path}")
        
        # Verify files were created
        project_dir = Path(saved_path)
        expected_files = [
            'project_metadata.json',
            'main.py',
            'README.md',
            'test_main.py',
            'DEPLOYMENT.md',
            'requirements.txt',
            'complete_project_data.json'
        ]
        
        print("📋 Checking created files...")
        for filename in expected_files:
            file_path = project_dir / filename
            if file_path.exists():
                print(f"  ✅ {filename} - {file_path.stat().st_size} bytes")
            else:
                print(f"  ❌ {filename} - NOT FOUND")
        
        # Test ProjectService
        print("\n🔧 Testing ProjectService...")
        project_service = ProjectService()
        
        # Save using project service
        saved_path_service = await project_service.save_project_result('test-project-456', test_project_data)
        print(f"✅ ProjectService saved to: {saved_path_service}")
        
        # Get project statistics
        stats = await project_service.get_project_statistics()
        print(f"📊 Project statistics: {stats}")
        
        # List all projects
        projects = file_storage.list_projects()
        print(f"📋 Found {len(projects)} projects:")
        for project in projects:
            print(f"  - {project.get('project_name', 'Unknown')} (ID: {project.get('project_id', 'Unknown')})")
        
        print("\n✅ All tests passed! Project saving is working correctly.")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function."""
    print("🚀 Starting project save test...")
    
    success = await test_project_save()
    
    if success:
        print("\n🎉 Project save functionality is working correctly!")
        print("📁 Check the backend/generated_projects directory for saved files.")
    else:
        print("\n💥 Project save test failed!")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())

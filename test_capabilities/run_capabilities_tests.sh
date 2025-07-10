#!/bin/bash

# Capabilities API Test Runner
# This script runs comprehensive tests for the agent-service capabilities API

echo "🚀 Capabilities API Test Runner"
echo "================================"

# Check if agent service is running
echo "📡 Checking if agent service is running..."
if curl -s http://localhost:8001/v1/capabilities/health > /dev/null; then
    echo "✅ Agent service is running"
else
    echo "❌ Agent service is not running on port 8001"
    echo "Please start the agent service first:"
    echo "  cd agent-service && python main.py"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

echo "📦 Activating virtual environment..."
source venv/bin/activate

echo "📦 Installing test dependencies..."
pip install -r requirements.txt

echo ""
echo "🧪 Running Capabilities API Tests..."
echo "====================================="

# Run the main test script
python test_capabilities_api.py --url http://localhost:8001 --test all

echo ""
echo "📊 Test Results Summary"
echo "======================"
echo "Check the output above for detailed test results."
echo ""
echo "To run specific tests:"
echo "  python test_capabilities_api.py --test connection"
echo "  python test_capabilities_api.py --test health"
echo "  python test_capabilities_api.py --test agents"
echo "  python test_capabilities_api.py --test pipelines"
echo "  python test_capabilities_api.py --test summary"
echo "  python test_capabilities_api.py --test config_types"
echo "  python test_capabilities_api.py --test openapi"
echo "  python test_capabilities_api.py --test errors"

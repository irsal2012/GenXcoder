#!/bin/bash

# Pipelines API Test Runner
# This script runs comprehensive tests for the agent-service pipelines API

echo "🚀 Pipelines API Test Runner"
echo "============================="

# Check if agent service is running
echo "📡 Checking if agent service is running..."
if curl -s http://localhost:8001/v1/pipelines/info > /dev/null; then
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
echo "🧪 Running Pipelines API Tests..."
echo "=================================="

# Run the main test script
python test_pipelines_api.py --url http://localhost:8001 --test all

echo ""
echo "📊 Test Results Summary"
echo "======================"
echo "Check the output above for detailed test results."
echo ""
echo "To run specific tests:"
echo "  python test_pipelines_api.py --test connection"
echo "  python test_pipelines_api.py --test initialize"
echo "  python test_pipelines_api.py --test info"
echo "  python test_pipelines_api.py --test validate"
echo "  python test_pipelines_api.py --test execute_sync"
echo "  python test_pipelines_api.py --test execute_async"
echo "  python test_pipelines_api.py --test list"
echo "  python test_pipelines_api.py --test clear"
echo "  python test_pipelines_api.py --test errors"

#!/bin/bash

# Multi-Agent Framework Startup Script
echo "🚀 Starting Multi-Agent Framework with MCP Gateway..."

# Check if Python is available
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.11+ first."
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping services..."
    pkill -f "python main.py" 2>/dev/null
    pkill -f "node build/index.js" 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start Agent Service
echo "📦 Starting Agent Service..."
cd agent-service

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "🔧 Creating virtual environment..."
    python -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1

# Start the service in background
python main.py &
AGENT_SERVICE_PID=$!

# Wait for agent service to be ready
echo "⏳ Waiting for Agent Service to start..."
for i in {1..30}; do
    if curl -s http://localhost:8001/health > /dev/null 2>&1; then
        echo "✅ Agent Service is ready!"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo "❌ Agent Service failed to start"
        kill $AGENT_SERVICE_PID 2>/dev/null
        exit 1
    fi
done

# Build and start MCP Gateway
echo "🌉 Starting MCP Gateway..."
cd ../mcp-gateway

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "🔧 Installing Node.js dependencies..."
    npm install > /dev/null 2>&1
fi

# Build the project
npm run build > /dev/null 2>&1

echo ""
echo "🎉 Services are running!"
echo ""
echo "📊 Agent Service: http://localhost:8001"
echo "   • Health: http://localhost:8001/health"
echo "   • API Docs: http://localhost:8001/docs"
echo "   • Available Agents: http://localhost:8001/v1/agents/"
echo ""
echo "🌉 MCP Gateway: Ready for MCP connections"
echo "   • Path: $(pwd)/build/index.js"
echo "   • Config: Add to your MCP settings file"
echo ""
echo "🔧 To add MCP integration:"
echo "   1. Copy the configuration from mcp-config-example.json"
echo "   2. Update the path to match your installation"
echo "   3. Add to your MCP settings file"
echo ""
echo "💡 Example MCP tools to try:"
echo "   • get_agent_capabilities - Discover available agents"
echo "   • execute_agent - Run individual agents"
echo "   • execute_pipeline - Run complete workflows"
echo ""
echo "Press Ctrl+C to stop all services..."

# Keep the script running
wait $AGENT_SERVICE_PID

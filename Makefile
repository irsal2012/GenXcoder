# GenXcode Multi-Service Management
# Simple commands to manage all services

.PHONY: help start stop install clean docker-up docker-down test

# Default target
help:
	@echo "GenXcode Multi-Service Management"
	@echo "================================="
	@echo ""
	@echo "Available commands:"
	@echo "  make start        - Start all services (Python version)"
	@echo "  make start-sh     - Start all services (Shell version)"
	@echo "  make stop         - Stop all running services"
	@echo "  make install      - Install all dependencies"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make docker-up    - Start services with Docker Compose"
	@echo "  make docker-down  - Stop Docker Compose services"
	@echo "  make test         - Run basic health checks"
	@echo ""
	@echo "Services:"
	@echo "  • Backend API:     http://localhost:8000"
	@echo "  • Agent Service:   http://localhost:8001"
	@echo "  • Frontend:        http://localhost:5173"
	@echo "  • MCP Gateway:     Ready for MCP connections"

# Start all services using Python script
start:
	@echo "🚀 Starting all services with Python script..."
	./start_all_services.py

# Start all services using Shell script
start-sh:
	@echo "🚀 Starting all services with Shell script..."
	./start_all_services.sh

# Stop all running services
stop:
	@echo "🛑 Stopping all services..."
	@pkill -f "uvicorn.*main:app" || true
	@pkill -f "vite" || true
	@pkill -f "node.*build/index.js" || true
	@echo "✅ All services stopped"

# Install dependencies for all services
install:
	@echo "📦 Installing dependencies for all services..."
	@echo "Installing Python dependencies..."
	@if [ -f backend/requirements.txt ]; then pip install -r backend/requirements.txt; fi
	@if [ -f agent-service/requirements.txt ]; then pip install -r agent-service/requirements.txt; fi
	@echo "Installing Node.js dependencies..."
	@if [ -f frontend/package.json ]; then cd frontend && npm install; fi
	@if [ -f mcp-gateway/package.json ]; then cd mcp-gateway && npm install; fi
	@echo "Building MCP Gateway..."
	@if [ -f mcp-gateway/package.json ]; then cd mcp-gateway && npm run build; fi
	@echo "✅ All dependencies installed"

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf frontend/dist
	@rm -rf frontend/node_modules/.vite
	@rm -rf mcp-gateway/build
	@rm -rf mcp-gateway/node_modules/.cache
	@find . -name "*.pyc" -delete
	@find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ Build artifacts cleaned"

# Start services with Docker Compose
docker-up:
	@echo "🐳 Starting services with Docker Compose..."
	docker-compose up -d
	@echo "✅ Docker services started"
	@echo "Backend API: http://localhost:8000"
	@echo "Agent Service: http://localhost:8001"
	@echo "Frontend: http://localhost:3000"

# Stop Docker Compose services
docker-down:
	@echo "🐳 Stopping Docker Compose services..."
	docker-compose down
	@echo "✅ Docker services stopped"

# Run basic health checks
test:
	@echo "🔍 Running health checks..."
	@echo "Checking Backend API..."
	@curl -s http://localhost:8000/docs > /dev/null && echo "✅ Backend API is running" || echo "❌ Backend API is not responding"
	@echo "Checking Agent Service..."
	@curl -s http://localhost:8001/docs > /dev/null && echo "✅ Agent Service is running" || echo "❌ Agent Service is not responding"
	@echo "Checking Frontend..."
	@curl -s http://localhost:5173 > /dev/null && echo "✅ Frontend is running" || echo "❌ Frontend is not responding"

# Development shortcuts
dev: start
prod: docker-up

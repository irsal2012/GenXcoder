#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Function to print colored output
print_header() {
    echo -e "${PURPLE}${BOLD}"
    echo "=================================================="
    echo "🤖 GenXcode Agent Service Startup"
    echo "=================================================="
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${CYAN}$1${NC}"
}

# Function to handle cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down Agent Service...${NC}"
    if [ ! -z "$AGENT_PID" ]; then
        kill $AGENT_PID 2>/dev/null
        wait $AGENT_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local timeout=${2:-30}
    local count=0
    
    print_info "⏳ Waiting for Agent Service to be ready..."
    
    while [ $count -lt $timeout ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "Agent Service is ready!"
            return 0
        fi
        
        sleep 1
        count=$((count + 1))
        
        if [ $((count % 5)) -eq 0 ] && [ $count -gt 0 ]; then
            echo "  Still waiting... ($count/${timeout}s)"
        fi
    done
    
    print_warning "Agent Service health check timeout"
    return 1
}

# Function to print service information
print_service_info() {
    echo -e "\n${GREEN}${BOLD}🎉 Agent Service is running!${NC}"
    echo -e "\n${CYAN}📊 Service Information:${NC}"
    echo -e "  🤖 Agent Service: ${BLUE}http://localhost:8001${NC}"
    echo "    API Documentation: http://localhost:8001/docs"
    echo "    Health Check: http://localhost:8001/health"
    echo "    Available Endpoints:"
    echo "      • /v1/agents - Agent management"
    echo "      • /v1/pipelines - Pipeline execution"
    echo "      • /v1/capabilities - Service capabilities"
    echo ""
    echo -e "${YELLOW}💡 Tips:${NC}"
    echo "  • Press Ctrl+C to stop the service"
    echo "  • Check the logs above for any startup errors"
    echo "  • Use the /docs endpoint to explore the API"
    echo "  • Service runs on port 8001 (different from main backend on 8000)"
}

# Main execution
main() {
    print_header
    
    # Check if we're in the right directory
    if [ ! -d "agent-service" ]; then
        print_error "agent-service directory not found. Please run this script from the project root."
        exit 1
    fi
    
    # Check if Python is available
    if ! command_exists python3; then
        print_error "Python 3 is not installed or not in PATH"
        exit 1
    fi
    
    # Check if pip is available
    if ! command_exists pip3 && ! python3 -m pip --version >/dev/null 2>&1; then
        print_error "pip is not available"
        exit 1
    fi
    
    # Check if requirements file exists
    if [ ! -f "agent-service/requirements.txt" ]; then
        print_error "Requirements file not found!"
        exit 1
    fi
    print_success "Requirements file found"
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Make sure to configure your environment variables."
    else
        print_success ".env file found"
    fi
    
    # Check if port 8001 is available
    if ! check_port 8001; then
        print_error "Port 8001 is already in use. Please stop the service using that port."
        exit 1
    fi
    
    # Install requirements
    print_info "📦 Installing agent-service requirements..."
    if cd agent-service && python3 -m pip install -r requirements.txt; then
        print_success "Requirements installed successfully"
        cd ..
    else
        print_error "Failed to install requirements"
        exit 1
    fi
    
    # Check if main.py exists
    if [ ! -f "agent-service/main.py" ]; then
        print_error "Agent service main.py not found!"
        exit 1
    fi
    
    # Start the agent service
    print_success "🚀 Starting Agent Service..."
    
    cd agent-service
    python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8001 &
    AGENT_PID=$!
    cd ..
    
    # Wait a bit for service to start
    sleep 5
    
    # Check if the process is still running
    if ! kill -0 $AGENT_PID 2>/dev/null; then
        print_error "Agent Service failed to start"
        exit 1
    fi
    
    # Wait for service to be ready
    if wait_for_service "http://localhost:8001/health"; then
        print_service_info
        
        # Keep the service running
        print_info "📊 Agent Service is running... (Press Ctrl+C to stop)"
        wait $AGENT_PID
    else
        print_error "Agent Service failed to start properly"
        kill $AGENT_PID 2>/dev/null
        exit 1
    fi
}

# Run main function
main "$@"

#!/bin/bash

# GenXcode Multi-Service Startup Tool (Shell Version)
# Starts frontend, backend, agent service, and MCP gateway simultaneously

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Process tracking
PIDS=()
SERVICE_NAMES=()

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print header
print_header() {
    print_color $PURPLE "============================================================"
    print_color $PURPLE "🚀 GenXcode Multi-Service Startup Tool"
    print_color $PURPLE "============================================================"
}

# Function to cleanup on exit
cleanup() {
    print_color $YELLOW "\n🛑 Stopping all services..."
    
    for i in "${!PIDS[@]}"; do
        local pid=${PIDS[$i]}
        local name=${SERVICE_NAMES[$i]}
        
        if kill -0 $pid 2>/dev/null; then
            print_color $YELLOW "  🛑 Stopping $name (PID: $pid)..."
            kill -TERM $pid 2>/dev/null
            
            # Wait for graceful shutdown
            local count=0
            while kill -0 $pid 2>/dev/null && [ $count -lt 5 ]; do
                sleep 1
                ((count++))
            done
            
            # Force kill if still running
            if kill -0 $pid 2>/dev/null; then
                print_color $YELLOW "  💀 Force killing $name..."
                kill -KILL $pid 2>/dev/null
            fi
        fi
    done
    
    print_color $GREEN "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM EXIT

# Function to check dependencies
check_dependencies() {
    print_color $CYAN "🔍 Checking dependencies..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_color $RED "❌ Python 3 is not installed"
        return 1
    fi
    local python_version=$(python3 --version)
    print_color $GREEN "  ✓ $python_version"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_color $RED "❌ Node.js is not installed"
        return 1
    fi
    local node_version=$(node --version)
    print_color $GREEN "  ✓ Node.js $node_version"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_color $RED "❌ npm is not installed"
        return 1
    fi
    local npm_version=$(npm --version)
    print_color $GREEN "  ✓ npm $npm_version"
    
    # Check directories
    local dirs=("backend" "agent-service" "frontend" "mcp-gateway")
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            print_color $RED "❌ Directory not found: $dir"
            return 1
        fi
        print_color $GREEN "  ✓ Found $dir/"
    done
    
    return 0
}

# Function to install dependencies
install_dependencies() {
    print_color $CYAN "📦 Installing dependencies..."
    
    # Install Python dependencies
    for service in "backend" "agent-service"; do
        if [ -f "$service/requirements.txt" ]; then
            print_color $BLUE "  📦 Installing Python dependencies for $service..."
            if python3 -m pip install -r "$service/requirements.txt" > /dev/null 2>&1; then
                print_color $GREEN "  ✓ $service dependencies installed"
            else
                print_color $YELLOW "  ⚠️  Failed to install $service dependencies"
            fi
        fi
    done
    
    # Install Node.js dependencies and build
    for service in "frontend" "mcp-gateway"; do
        if [ -f "$service/package.json" ] && [ ! -d "$service/node_modules" ]; then
            print_color $BLUE "  📦 Installing Node.js dependencies for $service..."
            if (cd "$service" && npm install > /dev/null 2>&1); then
                print_color $GREEN "  ✓ $service dependencies installed"
            else
                print_color $YELLOW "  ⚠️  Failed to install $service dependencies"
            fi
        fi
    done
    
    # Build MCP Gateway
    if [ ! -d "mcp-gateway/build" ]; then
        print_color $BLUE "  🔨 Building MCP Gateway..."
        if (cd "mcp-gateway" && npm run build > /dev/null 2>&1); then
            print_color $GREEN "  ✓ MCP Gateway built successfully"
        else
            print_color $YELLOW "  ⚠️  Failed to build MCP Gateway"
        fi
    fi
}

# Function to start a service
start_service() {
    local name=$1
    local dir=$2
    local cmd=$3
    local port=$4
    
    print_color $BLUE "  🚀 Starting $name..."
    
    # Start the service in background
    (cd "$dir" && eval "$cmd") > "/tmp/${name,,}.log" 2>&1 &
    local pid=$!
    
    # Store PID and name
    PIDS+=($pid)
    SERVICE_NAMES+=("$name")
    
    # Wait a moment for startup
    sleep 2
    
    # Check if process is still running
    if kill -0 $pid 2>/dev/null; then
        print_color $GREEN "  ✅ $name started (PID: $pid)"
        
        # Health check for HTTP services
        if [ ! -z "$port" ]; then
            print_color $BLUE "  ⏳ Waiting for $name to be ready..."
            local count=0
            while [ $count -lt 30 ]; do
                if curl -s "http://localhost:$port" > /dev/null 2>&1; then
                    print_color $GREEN "  ✅ $name is ready!"
                    break
                fi
                sleep 1
                ((count++))
            done
            
            if [ $count -eq 30 ]; then
                print_color $YELLOW "  ⚠️  $name health check timeout"
            fi
        fi
    else
        print_color $RED "  ❌ Failed to start $name"
        # Remove from tracking arrays
        unset PIDS[-1]
        unset SERVICE_NAMES[-1]
    fi
}

# Function to start all services
start_all_services() {
    print_color $GREEN "🚀 Starting all services..."
    
    # Start services in order
    start_service "Backend API" "backend" "python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000" "8000"
    sleep 5
    
    start_service "Agent Service" "agent-service" "python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8001" "8001"
    sleep 5
    
    start_service "MCP Gateway" "mcp-gateway" "npm run dev" ""
    sleep 3
    
    start_service "Frontend" "frontend" "npm run dev" "5173"
    sleep 5
}

# Function to print service information
print_service_info() {
    print_color $GREEN "\n🎉 All services are running!"
    print_color $CYAN "\n📊 Service Information:"
    
    echo -e "  🔧 Backend API: ${BLUE}http://localhost:8000${NC}"
    echo -e "    API Documentation: http://localhost:8000/docs"
    echo ""
    
    echo -e "  🤖 Agent Service: ${BLUE}http://localhost:8001${NC}"
    echo -e "    API Documentation: http://localhost:8001/docs"
    echo ""
    
    echo -e "  🌐 Frontend: ${BLUE}http://localhost:5173${NC}"
    echo -e "    React application with Vite"
    echo ""
    
    echo -e "  🌉 MCP Gateway: ${BLUE}Ready for MCP connections${NC}"
    echo -e "    Use with MCP-compatible tools"
    echo ""
    
    print_color $YELLOW "💡 Tips:"
    echo "  • Press Ctrl+C to stop all services"
    echo "  • Check logs in /tmp/ for debugging"
    echo "  • Make sure all required dependencies are installed"
    echo -e "  • Use ${BLUE}docker-compose up${NC} for containerized deployment"
}

# Function to monitor services
monitor_services() {
    print_color $CYAN "\n📊 Monitoring services... (Press Ctrl+C to stop)"
    
    while true; do
        # Check if any process has died
        for i in "${!PIDS[@]}"; do
            local pid=${PIDS[$i]}
            local name=${SERVICE_NAMES[$i]}
            
            if ! kill -0 $pid 2>/dev/null; then
                print_color $RED "\n💀 $name has stopped unexpectedly"
                # Remove from arrays
                unset PIDS[$i]
                unset SERVICE_NAMES[$i]
            fi
        done
        
        # If all processes are dead, exit
        if [ ${#PIDS[@]} -eq 0 ]; then
            print_color $RED "❌ All services have stopped"
            break
        fi
        
        sleep 5
    done
}

# Main execution
main() {
    print_header
    
    # Check dependencies
    if ! check_dependencies; then
        print_color $RED "❌ Dependency check failed. Please install missing dependencies."
        exit 1
    fi
    
    # Install dependencies
    install_dependencies
    
    # Start all services
    start_all_services
    
    # Check if any services started
    if [ ${#PIDS[@]} -eq 0 ]; then
        print_color $RED "❌ No services were started successfully"
        exit 1
    fi
    
    # Print service information
    print_service_info
    
    # Monitor services
    monitor_services
}

# Run main function
main "$@"

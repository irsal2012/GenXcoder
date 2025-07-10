#!/bin/bash

# Agent API Test Runner Script
# This script sets up the environment and runs tests for the agent-service API

set -e  # Exit on any error

echo "=== Agent API Test Runner ==="
echo "Testing agent-service API endpoints"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
AGENT_SERVICE_URL="http://localhost:8001"
TEST_MODE="pytest"
INSTALL_DEPS=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            AGENT_SERVICE_URL="$2"
            shift 2
            ;;
        --manual)
            TEST_MODE="manual"
            shift
            ;;
        --install-deps)
            INSTALL_DEPS=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo
            echo "Options:"
            echo "  --url URL          Agent service URL (default: http://localhost:8001)"
            echo "  --manual           Run manual tests instead of pytest"
            echo "  --install-deps     Install test dependencies before running"
            echo "  --help             Show this help message"
            echo
            echo "Examples:"
            echo "  $0                                    # Run pytest tests with default URL"
            echo "  $0 --manual                          # Run manual tests"
            echo "  $0 --url http://localhost:8002       # Use custom URL"
            echo "  $0 --install-deps --manual           # Install deps and run manual tests"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "Configuration:"
echo "  Agent Service URL: $AGENT_SERVICE_URL"
echo "  Test Mode: $TEST_MODE"
echo "  Install Dependencies: $INSTALL_DEPS"
echo

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if agent service is running
check_agent_service() {
    echo "Checking if agent service is running at $AGENT_SERVICE_URL..."
    
    if command_exists curl; then
        if curl -s --connect-timeout 5 "$AGENT_SERVICE_URL/agents/" >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Agent service is running${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠ Agent service is not responding at $AGENT_SERVICE_URL${NC}"
            echo "  Make sure the agent service is started:"
            echo "  cd agent-service && python main.py"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠ curl not found, skipping connectivity check${NC}"
        return 0
    fi
}

# Function to install dependencies
install_dependencies() {
    echo "Installing test dependencies..."
    
    if command_exists pip; then
        pip install -r test_requirements.txt
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${RED}✗ pip not found. Please install Python and pip first.${NC}"
        exit 1
    fi
}

# Function to run pytest tests
run_pytest_tests() {
    echo "Running pytest tests..."
    
    if command_exists pytest; then
        python test_agents_api.py --url "$AGENT_SERVICE_URL"
    else
        echo -e "${YELLOW}⚠ pytest not found, falling back to manual tests${NC}"
        run_manual_tests
    fi
}

# Function to run manual tests
run_manual_tests() {
    echo "Running manual tests..."
    python test_agents_api.py --manual --url "$AGENT_SERVICE_URL"
}

# Main execution
main() {
    # Install dependencies if requested
    if [ "$INSTALL_DEPS" = true ]; then
        install_dependencies
        echo
    fi
    
    # Check if Python is available
    if ! command_exists python && ! command_exists python3; then
        echo -e "${RED}✗ Python not found. Please install Python 3.7+${NC}"
        exit 1
    fi
    
    # Use python3 if python is not available
    if ! command_exists python && command_exists python3; then
        alias python=python3
    fi
    
    # Check agent service connectivity
    check_agent_service
    echo
    
    # Run tests based on mode
    case $TEST_MODE in
        "pytest")
            run_pytest_tests
            ;;
        "manual")
            run_manual_tests
            ;;
        *)
            echo -e "${RED}✗ Unknown test mode: $TEST_MODE${NC}"
            exit 1
            ;;
    esac
    
    echo
    echo -e "${GREEN}=== Test execution completed ===${NC}"
}

# Run main function
main "$@"

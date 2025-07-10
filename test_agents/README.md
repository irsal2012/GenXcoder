# Agent Service API Test Suite

This folder contains a comprehensive test suite for the agent-service agents.py API.

## Quick Start

```bash
# Navigate to this directory
cd test_agents

# Run tests with the shell script (recommended)
./run_agent_tests.sh --manual

# Or run directly with Python
python test_agents_api.py --manual
```

## Files

- **`test_agents_api.py`** - Main test script with comprehensive API coverage
- **`run_agent_tests.sh`** - Shell script for easy test execution
- **`test_requirements.txt`** - Python dependencies
- **`AGENT_API_TESTING_README.md`** - Detailed documentation
- **`AGENT_API_TEST_SUMMARY.md`** - Implementation summary

## Prerequisites

1. Python 3.7+ installed
2. Agent service running on `http://localhost:8001`
3. Dependencies installed: `pip install -r test_requirements.txt`

## Usage Examples

```bash
# Install dependencies and run manual tests
./run_agent_tests.sh --install-deps --manual

# Run with custom URL
./run_agent_tests.sh --url http://localhost:8002

# Get help
./run_agent_tests.sh --help
```

For detailed documentation, see `AGENT_API_TESTING_README.md`.

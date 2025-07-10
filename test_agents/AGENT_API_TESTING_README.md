# Agent Service API Testing Suite

This comprehensive testing suite provides automated and manual testing capabilities for the agent-service API endpoints. It covers all the main functionality including agent execution, metadata retrieval, status monitoring, and error handling.

## Overview

The agent-service API provides the following main endpoints:
- `GET /agents/` - List all available agents
- `GET /agents/{agent_name}/metadata` - Get agent metadata
- `POST /agents/{agent_name}/execute` - Execute an agent
- `GET /agents/{agent_name}/validate` - Validate agent input
- `GET /agents/execution/{execution_id}/status` - Get execution status
- `GET /agents/execution/{execution_id}/stream` - Stream execution status

## Files

### Core Test Files
- **`test_agents_api.py`** - Main test script with comprehensive test cases
- **`test_requirements.txt`** - Python dependencies for testing
- **`run_agent_tests.sh`** - Shell script to run tests easily

### Test Documentation
- **`AGENT_API_TESTING_README.md`** - This documentation file

## Prerequisites

1. **Python 3.7+** installed on your system
2. **Agent service** running on `http://localhost:8001` (or custom URL)
3. **Test dependencies** installed (can be auto-installed)

## Quick Start

### 1. Install Dependencies (Optional)
```bash
# Install test dependencies
pip install -r test_requirements.txt
```

### 2. Start Agent Service
Make sure your agent service is running:
```bash
cd agent-service
python main.py
```

### 3. Run Tests

#### Option A: Using the Shell Script (Recommended)
```bash
# Navigate to test directory
cd test_agents

# Run with default settings
./run_agent_tests.sh

# Run manual tests
./run_agent_tests.sh --manual

# Install dependencies and run tests
./run_agent_tests.sh --install-deps

# Use custom URL
./run_agent_tests.sh --url http://localhost:8002

# Get help
./run_agent_tests.sh --help
```

#### Option B: Direct Python Execution
```bash
# Navigate to test directory
cd test_agents

# Run with pytest
python test_agents_api.py

# Run manual tests
python test_agents_api.py --manual

# Use custom URL
python test_agents_api.py --url http://localhost:8002
```

## Test Categories

### 1. Basic API Tests (`TestAgentsAPI`)

#### Agent Discovery Tests
- **`test_list_available_agents`** - Tests GET /agents/ endpoint
  - Validates response structure
  - Checks agent metadata format
  - Returns list of available agents

#### Metadata Tests
- **`test_get_agent_metadata_success`** - Tests successful metadata retrieval
  - Validates metadata structure
  - Checks required fields
- **`test_get_agent_metadata_not_found`** - Tests 404 error handling

#### Agent Execution Tests
- **`test_execute_agent_sync_success`** - Tests synchronous agent execution
  - Validates request/response format
  - Checks execution ID generation
  - Stores execution IDs for status tests
- **`test_execute_agent_async_success`** - Tests asynchronous execution
  - Validates background task initiation
  - Checks status tracking
- **`test_execute_agent_invalid_agent`** - Tests error handling for invalid agents

#### Input Validation Tests
- **`test_validate_agent_input_success`** - Tests input validation endpoint
  - Validates input format checking
  - Tests validation response structure

#### Status Monitoring Tests
- **`test_get_execution_status`** - Tests execution status retrieval
  - Uses execution IDs from previous tests
  - Validates status response format
- **`test_get_execution_status_not_found`** - Tests 404 for invalid execution IDs
- **`test_stream_execution_status`** - Tests Server-Sent Events streaming
  - Validates streaming response
  - Tests timeout handling

#### Error Handling Tests
- **`test_invalid_request_formats`** - Tests various invalid request formats
  - Empty requests
  - Invalid field names
  - Null values
  - Validates proper error responses

### 2. Integration Tests (`TestAgentsAPIIntegration`)

#### Full Workflow Tests
- **`test_full_agent_execution_workflow`** - End-to-end testing
  - Execute agent → Monitor status → Get results
  - Tests complete workflow integration
  - Validates state transitions

## Test Features

### Robust Error Handling
- Graceful handling when agent service is not running
- Proper skipping of tests that require service connectivity
- Clear error messages and status reporting

### Flexible Configuration
- Configurable agent service URL
- Support for both pytest and manual test modes
- Optional dependency installation

### Comprehensive Coverage
- All API endpoints tested
- Success and error scenarios covered
- Edge cases and invalid inputs tested
- Real-world workflow simulation

### Detailed Reporting
- Color-coded output for easy reading
- Detailed test descriptions and results
- Execution ID tracking across tests
- Service connectivity verification

## Test Output Examples

### Successful Test Run
```
=== Testing List Available Agents ===
Status Code: 200
✓ Found 5 agents

=== Testing Get Agent Metadata (Success) ===
Testing agent: python_coder
Status Code: 200
✓ Successfully retrieved metadata for python_coder

=== Testing Execute Agent (Sync Success) ===
Testing agent: python_coder
Status Code: 200
✓ Successfully executed agent python_coder
✓ Execution ID: exec-123e4567-e89b-12d3-a456-426614174000
```

### Service Not Running
```
=== Manual Agent API Tests ===
✗ Cannot connect to agent service: Connection refused
Make sure the agent service is running on http://localhost:8001
```

## Customization

### Adding New Tests
To add new test cases, extend the `TestAgentsAPI` class:

```python
def test_new_functionality(self):
    """Test new API functionality"""
    print("\n=== Testing New Functionality ===")
    
    response = self.session.get(f"{AGENTS_ENDPOINT}/new-endpoint")
    
    assert response.status_code == 200
    # Add your assertions here
    
    print("✓ New functionality test passed")
```

### Custom Configuration
Modify the test configuration at the top of `test_agents_api.py`:

```python
# Test configuration
BASE_URL = "http://localhost:8001"  # Change default URL
AGENTS_ENDPOINT = f"{BASE_URL}/agents"
```

## Troubleshooting

### Common Issues

1. **"Agent service not available"**
   - Ensure agent service is running: `cd agent-service && python main.py`
   - Check the URL is correct
   - Verify firewall/network settings

2. **"No agents available for testing"**
   - Check agent service logs for initialization errors
   - Verify agent factory is discovering agents properly
   - Ensure agent classes are properly registered

3. **"pytest not found"**
   - Install test dependencies: `pip install -r test_requirements.txt`
   - Or use manual mode: `./run_agent_tests.sh --manual`

4. **Permission denied on shell script**
   - Make script executable: `chmod +x run_agent_tests.sh`

### Debug Mode
For detailed debugging, modify the test script to include more verbose output:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Agent API Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.8
    - name: Install dependencies
      run: pip install -r test_requirements.txt
    - name: Start agent service
      run: |
        cd agent-service
        python main.py &
        sleep 10
    - name: Run tests
      run: python test_agents_api.py
```

### Jenkins Pipeline Example
```groovy
pipeline {
    agent any
    stages {
        stage('Setup') {
            steps {
                sh 'pip install -r test_requirements.txt'
            }
        }
        stage('Start Services') {
            steps {
                sh 'cd agent-service && python main.py &'
                sh 'sleep 10'
            }
        }
        stage('Test') {
            steps {
                sh './run_agent_tests.sh'
            }
        }
    }
}
```

## Contributing

When adding new tests or modifying existing ones:

1. Follow the existing test naming convention
2. Add comprehensive docstrings
3. Include both success and error test cases
4. Update this README if adding new test categories
5. Ensure tests are independent and can run in any order

## License

This testing suite is part of the GenXcoder project and follows the same license terms.

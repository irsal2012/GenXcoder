# Capabilities API Test Suite

This directory contains comprehensive test scripts for the agent-service capabilities API. The test suite validates all endpoints and functionality provided by the `capabilities.py` API routes.

## 📁 Files Overview

### Test Scripts
- **`test_capabilities_api.py`** - Main comprehensive test script with detailed logging
- **`test_capabilities_pytest.py`** - Pytest-based structured tests for CI/CD integration
- **`run_capabilities_tests.sh`** - Bash script to run all tests with environment setup

### Configuration
- **`requirements.txt`** - Python dependencies for running tests
- **`README.md`** - This documentation file

## 🎯 API Endpoints Tested

The test suite covers all endpoints in the capabilities API:

### Core Endpoints
1. **`GET /v1/capabilities/`** - Get comprehensive capabilities information
2. **`GET /v1/capabilities/summary`** - Get high-level service summary
3. **`GET /v1/capabilities/agents`** - Get agent-specific capabilities
4. **`GET /v1/capabilities/pipelines`** - Get pipeline execution capabilities
5. **`GET /v1/capabilities/config-types`** - Get configuration type information
6. **`GET /v1/capabilities/health`** - Get service health status
7. **`GET /v1/capabilities/openapi-schema`** - Get OpenAPI schema information

### Error Handling
- Invalid endpoint handling (404 responses)
- Malformed request handling
- Service unavailability scenarios

## 🚀 Quick Start

### Prerequisites
- Python 3.7+
- Agent service running on `http://localhost:8001`
- Internet connection for dependency installation

### Running Tests

#### Option 1: Use the automated script (Recommended)
```bash
cd test_capabilities
./run_capabilities_tests.sh
```

#### Option 2: Manual setup and execution
```bash
cd test_capabilities

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run comprehensive tests
python test_capabilities_api.py

# Run pytest-based tests
pytest test_capabilities_pytest.py -v
```

#### Option 3: Run specific tests
```bash
# Test only connection
python test_capabilities_api.py --test connection

# Test only health endpoint
python test_capabilities_api.py --test health

# Test only agents endpoint
python test_capabilities_api.py --test agents

# Test all endpoints
python test_capabilities_api.py --test all
```

## 📊 Test Categories

### 1. Connection Tests
- Service availability check
- Network connectivity validation
- Basic health endpoint verification

### 2. Endpoint Validation Tests
- HTTP status code verification
- Response format validation
- Required field presence checks
- Data type validation

### 3. Data Consistency Tests
- Cross-endpoint data consistency
- Agent count consistency
- Service information consistency

### 4. Performance Tests
- Response time validation
- Timeout handling
- Concurrent request handling

### 5. Error Handling Tests
- Invalid endpoint responses
- Malformed request handling
- Service error scenarios

### 6. Integration Tests
- Service startup sequence validation
- End-to-end workflow testing
- Multi-endpoint interaction testing

## 🔧 Test Configuration

### Environment Variables
- `BASE_URL` - Agent service base URL (default: `http://localhost:8001`)

### Test Parameters
- Connection timeout: 5 seconds
- Response timeout: 10 seconds
- Maximum response time: 5 seconds

### Customization
You can customize test behavior by modifying:
- Base URL in test scripts
- Timeout values
- Expected response structures
- Validation criteria

## 📈 Test Output

### Comprehensive Test Script Output
```
🚀 Starting Capabilities API Tests
==================================================
📡 Checking if agent service is running...
✅ Agent service is running

📋 Running test: get_all_capabilities
------------------------------
✅ GET /v1/capabilities/ successful
✅ Found expected field: service_info
✅ Found expected field: total_agents
✅ Found expected field: agents
✅ get_all_capabilities PASSED

...

📊 TEST SUMMARY
==================================================
Total tests: 8
Passed: 8
Failed: 0
✅ get_all_capabilities: PASSED
✅ get_capabilities_summary: PASSED
✅ get_agent_capabilities: PASSED
✅ get_pipeline_capabilities: PASSED
✅ get_config_types: PASSED
✅ get_service_health: PASSED
✅ get_openapi_schema: PASSED
✅ error_handling: PASSED
```

### Pytest Output
```
test_capabilities_pytest.py::TestCapabilitiesAPI::test_service_health PASSED
test_capabilities_pytest.py::TestCapabilitiesAPI::test_get_all_capabilities PASSED
test_capabilities_pytest.py::TestCapabilitiesAPI::test_get_capabilities_summary PASSED
test_capabilities_pytest.py::TestCapabilitiesAPI::test_get_agent_capabilities PASSED
test_capabilities_pytest.py::TestCapabilitiesAPI::test_get_pipeline_capabilities PASSED
test_capabilities_pytest.py::TestCapabilitiesAPI::test_get_config_types PASSED
test_capabilities_pytest.py::TestCapabilitiesAPI::test_get_openapi_schema PASSED
test_capabilities_pytest.py::TestCapabilitiesAPI::test_invalid_endpoint_404 PASSED
test_capabilities_pytest.py::TestCapabilitiesAPI::test_all_endpoints_return_json PASSED
test_capabilities_pytest.py::TestCapabilitiesAPI::test_response_times PASSED
test_capabilities_pytest.py::TestCapabilitiesIntegration::test_service_startup_sequence PASSED
test_capabilities_pytest.py::TestCapabilitiesIntegration::test_data_consistency PASSED

============== 12 passed in 2.34s ==============
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Agent Service Not Running
```
❌ Cannot connect to agent service: Connection refused
```
**Solution:** Start the agent service:
```bash
cd agent-service
python main.py
```

#### 2. Port Already in Use
```
❌ Agent service health check failed: 404
```
**Solution:** Check if service is running on correct port or update BASE_URL

#### 3. Missing Dependencies
```
ModuleNotFoundError: No module named 'requests'
```
**Solution:** Install dependencies:
```bash
pip install -r requirements.txt
```

#### 4. Permission Denied on Script
```
bash: ./run_capabilities_tests.sh: Permission denied
```
**Solution:** Make script executable:
```bash
chmod +x run_capabilities_tests.sh
```

### Debug Mode
For detailed debugging, you can:

1. **Enable verbose logging:**
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

2. **Add response debugging:**
```python
print(f"Response: {response.text}")
print(f"Headers: {response.headers}")
```

3. **Use pytest with verbose output:**
```bash
pytest test_capabilities_pytest.py -v -s
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Capabilities API Tests
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
    - name: Start Agent Service
      run: |
        cd agent-service
        python main.py &
        sleep 10
    - name: Run Tests
      run: |
        cd test_capabilities
        pip install -r requirements.txt
        pytest test_capabilities_pytest.py -v
```

### Jenkins Pipeline Example
```groovy
pipeline {
    agent any
    stages {
        stage('Setup') {
            steps {
                sh 'cd agent-service && python main.py &'
                sh 'sleep 10'
            }
        }
        stage('Test') {
            steps {
                sh 'cd test_capabilities && pip install -r requirements.txt'
                sh 'cd test_capabilities && pytest test_capabilities_pytest.py -v --junitxml=results.xml'
            }
        }
    }
    post {
        always {
            junit 'test_capabilities/results.xml'
        }
    }
}
```

## 📝 Test Development

### Adding New Tests

1. **For comprehensive test script:**
```python
def test_new_endpoint(self) -> Dict[str, Any]:
    """Test new endpoint functionality"""
    logger.info("Testing new endpoint")
    
    response = self.session.get(f"{self.base_url}/v1/capabilities/new-endpoint")
    assert response.status_code == 200
    
    data = response.json()
    # Add validations
    
    return data
```

2. **For pytest-based tests:**
```python
def test_new_endpoint(self):
    """Test new endpoint functionality"""
    response = self.session.get(f"{self.base_url}/v1/capabilities/new-endpoint")
    assert response.status_code == 200
    
    data = response.json()
    # Add assertions
```

### Test Best Practices

1. **Always validate response structure**
2. **Check for required fields**
3. **Validate data types**
4. **Test error conditions**
5. **Ensure data consistency**
6. **Add meaningful assertions**
7. **Use descriptive test names**
8. **Include proper error messages**

## 📚 API Documentation Reference

For detailed API documentation, refer to:
- `agent-service/api/routes/capabilities.py` - Source code
- OpenAPI schema endpoint: `GET /v1/capabilities/openapi-schema`
- Service health: `GET /v1/capabilities/health`

## 🤝 Contributing

When contributing to the test suite:

1. **Follow existing patterns**
2. **Add tests for new endpoints**
3. **Update documentation**
4. **Ensure all tests pass**
5. **Add meaningful test descriptions**
6. **Include error scenarios**

## 📄 License

This test suite is part of the GenXcoder project and follows the same licensing terms.

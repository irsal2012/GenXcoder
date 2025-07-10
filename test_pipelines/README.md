# Pipelines API Test Suite

This directory contains comprehensive test scripts for the agent-service pipelines API. The test suite validates all endpoints and functionality provided by the `pipelines.py` API routes.

## 📁 Files Overview

### Test Scripts
- **`test_pipelines_api.py`** - Main comprehensive test script with detailed logging and interactive CLI
- **`test_pipelines_pytest.py`** - Pytest-based structured tests for CI/CD integration
- **`run_pipelines_tests.sh`** - Automated bash script to run all tests with environment setup

### Configuration
- **`requirements.txt`** - Python dependencies for running tests
- **`README.md`** - This documentation file

## 🎯 API Endpoints Tested

The test suite covers all endpoints in the pipelines API:

### Core Endpoints
1. **`POST /v1/pipelines/initialize`** - Initialize a pipeline configuration
2. **`GET /v1/pipelines/info`** - Get current pipeline information
3. **`POST /v1/pipelines/validate`** - Validate input data for pipeline execution
4. **`POST /v1/pipelines/execute`** - Execute pipeline (sync/async modes)
5. **`GET /v1/pipelines/execution/{id}/status`** - Get execution status
6. **`GET /v1/pipelines/execution/{id}/stream`** - Stream execution status (SSE)
7. **`GET /v1/pipelines/`** - List all pipeline executions
8. **`DELETE /v1/pipelines/clear`** - Clear pipeline and reset agents

### Advanced Features
- **Synchronous execution** - Immediate pipeline execution with results
- **Asynchronous execution** - Background pipeline execution with tracking
- **Real-time streaming** - Server-Sent Events for live progress updates
- **Execution tracking** - Status monitoring and result retrieval
- **Input validation** - Pre-execution validation with suggestions

## 🚀 Quick Start

### Prerequisites
- Python 3.7+
- Agent service running on `http://localhost:8001`
- Internet connection for dependency installation

### Running Tests

#### Option 1: Use the automated script (Recommended)
```bash
cd test_pipelines
./run_pipelines_tests.sh
```

#### Option 2: Manual setup and execution
```bash
cd test_pipelines

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run comprehensive tests
python test_pipelines_api.py

# Run pytest-based tests
pytest test_pipelines_pytest.py -v
```

#### Option 3: Run specific tests
```bash
# Test only connection
python test_pipelines_api.py --test connection

# Test only initialization
python test_pipelines_api.py --test initialize

# Test only synchronous execution
python test_pipelines_api.py --test execute_sync

# Test only asynchronous execution
python test_pipelines_api.py --test execute_async

# Test all endpoints
python test_pipelines_api.py --test all
```

## 📊 Test Categories

### 1. Connection Tests
- Service availability check
- Network connectivity validation
- Basic endpoint accessibility

### 2. Pipeline Management Tests
- Pipeline initialization
- Configuration loading
- Pipeline information retrieval
- Pipeline clearing and reset

### 3. Input Validation Tests
- Input data validation
- Schema compliance checks
- Error message validation
- Suggestion generation

### 4. Execution Tests
- Synchronous pipeline execution
- Asynchronous pipeline execution
- Execution ID generation
- Status tracking
- Result retrieval

### 5. Streaming Tests
- Server-Sent Events connection
- Real-time progress updates
- Stream data validation
- Connection handling

### 6. Status Monitoring Tests
- Execution status retrieval
- Progress tracking
- Completion detection
- Error state handling

### 7. Error Handling Tests
- Invalid execution IDs
- Malformed requests
- Service error scenarios
- Timeout handling

### 8. Integration Tests
- End-to-end workflow testing
- Multi-step pipeline execution
- Cross-endpoint data consistency
- Complete lifecycle validation

## 🔧 Test Configuration

### Environment Variables
- `BASE_URL` - Agent service base URL (default: `http://localhost:8001`)

### Test Parameters
- Connection timeout: 5 seconds
- Execution timeout: 60 seconds (sync), 10 seconds (async start)
- Stream timeout: 10 seconds
- Status check interval: 1 second

### Customization
You can customize test behavior by modifying:
- Base URL in test scripts
- Timeout values
- Test input data
- Pipeline configurations
- Validation criteria

## 📈 Test Output

### Comprehensive Test Script Output
```
🚀 Starting Pipelines API Tests
==================================================
📡 Checking if agent service is running...
✅ Agent service is running

📋 Running test: initialize_pipeline
------------------------------
✅ POST /v1/pipelines/initialize successful
✅ Found expected field: success
✅ Found expected field: message
✅ initialize_pipeline PASSED

📋 Running test: execute_pipeline_async
------------------------------
✅ POST /v1/pipelines/execute (async) successful
✅ Found expected field: execution_id
📝 Tracked execution ID: 12345678-1234-5678-9012-123456789abc
✅ Asynchronous execution started with status: running
✅ execute_pipeline_async PASSED

...

📊 TEST SUMMARY
==================================================
Total tests: 10
Passed: 10
Failed: 0
✅ initialize_pipeline: PASSED
✅ get_pipeline_info: PASSED
✅ validate_pipeline_input: PASSED
✅ execute_pipeline_sync: PASSED
✅ execute_pipeline_async: PASSED
✅ get_execution_status: PASSED
✅ stream_execution_status: PASSED
✅ list_pipeline_executions: PASSED
✅ clear_pipeline: PASSED
✅ error_handling: PASSED
```

### Pytest Output
```
test_pipelines_pytest.py::TestPipelinesAPI::test_pipeline_initialization PASSED
test_pipelines_pytest.py::TestPipelinesAPI::test_get_pipeline_info PASSED
test_pipelines_pytest.py::TestPipelinesAPI::test_validate_pipeline_input PASSED
test_pipelines_pytest.py::TestPipelinesAPI::test_execute_pipeline_sync PASSED
test_pipelines_pytest.py::TestPipelinesAPI::test_execute_pipeline_async PASSED
test_pipelines_pytest.py::TestPipelinesAPI::test_get_execution_status PASSED
test_pipelines_pytest.py::TestPipelinesAPI::test_stream_execution_status PASSED
test_pipelines_pytest.py::TestPipelinesAPI::test_list_pipeline_executions PASSED
test_pipelines_pytest.py::TestPipelinesAPI::test_clear_pipeline PASSED
test_pipelines_pytest.py::TestPipelinesAPI::test_invalid_execution_id PASSED
test_pipelines_pytest.py::TestPipelinesAPI::test_invalid_pipeline_execution PASSED
test_pipelines_pytest.py::TestPipelinesIntegration::test_full_pipeline_workflow PASSED

============== 12 passed in 45.67s ==============
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

#### 2. Pipeline Execution Timeout
```
❌ POST /v1/pipelines/execute (sync) failed: Read timeout
```
**Solution:** Increase timeout or use async execution:
```python
# Increase timeout
response = session.post(url, json=data, timeout=120)

# Or use async execution
request_payload["async_execution"] = True
```

#### 3. Execution Not Found
```
⚠️ Execution 12345 not found (404)
```
**Solution:** Check execution ID or wait for execution to start:
```python
time.sleep(2)  # Wait for async execution to initialize
```

#### 4. Stream Connection Issues
```
❌ Stream execution status failed: Connection error
```
**Solution:** Check network connectivity and service status:
```bash
curl -N http://localhost:8001/v1/pipelines/execution/{id}/stream
```

#### 5. Missing Dependencies
```
ModuleNotFoundError: No module named 'pytest-asyncio'
```
**Solution:** Install all dependencies:
```bash
pip install -r requirements.txt
```

### Debug Mode
For detailed debugging, you can:

1. **Enable verbose logging:**
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

2. **Add execution debugging:**
```python
print(f"Execution ID: {execution_id}")
print(f"Status: {status_response.json()}")
```

3. **Use pytest with verbose output:**
```bash
pytest test_pipelines_pytest.py -v -s --tb=long
```

4. **Test individual endpoints:**
```bash
curl -X POST http://localhost:8001/v1/pipelines/initialize?pipeline_name=default
curl http://localhost:8001/v1/pipelines/info
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Pipelines API Tests
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
        sleep 15
    - name: Run Tests
      run: |
        cd test_pipelines
        pip install -r requirements.txt
        pytest test_pipelines_pytest.py -v --tb=short
```

### Jenkins Pipeline Example
```groovy
pipeline {
    agent any
    stages {
        stage('Setup') {
            steps {
                sh 'cd agent-service && python main.py &'
                sh 'sleep 15'
            }
        }
        stage('Test') {
            steps {
                sh 'cd test_pipelines && pip install -r requirements.txt'
                sh 'cd test_pipelines && pytest test_pipelines_pytest.py -v --junitxml=results.xml'
            }
        }
    }
    post {
        always {
            junit 'test_pipelines/results.xml'
        }
    }
}
```

## 📝 Test Development

### Adding New Tests

1. **For comprehensive test script:**
```python
def test_new_feature(self) -> Dict[str, Any]:
    """Test new pipeline feature"""
    logger.info("Testing new feature")
    
    response = self.session.post(f"{self.base_url}/v1/pipelines/new-feature")
    assert response.status_code == 200
    
    data = response.json()
    # Add validations
    
    return data
```

2. **For pytest-based tests:**
```python
def test_new_feature(self):
    """Test new pipeline feature"""
    response = self.session.post(f"{self.base_url}/v1/pipelines/new-feature")
    assert response.status_code == 200
    
    data = response.json()
    # Add assertions
```

### Test Best Practices

1. **Always initialize pipeline before execution tests**
2. **Use unique correlation IDs for tracking**
3. **Clean up executions after tests**
4. **Test both sync and async execution modes**
5. **Validate streaming functionality**
6. **Test error conditions and edge cases**
7. **Use meaningful test data**
8. **Include timeout handling**

## 📚 API Documentation Reference

For detailed API documentation, refer to:
- `agent-service/api/routes/pipelines.py` - Source code
- Pipeline execution models: `agent-service/models/requests.py`
- Response schemas: `agent-service/models/responses.py`

## 🤝 Contributing

When contributing to the test suite:

1. **Follow existing patterns**
2. **Add tests for new endpoints**
3. **Update documentation**
4. **Ensure all tests pass**
5. **Add meaningful test descriptions**
6. **Include both positive and negative test cases**
7. **Test async and streaming functionality**

## 📄 License

This test suite is part of the GenXcoder project and follows the same licensing terms.

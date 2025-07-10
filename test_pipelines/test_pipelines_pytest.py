"""
Pytest-based tests for agent-service pipelines API
"""

import pytest
import requests
import json
import time
import uuid
from typing import Dict, Any

BASE_URL = "http://localhost:8001"

class TestPipelinesAPI:
    """Pytest test class for pipelines API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_execution_ids = []
    
    def teardown_method(self):
        """Cleanup after each test"""
        # Clear pipeline to clean up any running executions
        try:
            self.session.delete(f"{self.base_url}/v1/pipelines/clear")
        except:
            pass
    
    def test_pipeline_initialization(self):
        """Test pipeline initialization"""
        response = self.session.post(
            f"{self.base_url}/v1/pipelines/initialize",
            params={"pipeline_name": "default"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') is True
        assert 'message' in data
    
    def test_get_pipeline_info(self):
        """Test getting pipeline information"""
        # First initialize a pipeline
        self.session.post(
            f"{self.base_url}/v1/pipelines/initialize",
            params={"pipeline_name": "default"}
        )
        
        response = self.session.get(f"{self.base_url}/v1/pipelines/info")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, dict)
        
        if data.get('pipeline_loaded'):
            assert 'pipeline_info' in data
            assert 'active_agents' in data
        else:
            assert 'message' in data
    
    def test_validate_pipeline_input(self):
        """Test input validation"""
        input_data = {
            "requirement": "Create a simple Python calculator",
            "type": "python_project"
        }
        
        response = self.session.post(
            f"{self.base_url}/v1/pipelines/validate",
            json=input_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert 'validation' in data
        assert 'input_data' in data
        assert data['input_data'] == input_data
    
    def test_execute_pipeline_sync(self):
        """Test synchronous pipeline execution"""
        # Initialize pipeline first
        self.session.post(
            f"{self.base_url}/v1/pipelines/initialize",
            params={"pipeline_name": "default"}
        )
        
        input_data = {
            "requirement": "Create a simple Python hello world script",
            "type": "python_project"
        }
        
        request_payload = {
            "input_data": input_data,
            "pipeline_name": "default",
            "async_execution": False,
            "correlation_id": str(uuid.uuid4())
        }
        
        response = self.session.post(
            f"{self.base_url}/v1/pipelines/execute",
            json=request_payload,
            timeout=60
        )
        assert response.status_code == 200
        
        data = response.json()
        assert 'execution_id' in data
        assert 'pipeline_name' in data
        assert 'status' in data
        
        # Track for cleanup
        if 'execution_id' in data:
            self.test_execution_ids.append(data['execution_id'])
    
    def test_execute_pipeline_async(self):
        """Test asynchronous pipeline execution"""
        # Initialize pipeline first
        self.session.post(
            f"{self.base_url}/v1/pipelines/initialize",
            params={"pipeline_name": "default"}
        )
        
        input_data = {
            "requirement": "Create a simple Python function to add two numbers",
            "type": "python_project"
        }
        
        request_payload = {
            "input_data": input_data,
            "pipeline_name": "default",
            "async_execution": True,
            "correlation_id": str(uuid.uuid4())
        }
        
        response = self.session.post(
            f"{self.base_url}/v1/pipelines/execute",
            json=request_payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert 'execution_id' in data
        assert 'pipeline_name' in data
        assert data.get('status') == 'running'
        
        # Track for cleanup
        if 'execution_id' in data:
            self.test_execution_ids.append(data['execution_id'])
        
        return data['execution_id']
    
    def test_get_execution_status(self):
        """Test getting execution status"""
        # First create an async execution
        execution_id = self.test_execute_pipeline_async()
        
        # Wait a moment for execution to start
        time.sleep(1)
        
        response = self.session.get(
            f"{self.base_url}/v1/pipelines/execution/{execution_id}/status"
        )
        
        if response.status_code == 404:
            pytest.skip("Execution not found - may have completed too quickly")
        
        assert response.status_code == 200
        
        data = response.json()
        assert data['execution_id'] == execution_id
        assert 'status' in data
        assert 'started_at' in data
    
    def test_stream_execution_status(self):
        """Test streaming execution status"""
        # First create an async execution
        execution_id = self.test_execute_pipeline_async()
        
        # Wait a moment for execution to start
        time.sleep(1)
        
        response = self.session.get(
            f"{self.base_url}/v1/pipelines/execution/{execution_id}/stream",
            stream=True,
            timeout=10
        )
        
        if response.status_code == 404:
            pytest.skip("Execution not found for streaming")
        
        assert response.status_code == 200
        
        # Check content type
        content_type = response.headers.get('content-type', '')
        assert 'text/event-stream' in content_type
        
        # Read at least one event
        events_received = 0
        start_time = time.time()
        
        for line in response.iter_lines(decode_unicode=True):
            if line.startswith('data: '):
                events_received += 1
                break
            
            # Safety timeout
            if time.time() - start_time > 5:
                break
        
        assert events_received > 0, "Should receive at least one event"
    
    def test_list_pipeline_executions(self):
        """Test listing pipeline executions"""
        response = self.session.get(f"{self.base_url}/v1/pipelines/")
        assert response.status_code == 200
        
        data = response.json()
        assert 'total_executions' in data
        assert 'executions' in data
        assert isinstance(data['executions'], list)
        
        # Check each execution has required fields
        for execution in data['executions']:
            assert 'execution_id' in execution
            assert 'pipeline_name' in execution
            assert 'status' in execution
            assert 'started_at' in execution
    
    def test_clear_pipeline(self):
        """Test clearing pipeline"""
        response = self.session.delete(f"{self.base_url}/v1/pipelines/clear")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') is True
        assert 'message' in data
    
    def test_invalid_execution_id(self):
        """Test handling of invalid execution ID"""
        invalid_id = "invalid-execution-id"
        response = self.session.get(
            f"{self.base_url}/v1/pipelines/execution/{invalid_id}/status"
        )
        assert response.status_code == 404
    
    def test_invalid_pipeline_execution(self):
        """Test handling of invalid pipeline execution request"""
        invalid_request = {
            "input_data": None,
            "pipeline_name": "nonexistent_pipeline"
        }
        
        response = self.session.post(
            f"{self.base_url}/v1/pipelines/execute",
            json=invalid_request
        )
        # Should return an error status
        assert response.status_code in [400, 422, 500]
    
    @pytest.mark.parametrize("endpoint", [
        "/v1/pipelines/info",
        "/v1/pipelines/",
    ])
    def test_endpoints_return_json(self, endpoint):
        """Test that endpoints return valid JSON"""
        response = self.session.get(f"{self.base_url}{endpoint}")
        assert response.status_code == 200
        
        # Should be able to parse as JSON
        data = response.json()
        assert isinstance(data, dict)
        
        # Should have Content-Type header
        content_type = response.headers.get('content-type', '').lower()
        assert 'application/json' in content_type
    
    def test_response_times(self):
        """Test that endpoints respond within reasonable time"""
        endpoints = [
            "/v1/pipelines/info",
            "/v1/pipelines/",
        ]
        
        for endpoint in endpoints:
            response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
            assert response.status_code == 200
            # Response should be under 10 seconds for info endpoints
            assert response.elapsed.total_seconds() < 10.0


# Integration tests
class TestPipelinesIntegration:
    """Integration tests for pipelines API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for integration tests"""
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    def teardown_method(self):
        """Cleanup after each test"""
        try:
            self.session.delete(f"{self.base_url}/v1/pipelines/clear")
        except:
            pass
    
    def test_full_pipeline_workflow(self):
        """Test complete pipeline workflow"""
        # 1. Initialize pipeline
        init_response = self.session.post(
            f"{self.base_url}/v1/pipelines/initialize",
            params={"pipeline_name": "default"}
        )
        assert init_response.status_code == 200
        
        # 2. Get pipeline info
        info_response = self.session.get(f"{self.base_url}/v1/pipelines/info")
        assert info_response.status_code == 200
        
        # 3. Validate input
        input_data = {
            "requirement": "Create a simple Python script",
            "type": "python_project"
        }
        
        validate_response = self.session.post(
            f"{self.base_url}/v1/pipelines/validate",
            json=input_data
        )
        assert validate_response.status_code == 200
        
        # 4. Execute pipeline (async)
        request_payload = {
            "input_data": input_data,
            "pipeline_name": "default",
            "async_execution": True,
            "correlation_id": str(uuid.uuid4())
        }
        
        execute_response = self.session.post(
            f"{self.base_url}/v1/pipelines/execute",
            json=request_payload
        )
        assert execute_response.status_code == 200
        
        execution_data = execute_response.json()
        execution_id = execution_data['execution_id']
        
        # 5. Check execution status
        time.sleep(1)  # Wait for execution to start
        
        status_response = self.session.get(
            f"{self.base_url}/v1/pipelines/execution/{execution_id}/status"
        )
        
        if status_response.status_code == 200:
            status_data = status_response.json()
            assert status_data['execution_id'] == execution_id
        
        # 6. List executions
        list_response = self.session.get(f"{self.base_url}/v1/pipelines/")
        assert list_response.status_code == 200
        
        list_data = list_response.json()
        assert list_data['total_executions'] >= 1
        
        # 7. Clear pipeline
        clear_response = self.session.delete(f"{self.base_url}/v1/pipelines/clear")
        assert clear_response.status_code == 200


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "--tb=short"])

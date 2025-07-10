"""
Pytest-based tests for agent-service capabilities API
"""

import pytest
import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8001"

class TestCapabilitiesAPI:
    """Pytest test class for capabilities API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    def test_service_health(self):
        """Test that the service is healthy and running"""
        response = self.session.get(f"{self.base_url}/v1/capabilities/health")
        assert response.status_code == 200
        
        data = response.json()
        assert 'overall_status' in data
        assert 'components' in data
        assert 'capabilities_ready' in data
        assert data['capabilities_ready'] is True
    
    def test_get_all_capabilities(self):
        """Test GET /v1/capabilities/ endpoint"""
        response = self.session.get(f"{self.base_url}/v1/capabilities/")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, dict)
        
        # Check required fields
        required_fields = ['service_info', 'total_agents', 'agents']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Validate service_info
        service_info = data['service_info']
        assert 'name' in service_info
        assert 'version' in service_info
        assert 'description' in service_info
        
        # Validate agents
        agents = data['agents']
        assert isinstance(agents, dict)
        
        # Check each agent has required fields
        for agent_key, agent_info in agents.items():
            assert 'name' in agent_info
            assert 'description' in agent_info
            assert 'capabilities' in agent_info
            assert 'config_type' in agent_info
            assert 'endpoints' in agent_info
    
    def test_get_capabilities_summary(self):
        """Test GET /v1/capabilities/summary endpoint"""
        response = self.session.get(f"{self.base_url}/v1/capabilities/summary")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, dict)
        
        # Check required fields
        required_fields = ['service', 'version', 'total_agents', 'unique_capabilities', 'features']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Validate data types
        assert isinstance(data['total_agents'], int)
        assert isinstance(data['unique_capabilities'], list)
        assert isinstance(data['features'], list)
    
    def test_get_agent_capabilities(self):
        """Test GET /v1/capabilities/agents endpoint"""
        response = self.session.get(f"{self.base_url}/v1/capabilities/agents")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, dict)
        
        # Check required fields
        assert 'total_agents' in data
        assert 'agents' in data
        
        # Validate agents list
        agents = data['agents']
        assert isinstance(agents, list)
        
        # Check each agent in the list
        for agent in agents:
            assert 'agent_key' in agent
            assert 'name' in agent
            assert 'description' in agent
            assert 'capabilities' in agent
            assert 'config_type' in agent
            assert 'version' in agent
    
    def test_get_pipeline_capabilities(self):
        """Test GET /v1/capabilities/pipelines endpoint"""
        response = self.session.get(f"{self.base_url}/v1/capabilities/pipelines")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, dict)
        
        # Check required fields
        required_fields = ['pipeline_execution', 'supported_formats', 'features']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Validate pipeline_execution
        pipeline_exec = data['pipeline_execution']
        assert isinstance(pipeline_exec, dict)
        assert 'synchronous' in pipeline_exec
        assert 'asynchronous' in pipeline_exec
        
        # Validate supported_formats
        formats = data['supported_formats']
        assert isinstance(formats, dict)
        assert 'input' in formats
        assert 'output' in formats
        
        # Validate features
        features = data['features']
        assert isinstance(features, list)
        assert len(features) > 0
    
    def test_get_config_types(self):
        """Test GET /v1/capabilities/config-types endpoint"""
        response = self.session.get(f"{self.base_url}/v1/capabilities/config-types")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, dict)
        
        # Check required fields
        assert 'total_config_types' in data
        assert 'config_types' in data
        
        # Validate config_types
        config_types = data['config_types']
        assert isinstance(config_types, dict)
        
        # Check expected config types exist
        expected_types = ['standard', 'coding', 'review', 'creative']
        for config_type in expected_types:
            if config_type in config_types:
                config_info = config_types[config_type]
                assert 'description' in config_info
                assert 'use_cases' in config_info
                assert 'agents' in config_info
                assert isinstance(config_info['agents'], list)
    
    def test_get_openapi_schema(self):
        """Test GET /v1/capabilities/openapi-schema endpoint"""
        response = self.session.get(f"{self.base_url}/v1/capabilities/openapi-schema")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, dict)
        
        # Check OpenAPI required fields
        assert 'openapi' in data
        assert 'info' in data
        assert 'paths' in data
        
        # Validate OpenAPI version
        assert data['openapi'] == '3.0.0'
        
        # Validate info section
        info = data['info']
        assert 'title' in info
        assert 'version' in info
        assert 'description' in info
        
        # Validate paths
        paths = data['paths']
        assert isinstance(paths, dict)
        assert len(paths) > 0
    
    def test_invalid_endpoint_404(self):
        """Test that invalid endpoints return 404"""
        response = self.session.get(f"{self.base_url}/v1/capabilities/invalid-endpoint")
        assert response.status_code == 404
    
    @pytest.mark.parametrize("endpoint", [
        "/v1/capabilities/",
        "/v1/capabilities/summary",
        "/v1/capabilities/agents",
        "/v1/capabilities/pipelines",
        "/v1/capabilities/config-types",
        "/v1/capabilities/health",
        "/v1/capabilities/openapi-schema"
    ])
    def test_all_endpoints_return_json(self, endpoint):
        """Test that all endpoints return valid JSON"""
        response = self.session.get(f"{self.base_url}{endpoint}")
        assert response.status_code == 200
        
        # Should be able to parse as JSON
        data = response.json()
        assert isinstance(data, dict)
        
        # Should have Content-Type header
        assert 'application/json' in response.headers.get('content-type', '').lower()
    
    def test_response_times(self):
        """Test that all endpoints respond within reasonable time"""
        endpoints = [
            "/v1/capabilities/",
            "/v1/capabilities/summary",
            "/v1/capabilities/agents",
            "/v1/capabilities/pipelines",
            "/v1/capabilities/config-types",
            "/v1/capabilities/health",
            "/v1/capabilities/openapi-schema"
        ]
        
        for endpoint in endpoints:
            response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
            assert response.status_code == 200
            # Response should be under 5 seconds for capabilities endpoints
            assert response.elapsed.total_seconds() < 5.0


# Fixtures for test data
@pytest.fixture
def sample_agent_data():
    """Sample agent data for testing"""
    return {
        "agent_key": "test_agent",
        "name": "Test Agent",
        "description": "A test agent for testing",
        "capabilities": ["test_capability"],
        "config_type": "standard",
        "version": "1.0.0"
    }


@pytest.fixture
def sample_service_info():
    """Sample service info for testing"""
    return {
        "name": "Agent Service",
        "version": "1.0.0",
        "description": "Standalone multi-agent service for code generation and analysis"
    }


# Integration tests
class TestCapabilitiesIntegration:
    """Integration tests for capabilities API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for integration tests"""
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    def test_service_startup_sequence(self):
        """Test the expected sequence when service starts up"""
        # 1. Health check should work
        health_response = self.session.get(f"{self.base_url}/v1/capabilities/health")
        assert health_response.status_code == 200
        
        # 2. Should be able to get capabilities
        caps_response = self.session.get(f"{self.base_url}/v1/capabilities/")
        assert caps_response.status_code == 200
        
        # 3. Should have consistent agent count across endpoints
        caps_data = caps_response.json()
        agents_response = self.session.get(f"{self.base_url}/v1/capabilities/agents")
        agents_data = agents_response.json()
        
        assert caps_data['total_agents'] == agents_data['total_agents']
        assert len(caps_data['agents']) == len(agents_data['agents'])
    
    def test_data_consistency(self):
        """Test data consistency across different endpoints"""
        # Get data from different endpoints
        all_caps = self.session.get(f"{self.base_url}/v1/capabilities/").json()
        summary = self.session.get(f"{self.base_url}/v1/capabilities/summary").json()
        agents = self.session.get(f"{self.base_url}/v1/capabilities/agents").json()
        
        # Check consistency
        assert all_caps['total_agents'] == summary['total_agents']
        assert all_caps['total_agents'] == agents['total_agents']
        
        # Service info should be consistent
        assert all_caps['service_info']['name'] == summary['service']
        assert all_caps['service_info']['version'] == summary['version']


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "--tb=short"])

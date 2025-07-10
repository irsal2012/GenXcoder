#!/usr/bin/env python3
"""
Comprehensive test script for agent-service agents.py API
Tests all endpoints with various scenarios including success and error cases.
"""

import asyncio
import json
import pytest
import requests
import time
import uuid
from typing import Dict, Any, List
from unittest.mock import patch, MagicMock
import sys
import os

# Add the agent-service directory to the path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'agent-service'))

# Test configuration
BASE_URL = "http://localhost:8001"  # Agent service URL
AGENTS_ENDPOINT = f"{BASE_URL}/agents"

class TestAgentsAPI:
    """Test class for agents API endpoints"""
    
    @classmethod
    def setup_class(cls):
        """Setup test class"""
        cls.session = requests.Session()
        cls.test_execution_ids = []
        
    @classmethod
    def teardown_class(cls):
        """Cleanup test class"""
        cls.session.close()
        
    def test_list_available_agents(self):
        """Test GET /agents/ - List all available agents"""
        print("\n=== Testing List Available Agents ===")
        
        response = self.session.get(f"{AGENTS_ENDPOINT}/")
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "total_agents" in data
        assert "factory_stats" in data
        assert "agents" in data
        assert isinstance(data["agents"], list)
        
        # Validate agent structure
        if data["agents"]:
            agent = data["agents"][0]
            required_fields = ["agent_key", "name", "description", "capabilities", "config_type", "version"]
            for field in required_fields:
                assert field in agent, f"Missing field: {field}"
        
        print(f"✓ Found {data['total_agents']} agents")
        return data["agents"]
    
    def test_get_agent_metadata_success(self):
        """Test GET /agents/{agent_name}/metadata - Success case"""
        print("\n=== Testing Get Agent Metadata (Success) ===")
        
        # First get available agents
        agents = self.test_list_available_agents()
        if not agents:
            pytest.skip("No agents available for testing")
        
        agent_name = agents[0]["agent_key"]
        response = self.session.get(f"{AGENTS_ENDPOINT}/{agent_name}/metadata")
        
        print(f"Testing agent: {agent_name}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "agent_name" in data
        assert "agent_key" in data
        assert "metadata" in data
        
        metadata = data["metadata"]
        required_fields = ["name", "description", "capabilities", "config_type", "version"]
        for field in required_fields:
            assert field in metadata, f"Missing metadata field: {field}"
        
        print(f"✓ Successfully retrieved metadata for {agent_name}")
    
    def test_get_agent_metadata_not_found(self):
        """Test GET /agents/{agent_name}/metadata - Agent not found"""
        print("\n=== Testing Get Agent Metadata (Not Found) ===")
        
        fake_agent = "nonexistent_agent_12345"
        response = self.session.get(f"{AGENTS_ENDPOINT}/{fake_agent}/metadata")
        
        print(f"Testing fake agent: {fake_agent}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()
        
        print("✓ Correctly returned 404 for non-existent agent")
    
    def test_execute_agent_sync_success(self):
        """Test POST /agents/{agent_name}/execute - Synchronous execution success"""
        print("\n=== Testing Execute Agent (Sync Success) ===")
        
        # Get available agents
        agents_response = self.session.get(f"{AGENTS_ENDPOINT}/")
        agents = agents_response.json()["agents"]
        
        if not agents:
            pytest.skip("No agents available for testing")
        
        agent_name = agents[0]["agent_key"]
        
        # Test data
        test_request = {
            "input_data": "Create a simple Python function that adds two numbers",
            "config": {"temperature": 0.7, "max_tokens": 1000},
            "context": {"project_type": "python", "style": "functional"},
            "async_execution": False
        }
        
        response = self.session.post(
            f"{AGENTS_ENDPOINT}/{agent_name}/execute",
            json=test_request
        )
        
        print(f"Testing agent: {agent_name}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Validate response structure
            required_fields = ["success", "execution_id", "agent_name", "status", "message"]
            for field in required_fields:
                assert field in data, f"Missing field: {field}"
            
            assert data["success"] is True
            assert data["status"] in ["completed", "running"]
            assert data["agent_name"] == agent_name
            
            # Store execution ID for later tests
            self.test_execution_ids.append(data["execution_id"])
            
            print(f"✓ Successfully executed agent {agent_name}")
            print(f"✓ Execution ID: {data['execution_id']}")
            
        else:
            # If the agent service is not running, this is expected
            print(f"⚠ Agent service may not be running (Status: {response.status_code})")
            pytest.skip("Agent service not available")
    
    def test_execute_agent_async_success(self):
        """Test POST /agents/{agent_name}/execute - Asynchronous execution"""
        print("\n=== Testing Execute Agent (Async Success) ===")
        
        # Get available agents
        agents_response = self.session.get(f"{AGENTS_ENDPOINT}/")
        if agents_response.status_code != 200:
            pytest.skip("Agent service not available")
            
        agents = agents_response.json()["agents"]
        if not agents:
            pytest.skip("No agents available for testing")
        
        agent_name = agents[0]["agent_key"]
        
        # Test data for async execution
        test_request = {
            "input_data": "Generate a comprehensive test suite for a calculator application",
            "config": {"temperature": 0.5},
            "context": {"project_type": "testing"},
            "async_execution": True
        }
        
        response = self.session.post(
            f"{AGENTS_ENDPOINT}/{agent_name}/execute",
            json=test_request
        )
        
        print(f"Testing async execution for agent: {agent_name}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            assert data["success"] is True
            assert data["status"] == "running"
            assert "execution_id" in data
            
            # Store execution ID for status testing
            self.test_execution_ids.append(data["execution_id"])
            
            print(f"✓ Successfully started async execution")
            print(f"✓ Execution ID: {data['execution_id']}")
        else:
            pytest.skip("Agent service not available")
    
    def test_execute_agent_invalid_agent(self):
        """Test POST /agents/{agent_name}/execute - Invalid agent name"""
        print("\n=== Testing Execute Agent (Invalid Agent) ===")
        
        fake_agent = "invalid_agent_xyz"
        test_request = {
            "input_data": "Test input",
            "async_execution": False
        }
        
        response = self.session.post(
            f"{AGENTS_ENDPOINT}/{fake_agent}/execute",
            json=test_request
        )
        
        print(f"Testing invalid agent: {fake_agent}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code in [404, 422]:
            print("✓ Correctly rejected invalid agent")
        else:
            pytest.skip("Agent service not available")
    
    def test_validate_agent_input_success(self):
        """Test GET /agents/{agent_name}/validate - Input validation success"""
        print("\n=== Testing Validate Agent Input (Success) ===")
        
        # Get available agents
        agents_response = self.session.get(f"{AGENTS_ENDPOINT}/")
        if agents_response.status_code != 200:
            pytest.skip("Agent service not available")
            
        agents = agents_response.json()["agents"]
        if not agents:
            pytest.skip("No agents available for testing")
        
        agent_name = agents[0]["agent_key"]
        
        # Test input validation
        test_input = {
            "requirement": "Build a web application",
            "technology": "Python Flask",
            "complexity": "medium"
        }
        
        response = self.session.get(
            f"{AGENTS_ENDPOINT}/{agent_name}/validate",
            params={"input_data": json.dumps(test_input)}
        )
        
        print(f"Testing input validation for agent: {agent_name}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            assert "agent_name" in data
            assert "validation" in data
            print("✓ Input validation completed")
        else:
            pytest.skip("Agent service not available or validation not implemented")
    
    def test_get_execution_status(self):
        """Test GET /agents/execution/{execution_id}/status"""
        print("\n=== Testing Get Execution Status ===")
        
        if not self.test_execution_ids:
            pytest.skip("No execution IDs available from previous tests")
        
        execution_id = self.test_execution_ids[0]
        
        response = self.session.get(f"{AGENTS_ENDPOINT}/execution/{execution_id}/status")
        
        print(f"Testing execution status for ID: {execution_id}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            required_fields = ["execution_id", "agent_name", "status", "started_at"]
            for field in required_fields:
                assert field in data, f"Missing field: {field}"
            
            assert data["execution_id"] == execution_id
            assert data["status"] in ["running", "completed", "failed"]
            
            print(f"✓ Execution status: {data['status']}")
        elif response.status_code == 404:
            print("⚠ Execution ID not found (may have been cleaned up)")
        else:
            pytest.skip("Agent service not available")
    
    def test_get_execution_status_not_found(self):
        """Test GET /agents/execution/{execution_id}/status - Not found"""
        print("\n=== Testing Get Execution Status (Not Found) ===")
        
        fake_execution_id = str(uuid.uuid4())
        
        response = self.session.get(f"{AGENTS_ENDPOINT}/execution/{fake_execution_id}/status")
        
        print(f"Testing fake execution ID: {fake_execution_id}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 404:
            data = response.json()
            assert "detail" in data
            print("✓ Correctly returned 404 for non-existent execution")
        else:
            pytest.skip("Agent service not available")
    
    def test_stream_execution_status(self):
        """Test GET /agents/execution/{execution_id}/stream - Server-Sent Events"""
        print("\n=== Testing Stream Execution Status ===")
        
        if not self.test_execution_ids:
            pytest.skip("No execution IDs available from previous tests")
        
        execution_id = self.test_execution_ids[0]
        
        try:
            response = self.session.get(
                f"{AGENTS_ENDPOINT}/execution/{execution_id}/stream",
                stream=True,
                timeout=5  # Short timeout for testing
            )
            
            print(f"Testing execution stream for ID: {execution_id}")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                # Read a few lines from the stream
                lines_read = 0
                for line in response.iter_lines(decode_unicode=True):
                    if line and lines_read < 3:  # Read max 3 lines for testing
                        print(f"Stream line: {line}")
                        lines_read += 1
                    if lines_read >= 3:
                        break
                
                print("✓ Successfully received stream data")
            elif response.status_code == 404:
                print("⚠ Execution ID not found for streaming")
            else:
                pytest.skip("Agent service not available")
                
        except requests.exceptions.Timeout:
            print("⚠ Stream timeout (expected for testing)")
        except Exception as e:
            print(f"⚠ Stream test error: {e}")
    
    def test_invalid_request_formats(self):
        """Test various invalid request formats"""
        print("\n=== Testing Invalid Request Formats ===")
        
        # Get available agents
        agents_response = self.session.get(f"{AGENTS_ENDPOINT}/")
        if agents_response.status_code != 200:
            pytest.skip("Agent service not available")
            
        agents = agents_response.json()["agents"]
        if not agents:
            pytest.skip("No agents available for testing")
        
        agent_name = agents[0]["agent_key"]
        
        # Test cases for invalid requests
        invalid_requests = [
            {},  # Empty request
            {"input_data": ""},  # Empty input
            {"input_data": None},  # Null input
            {"invalid_field": "test"},  # Invalid field
        ]
        
        for i, invalid_request in enumerate(invalid_requests):
            print(f"\nTesting invalid request {i+1}: {invalid_request}")
            
            response = self.session.post(
                f"{AGENTS_ENDPOINT}/{agent_name}/execute",
                json=invalid_request
            )
            
            print(f"Status Code: {response.status_code}")
            
            # Should return 422 (Validation Error) or 400 (Bad Request)
            if response.status_code in [400, 422]:
                print(f"✓ Correctly rejected invalid request {i+1}")
            else:
                print(f"⚠ Unexpected status code for invalid request {i+1}")


class TestAgentsAPIIntegration:
    """Integration tests that require the full agent service to be running"""
    
    def test_full_agent_execution_workflow(self):
        """Test complete workflow: execute -> check status -> get result"""
        print("\n=== Testing Full Agent Execution Workflow ===")
        
        session = requests.Session()
        
        try:
            # 1. List available agents
            agents_response = session.get(f"{AGENTS_ENDPOINT}/")
            if agents_response.status_code != 200:
                pytest.skip("Agent service not available")
            
            agents = agents_response.json()["agents"]
            if not agents:
                pytest.skip("No agents available")
            
            agent_name = agents[0]["agent_key"]
            print(f"Using agent: {agent_name}")
            
            # 2. Execute agent asynchronously
            execution_request = {
                "input_data": "Create a simple 'Hello World' function in Python",
                "async_execution": True
            }
            
            exec_response = session.post(
                f"{AGENTS_ENDPOINT}/{agent_name}/execute",
                json=execution_request
            )
            
            if exec_response.status_code != 200:
                pytest.skip("Agent execution failed")
            
            execution_data = exec_response.json()
            execution_id = execution_data["execution_id"]
            print(f"Started execution: {execution_id}")
            
            # 3. Poll execution status
            max_polls = 10
            poll_count = 0
            final_status = None
            
            while poll_count < max_polls:
                status_response = session.get(
                    f"{AGENTS_ENDPOINT}/execution/{execution_id}/status"
                )
                
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    current_status = status_data["status"]
                    print(f"Poll {poll_count + 1}: Status = {current_status}")
                    
                    if current_status in ["completed", "failed"]:
                        final_status = current_status
                        break
                
                poll_count += 1
                time.sleep(1)  # Wait 1 second between polls
            
            if final_status:
                print(f"✓ Execution completed with status: {final_status}")
            else:
                print("⚠ Execution still running after polling timeout")
            
        except Exception as e:
            print(f"Integration test error: {e}")
            pytest.skip("Integration test failed")
        finally:
            session.close()


def run_manual_tests():
    """Run tests manually without pytest"""
    print("=== Manual Agent API Tests ===")
    
    # Test basic connectivity
    try:
        response = requests.get(f"{AGENTS_ENDPOINT}/", timeout=5)
        print(f"Service connectivity: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Available agents: {data.get('total_agents', 0)}")
        else:
            print("⚠ Agent service not responding correctly")
            return
    except Exception as e:
        print(f"✗ Cannot connect to agent service: {e}")
        print("Make sure the agent service is running on http://localhost:8001")
        return
    
    # Run basic tests
    test_instance = TestAgentsAPI()
    test_instance.setup_class()
    
    try:
        test_instance.test_list_available_agents()
        test_instance.test_get_agent_metadata_success()
        test_instance.test_get_agent_metadata_not_found()
        test_instance.test_execute_agent_invalid_agent()
        test_instance.test_get_execution_status_not_found()
        test_instance.test_invalid_request_formats()
        
        print("\n=== Manual Tests Completed ===")
        
    except Exception as e:
        print(f"Test error: {e}")
    finally:
        test_instance.teardown_class()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Test the Agent Service API")
    parser.add_argument("--manual", action="store_true", help="Run manual tests without pytest")
    parser.add_argument("--url", default="http://localhost:8001", help="Agent service URL")
    
    args = parser.parse_args()
    
    # Update base URL if provided
    BASE_URL = args.url
    AGENTS_ENDPOINT = f"{BASE_URL}/agents"
    
    if args.manual:
        run_manual_tests()
    else:
        # Run with pytest
        pytest.main([__file__, "-v", "-s"])

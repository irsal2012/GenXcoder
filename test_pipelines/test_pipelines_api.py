"""
Test script for agent-service pipelines API
Tests all endpoints and functionality in pipelines.py
"""

import pytest
import requests
import json
import time
import uuid
from typing import Dict, Any, List, Optional
import logging
import asyncio
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestPipelinesAPI:
    """Test class for pipelines API endpoints"""
    
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_execution_ids = []  # Track executions for cleanup
    
    def cleanup(self):
        """Clean up test executions"""
        logger.info("🧹 Cleaning up test executions...")
        try:
            # Clear pipeline to clean up any running executions
            self.test_clear_pipeline()
        except Exception as e:
            logger.warning(f"⚠️ Cleanup warning: {e}")
    
    def test_connection(self) -> bool:
        """Test if the agent service is running and accessible"""
        try:
            # Try to get pipeline info as a connection test
            response = self.session.get(f"{self.base_url}/v1/pipelines/info", timeout=5)
            if response.status_code in [200, 404]:  # 404 is ok if no pipeline loaded
                logger.info("✅ Agent service is running")
                return True
            else:
                logger.error(f"❌ Agent service connection failed: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Cannot connect to agent service: {e}")
            return False
    
    def test_initialize_pipeline(self, pipeline_name: str = "default") -> Dict[str, Any]:
        """Test POST /v1/pipelines/initialize endpoint"""
        logger.info(f"Testing POST /v1/pipelines/initialize with pipeline: {pipeline_name}")
        
        try:
            response = self.session.post(
                f"{self.base_url}/v1/pipelines/initialize",
                params={"pipeline_name": pipeline_name}
            )
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            logger.info(f"✅ POST /v1/pipelines/initialize successful")
            logger.info(f"Response keys: {list(data.keys())}")
            
            # Validate response structure
            assert isinstance(data, dict), "Response should be a dictionary"
            
            # Check for expected fields
            expected_fields = ['success', 'message']
            for field in expected_fields:
                if field in data:
                    logger.info(f"✅ Found expected field: {field}")
                else:
                    logger.warning(f"⚠️ Missing expected field: {field}")
            
            # Validate success field
            assert data.get('success') is True, "Pipeline initialization should be successful"
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ POST /v1/pipelines/initialize failed: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON response: {e}")
            raise
        except AssertionError as e:
            logger.error(f"❌ Assertion failed: {e}")
            raise
    
    def test_get_pipeline_info(self) -> Dict[str, Any]:
        """Test GET /v1/pipelines/info endpoint"""
        logger.info("Testing GET /v1/pipelines/info")
        
        try:
            response = self.session.get(f"{self.base_url}/v1/pipelines/info")
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            logger.info(f"✅ GET /v1/pipelines/info successful")
            logger.info(f"Response keys: {list(data.keys())}")
            
            # Validate response structure
            assert isinstance(data, dict), "Response should be a dictionary"
            
            # Check pipeline loaded status
            if data.get('pipeline_loaded'):
                logger.info("✅ Pipeline is loaded")
                expected_fields = ['pipeline_info', 'active_agents', 'current_progress']
                for field in expected_fields:
                    if field in data:
                        logger.info(f"✅ Found expected field: {field}")
                    else:
                        logger.warning(f"⚠️ Missing expected field: {field}")
            else:
                logger.info("ℹ️ No pipeline currently loaded")
                assert 'message' in data, "Should have message when no pipeline loaded"
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ GET /v1/pipelines/info failed: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON response: {e}")
            raise
        except AssertionError as e:
            logger.error(f"❌ Assertion failed: {e}")
            raise
    
    def test_validate_pipeline_input(self, input_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Test POST /v1/pipelines/validate endpoint"""
        if input_data is None:
            input_data = {
                "requirement": "Create a simple Python calculator",
                "type": "python_project"
            }
        
        logger.info("Testing POST /v1/pipelines/validate")
        
        try:
            response = self.session.post(
                f"{self.base_url}/v1/pipelines/validate",
                json=input_data
            )
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            logger.info(f"✅ POST /v1/pipelines/validate successful")
            logger.info(f"Response keys: {list(data.keys())}")
            
            # Validate response structure
            assert isinstance(data, dict), "Response should be a dictionary"
            
            # Check for expected fields
            expected_fields = ['validation', 'input_data']
            for field in expected_fields:
                if field in data:
                    logger.info(f"✅ Found expected field: {field}")
                else:
                    logger.warning(f"⚠️ Missing expected field: {field}")
            
            # Validate input_data echoed back
            if 'input_data' in data:
                assert data['input_data'] == input_data, "Input data should be echoed back"
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ POST /v1/pipelines/validate failed: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON response: {e}")
            raise
        except AssertionError as e:
            logger.error(f"❌ Assertion failed: {e}")
            raise
    
    def test_execute_pipeline_sync(self, input_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Test POST /v1/pipelines/execute endpoint (synchronous)"""
        if input_data is None:
            input_data = {
                "requirement": "Create a simple Python hello world script",
                "type": "python_project"
            }
        
        logger.info("Testing POST /v1/pipelines/execute (synchronous)")
        
        try:
            request_payload = {
                "input_data": input_data,
                "pipeline_name": "default",
                "async_execution": False,
                "correlation_id": str(uuid.uuid4())
            }
            
            response = self.session.post(
                f"{self.base_url}/v1/pipelines/execute",
                json=request_payload,
                timeout=60  # Longer timeout for pipeline execution
            )
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            logger.info(f"✅ POST /v1/pipelines/execute (sync) successful")
            logger.info(f"Response keys: {list(data.keys())}")
            
            # Validate response structure
            assert isinstance(data, dict), "Response should be a dictionary"
            
            # Check for expected fields
            expected_fields = ['success', 'execution_id', 'pipeline_name', 'status', 'message']
            for field in expected_fields:
                if field in data:
                    logger.info(f"✅ Found expected field: {field}")
                else:
                    logger.warning(f"⚠️ Missing expected field: {field}")
            
            # Track execution ID for cleanup
            if 'execution_id' in data:
                self.test_execution_ids.append(data['execution_id'])
                logger.info(f"📝 Tracked execution ID: {data['execution_id']}")
            
            # Validate execution completed
            if data.get('status') in ['completed', 'failed']:
                logger.info(f"✅ Synchronous execution completed with status: {data.get('status')}")
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ POST /v1/pipelines/execute (sync) failed: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON response: {e}")
            raise
        except AssertionError as e:
            logger.error(f"❌ Assertion failed: {e}")
            raise
    
    def test_execute_pipeline_async(self, input_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Test POST /v1/pipelines/execute endpoint (asynchronous)"""
        if input_data is None:
            input_data = {
                "requirement": "Create a simple Python function to add two numbers",
                "type": "python_project"
            }
        
        logger.info("Testing POST /v1/pipelines/execute (asynchronous)")
        
        try:
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
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            logger.info(f"✅ POST /v1/pipelines/execute (async) successful")
            logger.info(f"Response keys: {list(data.keys())}")
            
            # Validate response structure
            assert isinstance(data, dict), "Response should be a dictionary"
            
            # Check for expected fields
            expected_fields = ['success', 'execution_id', 'pipeline_name', 'status', 'message']
            for field in expected_fields:
                if field in data:
                    logger.info(f"✅ Found expected field: {field}")
                else:
                    logger.warning(f"⚠️ Missing expected field: {field}")
            
            # Track execution ID for cleanup
            if 'execution_id' in data:
                self.test_execution_ids.append(data['execution_id'])
                logger.info(f"📝 Tracked execution ID: {data['execution_id']}")
            
            # Validate async execution started
            assert data.get('status') == 'running', "Async execution should start with 'running' status"
            logger.info(f"✅ Asynchronous execution started with status: {data.get('status')}")
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ POST /v1/pipelines/execute (async) failed: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON response: {e}")
            raise
        except AssertionError as e:
            logger.error(f"❌ Assertion failed: {e}")
            raise
    
    def test_get_execution_status(self, execution_id: str) -> Dict[str, Any]:
        """Test GET /v1/pipelines/execution/{execution_id}/status endpoint"""
        logger.info(f"Testing GET /v1/pipelines/execution/{execution_id}/status")
        
        try:
            response = self.session.get(
                f"{self.base_url}/v1/pipelines/execution/{execution_id}/status"
            )
            
            if response.status_code == 404:
                logger.warning(f"⚠️ Execution {execution_id} not found (404)")
                return {}
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            logger.info(f"✅ GET execution status successful")
            logger.info(f"Response keys: {list(data.keys())}")
            
            # Validate response structure
            assert isinstance(data, dict), "Response should be a dictionary"
            
            # Check for expected fields
            expected_fields = ['execution_id', 'pipeline_name', 'status', 'started_at']
            for field in expected_fields:
                if field in data:
                    logger.info(f"✅ Found expected field: {field}")
                else:
                    logger.warning(f"⚠️ Missing expected field: {field}")
            
            # Validate execution_id matches
            if 'execution_id' in data:
                assert data['execution_id'] == execution_id, "Execution ID should match request"
            
            # Log status
            status = data.get('status', 'unknown')
            logger.info(f"📊 Execution status: {status}")
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ GET execution status failed: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON response: {e}")
            raise
        except AssertionError as e:
            logger.error(f"❌ Assertion failed: {e}")
            raise
    
    def test_stream_execution_status(self, execution_id: str, max_duration: int = 10) -> bool:
        """Test GET /v1/pipelines/execution/{execution_id}/stream endpoint"""
        logger.info(f"Testing GET /v1/pipelines/execution/{execution_id}/stream")
        
        try:
            response = self.session.get(
                f"{self.base_url}/v1/pipelines/execution/{execution_id}/stream",
                stream=True,
                timeout=max_duration
            )
            
            if response.status_code == 404:
                logger.warning(f"⚠️ Execution {execution_id} not found for streaming (404)")
                return False
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            # Check content type
            content_type = response.headers.get('content-type', '')
            assert 'text/event-stream' in content_type, f"Expected event-stream, got {content_type}"
            
            logger.info(f"✅ Stream connection established")
            
            # Read some events from the stream
            events_received = 0
            start_time = time.time()
            
            for line in response.iter_lines(decode_unicode=True):
                if line.startswith('data: '):
                    try:
                        event_data = json.loads(line[6:])  # Remove 'data: ' prefix
                        events_received += 1
                        logger.info(f"📡 Received event {events_received}: status={event_data.get('status', 'unknown')}")
                        
                        # Break if execution completed or max duration reached
                        if (event_data.get('status') in ['completed', 'failed'] or 
                            time.time() - start_time > max_duration):
                            break
                            
                    except json.JSONDecodeError:
                        logger.warning(f"⚠️ Invalid JSON in stream event: {line}")
                
                # Safety timeout
                if time.time() - start_time > max_duration:
                    logger.info(f"⏰ Stream test timeout after {max_duration}s")
                    break
            
            logger.info(f"✅ Stream test completed, received {events_received} events")
            return events_received > 0
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Stream execution status failed: {e}")
            raise
        except AssertionError as e:
            logger.error(f"❌ Assertion failed: {e}")
            raise
    
    def test_list_pipeline_executions(self) -> Dict[str, Any]:
        """Test GET /v1/pipelines/ endpoint"""
        logger.info("Testing GET /v1/pipelines/")
        
        try:
            response = self.session.get(f"{self.base_url}/v1/pipelines/")
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            logger.info(f"✅ GET /v1/pipelines/ successful")
            logger.info(f"Response keys: {list(data.keys())}")
            
            # Validate response structure
            assert isinstance(data, dict), "Response should be a dictionary"
            
            # Check for expected fields
            expected_fields = ['total_executions', 'executions']
            for field in expected_fields:
                if field in data:
                    logger.info(f"✅ Found expected field: {field}")
                else:
                    logger.warning(f"⚠️ Missing expected field: {field}")
            
            # Validate executions list
            if 'executions' in data:
                executions = data['executions']
                assert isinstance(executions, list), "executions should be a list"
                logger.info(f"📊 Found {len(executions)} executions")
                
                # Check each execution has required fields
                for i, execution in enumerate(executions):
                    logger.info(f"  Execution {i+1}: {execution.get('execution_id', 'unknown')} - {execution.get('status', 'unknown')}")
                    expected_exec_fields = ['execution_id', 'pipeline_name', 'status', 'started_at']
                    for field in expected_exec_fields:
                        if field in execution:
                            logger.info(f"    ✅ Has {field}")
                        else:
                            logger.warning(f"    ⚠️ Missing {field}")
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ GET /v1/pipelines/ failed: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON response: {e}")
            raise
        except AssertionError as e:
            logger.error(f"❌ Assertion failed: {e}")
            raise
    
    def test_clear_pipeline(self) -> Dict[str, Any]:
        """Test DELETE /v1/pipelines/clear endpoint"""
        logger.info("Testing DELETE /v1/pipelines/clear")
        
        try:
            response = self.session.delete(f"{self.base_url}/v1/pipelines/clear")
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            logger.info(f"✅ DELETE /v1/pipelines/clear successful")
            logger.info(f"Response keys: {list(data.keys())}")
            
            # Validate response structure
            assert isinstance(data, dict), "Response should be a dictionary"
            
            # Check for expected fields
            expected_fields = ['success', 'message']
            for field in expected_fields:
                if field in data:
                    logger.info(f"✅ Found expected field: {field}")
                else:
                    logger.warning(f"⚠️ Missing expected field: {field}")
            
            # Validate success
            assert data.get('success') is True, "Pipeline clear should be successful"
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ DELETE /v1/pipelines/clear failed: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON response: {e}")
            raise
        except AssertionError as e:
            logger.error(f"❌ Assertion failed: {e}")
            raise
    
    def test_error_handling(self):
        """Test error handling for invalid requests"""
        logger.info("Testing error handling")
        
        # Test invalid execution ID
        try:
            invalid_id = "invalid-execution-id"
            response = self.session.get(
                f"{self.base_url}/v1/pipelines/execution/{invalid_id}/status"
            )
            logger.info(f"Invalid execution ID returned status: {response.status_code}")
            
            if response.status_code == 404:
                logger.info("✅ Proper 404 handling for invalid execution ID")
            else:
                logger.warning(f"⚠️ Unexpected status code for invalid execution ID: {response.status_code}")
        
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Error testing invalid execution ID: {e}")
        
        # Test invalid pipeline execution request
        try:
            invalid_request = {
                "input_data": None,  # Invalid input
                "pipeline_name": "nonexistent_pipeline"
            }
            
            response = self.session.post(
                f"{self.base_url}/v1/pipelines/execute",
                json=invalid_request
            )
            logger.info(f"Invalid execution request returned status: {response.status_code}")
            
            if response.status_code in [400, 422, 500]:
                logger.info("✅ Proper error handling for invalid execution request")
            else:
                logger.warning(f"⚠️ Unexpected status code for invalid request: {response.status_code}")
        
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Error testing invalid execution request: {e}")
    
    def run_all_tests(self):
        """Run all pipeline tests"""
        logger.info("🚀 Starting Pipelines API Tests")
        logger.info("=" * 50)
        
        test_results = {}
        
        # Test connection first
        if not self.test_connection():
            logger.error("❌ Cannot connect to agent service. Make sure it's running on port 8001")
            return test_results
        
        # Run all tests in logical order
        tests = [
            ('initialize_pipeline', lambda: self.test_initialize_pipeline()),
            ('get_pipeline_info', self.test_get_pipeline_info),
            ('validate_pipeline_input', self.test_validate_pipeline_input),
            ('execute_pipeline_sync', self.test_execute_pipeline_sync),
            ('execute_pipeline_async', self.test_execute_pipeline_async),
            ('list_pipeline_executions', self.test_list_pipeline_executions),
            ('error_handling', self.test_error_handling),
            ('clear_pipeline', self.test_clear_pipeline)
        ]
        
        execution_id_for_status_tests = None
        
        for test_name, test_func in tests:
            logger.info(f"\n📋 Running test: {test_name}")
            logger.info("-" * 30)
            
            try:
                result = test_func()
                test_results[test_name] = {
                    'status': 'PASSED',
                    'data': result if result else 'No data returned'
                }
                logger.info(f"✅ {test_name} PASSED")
                
                # Capture execution ID for status tests
                if test_name == 'execute_pipeline_async' and result and 'execution_id' in result:
                    execution_id_for_status_tests = result['execution_id']
                
            except Exception as e:
                test_results[test_name] = {
                    'status': 'FAILED',
                    'error': str(e)
                }
                logger.error(f"❌ {test_name} FAILED: {e}")
        
        # Run status-dependent tests if we have an execution ID
        if execution_id_for_status_tests:
            status_tests = [
                ('get_execution_status', lambda: self.test_get_execution_status(execution_id_for_status_tests)),
                ('stream_execution_status', lambda: self.test_stream_execution_status(execution_id_for_status_tests, 5))
            ]
            
            for test_name, test_func in status_tests:
                logger.info(f"\n📋 Running test: {test_name}")
                logger.info("-" * 30)
                
                try:
                    result = test_func()
                    test_results[test_name] = {
                        'status': 'PASSED',
                        'data': result if result else 'No data returned'
                    }
                    logger.info(f"✅ {test_name} PASSED")
                    
                except Exception as e:
                    test_results[test_name] = {
                        'status': 'FAILED',
                        'error': str(e)
                    }
                    logger.error(f"❌ {test_name} FAILED: {e}")
        
        # Cleanup
        self.cleanup()
        
        # Print summary
        logger.info("\n" + "=" * 50)
        logger.info("📊 TEST SUMMARY")
        logger.info("=" * 50)
        
        passed = sum(1 for result in test_results.values() if result['status'] == 'PASSED')
        failed = sum(1 for result in test_results.values() if result['status'] == 'FAILED')
        
        logger.info(f"Total tests: {len(test_results)}")
        logger.info(f"Passed: {passed}")
        logger.info(f"Failed: {failed}")
        
        for test_name, result in test_results.items():
            status_emoji = "✅" if result['status'] == 'PASSED' else "❌"
            logger.info(f"{status_emoji} {test_name}: {result['status']}")
            if result['status'] == 'FAILED':
                logger.info(f"   Error: {result['error']}")
        
        return test_results


def main():
    """Main function to run the tests"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test Pipelines API')
    parser.add_argument('--url', default='http://localhost:8001', 
                       help='Base URL for the agent service (default: http://localhost:8001)')
    parser.add_argument('--test', choices=[
        'connection', 'initialize', 'info', 'validate', 'execute_sync', 
        'execute_async', 'list', 'clear', 'errors', 'all'
    ], default='all', help='Specific test to run (default: all)')
    
    args = parser.parse_args()
    
    tester = TestPipelinesAPI(base_url=args.url)
    
    if args.test == 'all':
        tester.run_all_tests()
    elif args.test == 'connection':
        tester.test_connection()
    elif args.test == 'initialize':
        tester.test_initialize_pipeline()
    elif args.test == 'info':
        tester.test_get_pipeline_info()
    elif args.test == 'validate':
        tester.test_validate_pipeline_input()
    elif args.test == 'execute_sync':
        tester.test_execute_pipeline_sync()
    elif args.test == 'execute_async':
        tester.test_execute_pipeline_async()
    elif args.test == 'list':
        tester.test_list_pipeline_executions()
    elif args.test == 'clear':
        tester.test_clear_pipeline()
    elif args.test == 'errors':
        tester.test_error_handling()


if __name__ == "__main__":
    main()

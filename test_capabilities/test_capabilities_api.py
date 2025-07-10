"""
Test script for agent-service capabilities API
Tests all endpoints and functionality in capabilities.py
"""

import pytest
import requests
import json
import time
from typing import Dict, Any, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestCapabilitiesAPI:
    """Test class for capabilities API endpoints"""
    
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    def test_connection(self) -> bool:
        """Test if the agent service is running and accessible"""
        try:
            response = self.session.get(f"{self.base_url}/v1/capabilities/health", timeout=5)
            if response.status_code == 200:
                logger.info("✅ Agent service is running")
                return True
            else:
                logger.error(f"❌ Agent service health check failed: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Cannot connect to agent service: {e}")
            return False
    
    def test_get_all_capabilities(self) -> Dict[str, Any]:
        """Test GET /v1/capabilities/ endpoint"""
        logger.info("Testing GET /v1/capabilities/")
        
        try:
            response = self.session.get(f"{self.base_url}/v1/capabilities/")
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            logger.info(f"✅ GET /v1/capabilities/ successful")
            logger.info(f"Response keys: {list(data.keys())}")
            
            # Validate response structure
            assert isinstance(data, dict), "Response should be a dictionary"
            
            # Check for expected top-level fields
            expected_fields = ['service_info', 'factory_stats', 'pipeline_info', 'total_agents', 'agents']
            for field in expected_fields:
                if field in data:
                    logger.info(f"✅ Found expected field: {field}")
                else:
                    logger.warning(f"⚠️ Missing expected field: {field}")
            
            # Validate service_info structure
            if 'service_info' in data:
                service_info = data['service_info']
                assert 'name' in service_info, "service_info should have 'name'"
                assert 'version' in service_info, "service_info should have 'version'"
                assert 'description' in service_info, "service_info should have 'description'"
                logger.info(f"✅ Service info validated: {service_info['name']} v{service_info['version']}")
            
            # Validate agents structure
            if 'agents' in data:
                agents = data['agents']
                assert isinstance(agents, dict), "agents should be a dictionary"
                logger.info(f"✅ Found {len(agents)} agents")
                
                for agent_key, agent_info in agents.items():
                    logger.info(f"  Agent: {agent_key}")
                    expected_agent_fields = ['name', 'description', 'capabilities', 'config_type', 'endpoints']
                    for field in expected_agent_fields:
                        if field in agent_info:
                            logger.info(f"    ✅ Has {field}")
                        else:
                            logger.warning(f"    ⚠️ Missing {field}")
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ GET /v1/capabilities/ failed: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON response: {e}")
            raise
        except AssertionError as e:
            logger.error(f"❌ Assertion failed: {e}")
            raise
    
    def test_get_capabilities_summary(self) -> Dict[str, Any]:
        """Test GET /v1/capabilities/summary endpoint"""
        logger.info("Testing GET /v1/capabilities/summary")
        
        try:
            response = self.session.get(f"{self.base_url}/v1/capabilities/summary")
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            logger.info(f"✅ GET /v1/capabilities/summary successful")
            logger.info(f"Response keys: {list(data.keys())}")
            
            # Validate response structure
            assert isinstance(data, dict), "Response should be a dictionary"
            
            # Check for expected fields
            expected_fields = ['service', 'version', 'total_agents', 'unique_capabilities', 'config_types', 'endpoints', 'features']
            for field in expected_fields:
                if field in data:
                    logger.info(f"✅ Found expected field: {field}")
                    if field == 'unique_capabilities':
                        logger.info(f"  Unique capabilities: {data[field]}")
                    elif field == 'config_types':
                        logger.info(f"  Config types: {data[field]}")
                    elif field == 'features':
                        logger.info(f"  Features count: {len(data[field])}")
                else:
                    logger.warning(f"⚠️ Missing expected field: {field}")
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ GET /v1/capabilities/summary failed: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON response: {e}")
            raise
        except AssertionError as e:
            logger.error(f"❌ Assertion failed: {e}")
            raise
    
    def test_get_agent_capabilities(self) -> Dict[str, Any]:
        """Test GET /v1/capabilities/agents endpoint"""
        logger.info("Testing GET /v1/capabilities/agents")
        
        try:
            response = self.session.get(f"{self.base_url}/v1/capabilities/agents")
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            logger.info(f"✅ GET /v1/capabilities/agents successful")
            logger.info(f"Response keys: {list(data.keys())}")
            
            # Validate response structure
            assert isinstance(data, dict), "Response should be a dictionary"
            
            # Check for expected fields
            expected_fields = ['total_agents', 'agents']
            for field in expected_fields:
                if field in data:
                    logger.info(f"✅ Found expected field: {field}")
                else:
                    logger.warning(f"⚠️ Missing expected field: {field}")
            
            # Validate agents array
            if 'agents' in data:
                agents = data['agents']
                assert isinstance(agents, list), "agents should be a list"
                logger.info(f"✅ Found {len(agents)} agents in list")
                
                for i, agent in enumerate(agents):
                    logger.info(f"  Agent {i+1}: {agent.get('name', 'Unknown')}")
                    expected_agent_fields = ['agent_key', 'name', 'description', 'capabilities', 'config_type', 'version']
                    for field in expected_agent_fields:
                        if field in agent:
                            logger.info(f"    ✅ Has {field}")
                        else:
                            logger.warning(f"    ⚠️ Missing {field}")
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ GET /v1/capabilities/agents failed: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON response: {e}")
            raise
        except AssertionError as e:
            logger.error(f"❌ Assertion failed: {e}")
            raise
    
    def test_get_pipeline_capabilities(self) -> Dict[str, Any]:
        """Test GET /v1/capabilities/pipelines endpoint"""
        logger.info("Testing GET /v1/capabilities/pipelines")
        
        try:
            response = self.session.get(f"{self.base_url}/v1/capabilities/pipelines")
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            logger.info(f"✅ GET /v1/capabilities/pipelines successful")
            logger.info(f"Response keys: {list(data.keys())}")
            
            # Validate response structure
            assert isinstance(data, dict), "Response should be a dictionary"
            
            # Check for expected fields
            expected_fields = ['pipeline_execution', 'supported_formats', 'features', 'current_pipeline']
            for field in expected_fields:
                if field in data:
                    logger.info(f"✅ Found expected field: {field}")
                    if field == 'pipeline_execution':
                        exec_info = data[field]
                        logger.info(f"  Pipeline execution capabilities: {list(exec_info.keys())}")
                    elif field == 'features':
                        logger.info(f"  Pipeline features count: {len(data[field])}")
                else:
                    logger.warning(f"⚠️ Missing expected field: {field}")
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ GET /v1/capabilities/pipelines failed: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON response: {e}")
            raise
        except AssertionError as e:
            logger.error(f"❌ Assertion failed: {e}")
            raise
    
    def test_get_config_types(self) -> Dict[str, Any]:
        """Test GET /v1/capabilities/config-types endpoint"""
        logger.info("Testing GET /v1/capabilities/config-types")
        
        try:
            response = self.session.get(f"{self.base_url}/v1/capabilities/config-types")
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            logger.info(f"✅ GET /v1/capabilities/config-types successful")
            logger.info(f"Response keys: {list(data.keys())}")
            
            # Validate response structure
            assert isinstance(data, dict), "Response should be a dictionary"
            
            # Check for expected fields
            expected_fields = ['total_config_types', 'config_types']
            for field in expected_fields:
                if field in data:
                    logger.info(f"✅ Found expected field: {field}")
                else:
                    logger.warning(f"⚠️ Missing expected field: {field}")
            
            # Validate config_types structure
            if 'config_types' in data:
                config_types = data['config_types']
                assert isinstance(config_types, dict), "config_types should be a dictionary"
                logger.info(f"✅ Found {len(config_types)} config types")
                
                expected_config_types = ['standard', 'coding', 'review', 'creative']
                for config_type in expected_config_types:
                    if config_type in config_types:
                        logger.info(f"  ✅ Found config type: {config_type}")
                        config_info = config_types[config_type]
                        if 'agents' in config_info:
                            logger.info(f"    Agents count: {len(config_info['agents'])}")
                    else:
                        logger.warning(f"  ⚠️ Missing config type: {config_type}")
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ GET /v1/capabilities/config-types failed: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON response: {e}")
            raise
        except AssertionError as e:
            logger.error(f"❌ Assertion failed: {e}")
            raise
    
    def test_get_service_health(self) -> Dict[str, Any]:
        """Test GET /v1/capabilities/health endpoint"""
        logger.info("Testing GET /v1/capabilities/health")
        
        try:
            response = self.session.get(f"{self.base_url}/v1/capabilities/health")
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            logger.info(f"✅ GET /v1/capabilities/health successful")
            logger.info(f"Overall status: {data.get('overall_status', 'Unknown')}")
            
            # Validate response structure
            assert isinstance(data, dict), "Response should be a dictionary"
            
            # Check for expected fields
            expected_fields = ['overall_status', 'components', 'capabilities_ready', 'timestamp']
            for field in expected_fields:
                if field in data:
                    logger.info(f"✅ Found expected field: {field}")
                else:
                    logger.warning(f"⚠️ Missing expected field: {field}")
            
            # Validate components structure
            if 'components' in data:
                components = data['components']
                assert isinstance(components, dict), "components should be a dictionary"
                logger.info(f"✅ Found {len(components)} components")
                
                expected_components = ['agent_factory', 'agent_manager', 'available_agents']
                for component in expected_components:
                    if component in components:
                        logger.info(f"  ✅ Component: {component} - Status: {components[component].get('status', 'Unknown')}")
                    else:
                        logger.warning(f"  ⚠️ Missing component: {component}")
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ GET /v1/capabilities/health failed: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON response: {e}")
            raise
        except AssertionError as e:
            logger.error(f"❌ Assertion failed: {e}")
            raise
    
    def test_get_openapi_schema(self) -> Dict[str, Any]:
        """Test GET /v1/capabilities/openapi-schema endpoint"""
        logger.info("Testing GET /v1/capabilities/openapi-schema")
        
        try:
            response = self.session.get(f"{self.base_url}/v1/capabilities/openapi-schema")
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            logger.info(f"✅ GET /v1/capabilities/openapi-schema successful")
            logger.info(f"Response keys: {list(data.keys())}")
            
            # Validate response structure
            assert isinstance(data, dict), "Response should be a dictionary"
            
            # Check for expected OpenAPI fields
            expected_fields = ['openapi', 'info', 'servers', 'paths', 'components']
            for field in expected_fields:
                if field in data:
                    logger.info(f"✅ Found expected field: {field}")
                else:
                    logger.warning(f"⚠️ Missing expected field: {field}")
            
            # Validate OpenAPI version
            if 'openapi' in data:
                assert data['openapi'] == '3.0.0', f"Expected OpenAPI 3.0.0, got {data['openapi']}"
                logger.info(f"✅ OpenAPI version: {data['openapi']}")
            
            # Validate info section
            if 'info' in data:
                info = data['info']
                assert 'title' in info, "info should have 'title'"
                assert 'version' in info, "info should have 'version'"
                logger.info(f"✅ API info: {info.get('title')} v{info.get('version')}")
            
            # Validate paths
            if 'paths' in data:
                paths = data['paths']
                logger.info(f"✅ Found {len(paths)} API paths")
                for path in paths.keys():
                    logger.info(f"  Path: {path}")
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ GET /v1/capabilities/openapi-schema failed: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON response: {e}")
            raise
        except AssertionError as e:
            logger.error(f"❌ Assertion failed: {e}")
            raise
    
    def test_error_handling(self):
        """Test error handling for invalid endpoints"""
        logger.info("Testing error handling")
        
        # Test invalid endpoint
        try:
            response = self.session.get(f"{self.base_url}/v1/capabilities/invalid-endpoint")
            logger.info(f"Invalid endpoint returned status: {response.status_code}")
            
            if response.status_code == 404:
                logger.info("✅ Proper 404 handling for invalid endpoint")
            else:
                logger.warning(f"⚠️ Unexpected status code for invalid endpoint: {response.status_code}")
        
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Error testing invalid endpoint: {e}")
    
    def run_all_tests(self):
        """Run all capability tests"""
        logger.info("🚀 Starting Capabilities API Tests")
        logger.info("=" * 50)
        
        test_results = {}
        
        # Test connection first
        if not self.test_connection():
            logger.error("❌ Cannot connect to agent service. Make sure it's running on port 8001")
            return test_results
        
        # Run all tests
        tests = [
            ('get_all_capabilities', self.test_get_all_capabilities),
            ('get_capabilities_summary', self.test_get_capabilities_summary),
            ('get_agent_capabilities', self.test_get_agent_capabilities),
            ('get_pipeline_capabilities', self.test_get_pipeline_capabilities),
            ('get_config_types', self.test_get_config_types),
            ('get_service_health', self.test_get_service_health),
            ('get_openapi_schema', self.test_get_openapi_schema),
            ('error_handling', self.test_error_handling)
        ]
        
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
                
            except Exception as e:
                test_results[test_name] = {
                    'status': 'FAILED',
                    'error': str(e)
                }
                logger.error(f"❌ {test_name} FAILED: {e}")
        
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
    
    parser = argparse.ArgumentParser(description='Test Capabilities API')
    parser.add_argument('--url', default='http://localhost:8001', 
                       help='Base URL for the agent service (default: http://localhost:8001)')
    parser.add_argument('--test', choices=[
        'connection', 'all_capabilities', 'summary', 'agents', 'pipelines', 
        'config_types', 'health', 'openapi', 'errors', 'all'
    ], default='all', help='Specific test to run (default: all)')
    
    args = parser.parse_args()
    
    tester = TestCapabilitiesAPI(base_url=args.url)
    
    if args.test == 'all':
        tester.run_all_tests()
    elif args.test == 'connection':
        tester.test_connection()
    elif args.test == 'all_capabilities':
        tester.test_get_all_capabilities()
    elif args.test == 'summary':
        tester.test_get_capabilities_summary()
    elif args.test == 'agents':
        tester.test_get_agent_capabilities()
    elif args.test == 'pipelines':
        tester.test_get_pipeline_capabilities()
    elif args.test == 'config_types':
        tester.test_get_config_types()
    elif args.test == 'health':
        tester.test_get_service_health()
    elif args.test == 'openapi':
        tester.test_get_openapi_schema()
    elif args.test == 'errors':
        tester.test_error_handling()


if __name__ == "__main__":
    main()

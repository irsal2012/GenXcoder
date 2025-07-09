#!/usr/bin/env python3
"""
Test script to verify the timeout fix for frontend-initiated code generation.
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime

async def test_code_generation_timeout_fix():
    """Test that the frontend can properly initiate code generation without timeout."""
    
    print("🧪 Testing Frontend Code Generation Timeout Fix")
    print("=" * 60)
    
    # Test data
    test_request = {
        "input_data": "Create a data analysis tool that reads CSV files, performs statistical analysis, generates interactive visualizations, and exports comprehensive reports in PDF format.",
        "pipeline_name": "test-data-analyzer",
        "async_execution": True
    }
    
    agent_service_url = "http://localhost:8001"
    
    try:
        async with aiohttp.ClientSession() as session:
            print(f"📡 Testing agent service at {agent_service_url}")
            
            # Step 1: Test health check
            print("\n1️⃣ Testing health check...")
            try:
                async with session.get(f"{agent_service_url}/health", timeout=5) as response:
                    if response.status == 200:
                        print("✅ Agent service is healthy")
                    else:
                        print(f"⚠️ Agent service health check returned {response.status}")
            except Exception as e:
                print(f"❌ Agent service health check failed: {e}")
                return False
            
            # Step 2: Test pipeline initialization
            print("\n2️⃣ Testing pipeline initialization...")
            try:
                async with session.post(
                    f"{agent_service_url}/v1/pipelines/initialize",
                    params={"pipeline_name": "iterative_development"},
                    timeout=10
                ) as response:
                    if response.status == 200:
                        init_data = await response.json()
                        print("✅ Pipeline initialized successfully")
                        print(f"   Pipeline: {init_data.get('pipeline_info', {}).get('name', 'Unknown')}")
                    else:
                        print(f"⚠️ Pipeline initialization returned {response.status}")
                        error_text = await response.text()
                        print(f"   Error: {error_text}")
            except Exception as e:
                print(f"❌ Pipeline initialization failed: {e}")
                return False
            
            # Step 3: Test async pipeline execution (the main fix)
            print("\n3️⃣ Testing async pipeline execution...")
            start_time = time.time()
            
            try:
                async with session.post(
                    f"{agent_service_url}/v1/pipelines/execute",
                    json=test_request,
                    timeout=15  # Short timeout to test the fix
                ) as response:
                    execution_time = time.time() - start_time
                    
                    if response.status == 200:
                        response_data = await response.json()
                        execution_id = response_data.get('execution_id')
                        
                        print(f"✅ Pipeline execution started successfully in {execution_time:.2f}s")
                        print(f"   Execution ID: {execution_id}")
                        print(f"   Status: {response_data.get('status', 'Unknown')}")
                        print(f"   Message: {response_data.get('message', 'No message')}")
                        
                        # Step 4: Test status polling
                        if execution_id:
                            print(f"\n4️⃣ Testing status polling for execution {execution_id}...")
                            
                            for i in range(3):  # Poll 3 times
                                await asyncio.sleep(2)
                                try:
                                    async with session.get(
                                        f"{agent_service_url}/v1/pipelines/execution/{execution_id}/status",
                                        timeout=5
                                    ) as status_response:
                                        if status_response.status == 200:
                                            status_data = await status_response.json()
                                            print(f"   Poll {i+1}: Status = {status_data.get('status', 'Unknown')}")
                                            
                                            if status_data.get('progress'):
                                                progress = status_data['progress']
                                                print(f"   Progress: {progress.get('progress_percentage', 0):.1f}%")
                                        else:
                                            print(f"   Poll {i+1}: Status check returned {status_response.status}")
                                except Exception as e:
                                    print(f"   Poll {i+1}: Status check failed: {e}")
                        
                        return True
                    else:
                        print(f"❌ Pipeline execution failed with status {response.status}")
                        error_text = await response.text()
                        print(f"   Error: {error_text}")
                        return False
                        
            except asyncio.TimeoutError:
                execution_time = time.time() - start_time
                print(f"❌ Pipeline execution timed out after {execution_time:.2f}s")
                print("   This indicates the timeout fix is NOT working properly")
                return False
            except Exception as e:
                execution_time = time.time() - start_time
                print(f"❌ Pipeline execution failed after {execution_time:.2f}s: {e}")
                return False
                
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False

async def test_frontend_api_simulation():
    """Simulate the frontend API calls to test the complete flow."""
    
    print("\n🌐 Testing Frontend API Simulation")
    print("=" * 60)
    
    frontend_request = {
        "user_input": "Create a data analysis tool that reads CSV files, performs statistical analysis, generates interactive visualizations, and exports comprehensive reports in PDF format.",
        "project_name": "test-data-analyzer"
    }
    
    agent_service_url = "http://localhost:8001"
    
    try:
        async with aiohttp.ClientSession() as session:
            # Simulate the frontend generateCode API call
            print("📱 Simulating frontend generateCode API call...")
            
            # Step 1: Initialize pipeline (as done in the fixed API)
            print("   1. Initializing pipeline...")
            try:
                async with session.post(
                    f"{agent_service_url}/v1/pipelines/initialize",
                    params={"pipeline_name": "iterative_development"},
                    timeout=10
                ) as response:
                    if response.status != 200:
                        print(f"   ❌ Pipeline initialization failed: {response.status}")
                        return False
                    print("   ✅ Pipeline initialized")
            except Exception as e:
                print(f"   ❌ Pipeline initialization error: {e}")
                return False
            
            # Step 2: Execute pipeline asynchronously (with short timeout)
            print("   2. Starting async pipeline execution...")
            start_time = time.time()
            
            try:
                async with session.post(
                    f"{agent_service_url}/v1/pipelines/execute",
                    json={
                        "input_data": frontend_request["user_input"],
                        "pipeline_name": frontend_request.get("project_name", "iterative_development"),
                        "async_execution": True
                    },
                    timeout=10  # Short timeout as in the fix
                ) as response:
                    execution_time = time.time() - start_time
                    
                    if response.status == 200:
                        response_data = await response.json()
                        execution_id = response_data.get('execution_id')
                        
                        print(f"   ✅ Frontend API simulation successful in {execution_time:.2f}s")
                        print(f"   📋 Execution ID: {execution_id}")
                        print(f"   📊 Status: {response_data.get('status', 'Unknown')}")
                        
                        # This would be where the frontend starts polling via ProgressTracker
                        print("   🔄 Frontend would now start polling via ProgressTracker...")
                        
                        return True
                    else:
                        print(f"   ❌ Pipeline execution failed: {response.status}")
                        return False
                        
            except asyncio.TimeoutError:
                execution_time = time.time() - start_time
                print(f"   ❌ Request timed out after {execution_time:.2f}s - Fix not working!")
                return False
            except Exception as e:
                execution_time = time.time() - start_time
                print(f"   ❌ Request failed after {execution_time:.2f}s: {e}")
                return False
                
    except Exception as e:
        print(f"❌ Frontend simulation failed: {e}")
        return False

async def main():
    """Run all tests."""
    print(f"🚀 Starting Timeout Fix Tests at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Test 1: Basic agent service functionality
    test1_result = await test_code_generation_timeout_fix()
    
    # Test 2: Frontend API simulation
    test2_result = await test_frontend_api_simulation()
    
    # Summary
    print("\n📋 Test Summary")
    print("=" * 60)
    print(f"Agent Service Test: {'✅ PASSED' if test1_result else '❌ FAILED'}")
    print(f"Frontend API Test:  {'✅ PASSED' if test2_result else '❌ FAILED'}")
    
    if test1_result and test2_result:
        print("\n🎉 All tests passed! The timeout fix is working correctly.")
        print("\n💡 Key improvements:")
        print("   • Pipeline initialization is now separate from execution")
        print("   • Async execution returns quickly with execution ID")
        print("   • Frontend can poll for progress without timeout issues")
        print("   • Better error handling for different failure scenarios")
    else:
        print("\n⚠️ Some tests failed. Please check the agent service and try again.")
        
    return test1_result and test2_result

if __name__ == "__main__":
    asyncio.run(main())

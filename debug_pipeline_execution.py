#!/usr/bin/env python3
"""
Debug script to identify where the pipeline execution is getting stuck.
"""

import asyncio
import aiohttp
import json
import time
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('debug_pipeline.log')
    ]
)
logger = logging.getLogger(__name__)

async def debug_pipeline_execution():
    """Debug the complete pipeline execution flow."""
    
    print("🔍 Starting Pipeline Execution Debug")
    print("=" * 60)
    
    agent_service_url = "http://localhost:8001"
    backend_url = "http://localhost:8000"
    
    # Test data
    test_request = {
        "input_data": "Create a simple calculator application with basic arithmetic operations (add, subtract, multiply, divide) and a clean user interface.",
        "pipeline_name": "test-calculator",
        "async_execution": True
    }
    
    execution_id = None
    
    try:
        async with aiohttp.ClientSession() as session:
            
            # Step 1: Check service health
            print("\n1️⃣ Checking service health...")
            
            # Check agent service
            try:
                async with session.get(f"{agent_service_url}/health", timeout=5) as response:
                    if response.status == 200:
                        health_data = await response.json()
                        print(f"✅ Agent service healthy: {health_data}")
                    else:
                        print(f"⚠️ Agent service health check returned {response.status}")
                        return False
            except Exception as e:
                print(f"❌ Agent service unreachable: {e}")
                return False
            
            # Check backend service
            try:
                async with session.get(f"{backend_url}/health", timeout=5) as response:
                    if response.status == 200:
                        health_data = await response.json()
                        print(f"✅ Backend service healthy: {health_data}")
                    else:
                        print(f"⚠️ Backend service health check returned {response.status}")
            except Exception as e:
                print(f"⚠️ Backend service unreachable: {e}")
            
            # Step 2: Initialize pipeline
            print("\n2️⃣ Initializing pipeline...")
            try:
                start_time = time.time()
                async with session.post(
                    f"{agent_service_url}/v1/pipelines/initialize",
                    params={"pipeline_name": "iterative_development"},
                    timeout=15
                ) as response:
                    duration = time.time() - start_time
                    if response.status == 200:
                        init_data = await response.json()
                        print(f"✅ Pipeline initialized in {duration:.2f}s")
                        print(f"   Active agents: {len(init_data.get('active_agents', {}))}")
                        print(f"   Pipeline info: {init_data.get('pipeline_info', {}).get('name', 'Unknown')}")
                    else:
                        error_text = await response.text()
                        print(f"❌ Pipeline initialization failed ({response.status}): {error_text}")
                        return False
            except Exception as e:
                print(f"❌ Pipeline initialization error: {e}")
                return False
            
            # Step 3: Start async execution
            print("\n3️⃣ Starting async pipeline execution...")
            try:
                start_time = time.time()
                async with session.post(
                    f"{agent_service_url}/v1/pipelines/execute",
                    json=test_request,
                    timeout=15
                ) as response:
                    duration = time.time() - start_time
                    
                    if response.status == 200:
                        response_data = await response.json()
                        execution_id = response_data.get('execution_id')
                        
                        print(f"✅ Async execution started in {duration:.2f}s")
                        print(f"   Execution ID: {execution_id}")
                        print(f"   Status: {response_data.get('status')}")
                        print(f"   Message: {response_data.get('message')}")
                    else:
                        error_text = await response.text()
                        print(f"❌ Pipeline execution failed ({response.status}): {error_text}")
                        return False
            except Exception as e:
                print(f"❌ Pipeline execution error: {e}")
                return False
            
            if not execution_id:
                print("❌ No execution ID received")
                return False
            
            # Step 4: Monitor execution progress
            print(f"\n4️⃣ Monitoring execution progress for {execution_id}...")
            
            max_polls = 60  # Monitor for up to 5 minutes (60 * 5s = 300s)
            poll_count = 0
            last_status = None
            last_progress = 0
            stuck_count = 0
            
            while poll_count < max_polls:
                poll_count += 1
                
                try:
                    async with session.get(
                        f"{agent_service_url}/v1/pipelines/execution/{execution_id}/status",
                        timeout=10
                    ) as status_response:
                        if status_response.status == 200:
                            status_data = await status_response.json()
                            current_status = status_data.get('status')
                            progress = status_data.get('progress', {})
                            progress_pct = progress.get('progress_percentage', 0)
                            
                            # Check if we're stuck
                            if (current_status == last_status and 
                                progress_pct == last_progress and 
                                current_status == 'running'):
                                stuck_count += 1
                            else:
                                stuck_count = 0
                            
                            print(f"   Poll {poll_count:2d}: Status={current_status}, Progress={progress_pct:.1f}%")
                            
                            if progress.get('current_step_info'):
                                step_info = progress['current_step_info']
                                print(f"            Current step: {step_info.get('name', 'Unknown')}")
                                if step_info.get('description'):
                                    print(f"            Description: {step_info['description']}")
                            
                            # Log detailed progress info
                            if progress.get('steps'):
                                running_steps = [s for s in progress['steps'] if s.get('status') == 'running']
                                completed_steps = [s for s in progress['steps'] if s.get('status') == 'completed']
                                failed_steps = [s for s in progress['steps'] if s.get('status') == 'failed']
                                
                                print(f"            Steps: {len(completed_steps)} completed, {len(running_steps)} running, {len(failed_steps)} failed")
                                
                                if running_steps:
                                    for step in running_steps:
                                        print(f"            Running: {step.get('name', 'Unknown')} ({step.get('progress_percentage', 0):.1f}%)")
                            
                            # Check for completion
                            if current_status in ['completed', 'failed']:
                                print(f"\n🏁 Execution {current_status}!")
                                if current_status == 'completed':
                                    result = status_data.get('result', {})
                                    print(f"   Success: {result.get('success', False)}")
                                    if result.get('results'):
                                        print(f"   Results keys: {list(result['results'].keys())}")
                                else:
                                    error = status_data.get('error')
                                    print(f"   Error: {error}")
                                break
                            
                            # Check if stuck
                            if stuck_count >= 6:  # Stuck for 30 seconds
                                print(f"\n⚠️ Execution appears stuck at {current_status} with {progress_pct:.1f}% progress")
                                print("   Investigating further...")
                                
                                # Try to get more detailed info
                                try:
                                    async with session.get(f"{agent_service_url}/v1/pipelines/info", timeout=5) as info_response:
                                        if info_response.status == 200:
                                            info_data = await info_response.json()
                                            print(f"   Pipeline info: {json.dumps(info_data, indent=2)}")
                                except Exception as e:
                                    print(f"   Failed to get pipeline info: {e}")
                                
                                # Check agent service logs (if accessible)
                                print("   Check agent service logs for more details")
                                break
                            
                            last_status = current_status
                            last_progress = progress_pct
                            
                        else:
                            print(f"   Poll {poll_count:2d}: Status check failed ({status_response.status})")
                            
                except Exception as e:
                    print(f"   Poll {poll_count:2d}: Status check error: {e}")
                
                # Wait before next poll
                await asyncio.sleep(5)
            
            if poll_count >= max_polls:
                print(f"\n⏰ Monitoring timeout after {max_polls} polls")
                return False
            
            return True
            
    except Exception as e:
        logger.error(f"Debug script failed: {e}")
        return False

async def test_individual_components():
    """Test individual components to isolate issues."""
    
    print("\n🧪 Testing Individual Components")
    print("=" * 60)
    
    agent_service_url = "http://localhost:8001"
    
    try:
        async with aiohttp.ClientSession() as session:
            
            # Test 1: Agent discovery
            print("\n🔍 Testing agent discovery...")
            try:
                async with session.get(f"{agent_service_url}/v1/agents/", timeout=10) as response:
                    if response.status == 200:
                        agents_data = await response.json()
                        print(f"✅ Found {agents_data.get('total_agents', 0)} agents")
                        for agent_key, agent_info in agents_data.get('agents', {}).items():
                            print(f"   - {agent_key}: {agent_info.get('name', 'Unknown')}")
                    else:
                        print(f"❌ Agent discovery failed: {response.status}")
            except Exception as e:
                print(f"❌ Agent discovery error: {e}")
            
            # Test 2: Capabilities
            print("\n🔧 Testing capabilities...")
            try:
                async with session.get(f"{agent_service_url}/v1/capabilities/", timeout=10) as response:
                    if response.status == 200:
                        caps_data = await response.json()
                        print(f"✅ Capabilities loaded")
                        print(f"   Available: {list(caps_data.keys()) if isinstance(caps_data, dict) else 'Unknown format'}")
                    else:
                        print(f"❌ Capabilities check failed: {response.status}")
            except Exception as e:
                print(f"❌ Capabilities error: {e}")
            
            # Test 3: Pipeline configurations
            print("\n📋 Testing pipeline configurations...")
            try:
                async with session.get(f"{agent_service_url}/v1/pipelines/", timeout=10) as response:
                    if response.status == 200:
                        pipeline_data = await response.json()
                        print(f"✅ Pipeline configurations accessible")
                        print(f"   Data: {json.dumps(pipeline_data, indent=2)}")
                    else:
                        print(f"❌ Pipeline config check failed: {response.status}")
            except Exception as e:
                print(f"❌ Pipeline config error: {e}")
            
    except Exception as e:
        print(f"❌ Component testing failed: {e}")

async def main():
    """Run all debug tests."""
    
    print(f"🚀 Starting Debug Session at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Individual components
    await test_individual_components()
    
    # Test 2: Full pipeline execution
    success = await debug_pipeline_execution()
    
    # Summary
    print("\n📋 Debug Summary")
    print("=" * 60)
    
    if success:
        print("✅ Pipeline execution completed successfully")
        print("💡 The timeout issue appears to be resolved")
    else:
        print("❌ Pipeline execution encountered issues")
        print("💡 Check the logs above for specific failure points")
        print("💡 Common issues:")
        print("   - Agent service not running (port 8001)")
        print("   - Pipeline configuration missing")
        print("   - Agent initialization failures")
        print("   - Background task execution problems")
        print("   - AI model/API connectivity issues")
    
    print(f"\n📝 Debug log saved to: debug_pipeline.log")
    print("🔍 For more details, check agent service logs and backend logs")

if __name__ == "__main__":
    asyncio.run(main())

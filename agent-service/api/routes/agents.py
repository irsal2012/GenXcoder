"""
Agent execution API routes for the standalone agent service.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Dict, Any, Optional
import asyncio
import json
import uuid
from datetime import datetime

from core.agent_manager_v2 import agent_manager_v2
from core.agent_factory import agent_factory
from models.requests import AgentExecutionRequest
from models.responses import AgentExecutionResponse

router = APIRouter()

# Store for tracking agent executions
execution_store: Dict[str, Dict[str, Any]] = {}

@router.post("/{agent_name}/execute", response_model=AgentExecutionResponse)
async def execute_agent(
    agent_name: str,
    request: AgentExecutionRequest,
    background_tasks: BackgroundTasks
):
    """
    Execute a specific agent with input data.
    
    This endpoint allows executing individual agents without running the full pipeline.
    Useful for applications that need specific agent capabilities.
    """
    try:
        # Validate agent exists
        available_agents = agent_factory.get_available_agents()
        agent_key = agent_name.lower().replace(' ', '_').replace('-', '_')
        
        if agent_key not in available_agents:
            raise HTTPException(
                status_code=404, 
                detail=f"Agent '{agent_name}' not found. Available agents: {list(available_agents.keys())}"
            )
        
        # Generate execution ID
        execution_id = str(uuid.uuid4())
        
        # Store execution info
        execution_store[execution_id] = {
            "agent_name": agent_name,
            "agent_key": agent_key,
            "status": "running",
            "started_at": datetime.now().isoformat(),
            "input_data": request.input_data,
            "config": request.config,
            "result": None,
            "error": None
        }
        
        # Execute agent in background if async requested
        if request.async_execution:
            background_tasks.add_task(
                _execute_agent_background, 
                execution_id, 
                agent_key, 
                request.input_data,
                request.config
            )
            
            return AgentExecutionResponse(
                success=True,
                execution_id=execution_id,
                agent_name=agent_name,
                status="running",
                message="Agent execution started in background",
                result=None
            )
        else:
            # Execute synchronously
            try:
                agent = agent_factory.create_agent(agent_key, request.config)
                result = agent.process(request.input_data, context=request.context or {})
                
                # Update execution store
                execution_store[execution_id].update({
                    "status": "completed",
                    "completed_at": datetime.now().isoformat(),
                    "result": result
                })
                
                return AgentExecutionResponse(
                    success=True,
                    execution_id=execution_id,
                    agent_name=agent_name,
                    status="completed",
                    message="Agent execution completed successfully",
                    result=result
                )
                
            except Exception as e:
                # Update execution store with error
                execution_store[execution_id].update({
                    "status": "failed",
                    "completed_at": datetime.now().isoformat(),
                    "error": str(e)
                })
                
                raise HTTPException(
                    status_code=500,
                    detail=f"Agent execution failed: {str(e)}"
                )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute agent: {str(e)}"
        )

@router.get("/{agent_name}/metadata")
async def get_agent_metadata(agent_name: str):
    """
    Get metadata for a specific agent.
    
    Returns detailed information about the agent including capabilities,
    configuration requirements, and usage examples.
    """
    try:
        available_agents = agent_factory.get_available_agents()
        agent_key = agent_name.lower().replace(' ', '_').replace('-', '_')
        
        if agent_key not in available_agents:
            raise HTTPException(
                status_code=404,
                detail=f"Agent '{agent_name}' not found"
            )
        
        metadata = available_agents[agent_key]
        
        return {
            "agent_name": agent_name,
            "agent_key": agent_key,
            "metadata": {
                "name": metadata.name,
                "description": metadata.description,
                "capabilities": metadata.capabilities,
                "config_type": metadata.config_type.value,
                "dependencies": metadata.dependencies or [],
                "version": metadata.version,
                "author": metadata.author
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get agent metadata: {str(e)}"
        )

@router.get("/{agent_name}/validate")
async def validate_agent_input(agent_name: str, input_data: Dict[str, Any]):
    """
    Validate input data for a specific agent.
    
    Returns validation results including warnings and suggestions.
    """
    try:
        available_agents = agent_factory.get_available_agents()
        agent_key = agent_name.lower().replace(' ', '_').replace('-', '_')
        
        if agent_key not in available_agents:
            raise HTTPException(
                status_code=404,
                detail=f"Agent '{agent_name}' not found"
            )
        
        # Create agent instance for validation
        agent = agent_factory.create_agent(agent_key)
        validation_result = agent.validate_input(input_data)
        
        return {
            "agent_name": agent_name,
            "validation": validation_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to validate input: {str(e)}"
        )

@router.get("/execution/{execution_id}/status")
async def get_execution_status(execution_id: str):
    """
    Get the status of an agent execution.
    
    Returns current status, progress, and results if completed.
    """
    if execution_id not in execution_store:
        raise HTTPException(
            status_code=404,
            detail=f"Execution '{execution_id}' not found"
        )
    
    execution_info = execution_store[execution_id]
    
    return {
        "execution_id": execution_id,
        "agent_name": execution_info["agent_name"],
        "status": execution_info["status"],
        "started_at": execution_info["started_at"],
        "completed_at": execution_info.get("completed_at"),
        "result": execution_info.get("result"),
        "error": execution_info.get("error")
    }

@router.get("/execution/{execution_id}/stream")
async def stream_execution_status(execution_id: str):
    """
    Stream execution status updates via Server-Sent Events.
    
    Useful for real-time monitoring of long-running agent executions.
    """
    if execution_id not in execution_store:
        raise HTTPException(
            status_code=404,
            detail=f"Execution '{execution_id}' not found"
        )
    
    async def event_stream():
        while True:
            if execution_id not in execution_store:
                break
                
            execution_info = execution_store[execution_id]
            
            # Send status update
            yield f"data: {json.dumps(execution_info)}\n\n"
            
            # Break if execution is completed or failed
            if execution_info["status"] in ["completed", "failed"]:
                break
                
            await asyncio.sleep(1)  # Poll every second
    
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

@router.get("/")
async def list_available_agents():
    """
    List all available agents with their basic information.
    
    Returns a summary of all registered agents that can be executed.
    """
    try:
        available_agents = agent_factory.get_available_agents()
        factory_stats = agent_factory.get_factory_stats()
        
        agents_list = []
        for agent_key, metadata in available_agents.items():
            agents_list.append({
                "agent_key": agent_key,
                "name": metadata.name,
                "description": metadata.description,
                "capabilities": metadata.capabilities,
                "config_type": metadata.config_type.value,
                "version": metadata.version
            })
        
        return {
            "total_agents": len(agents_list),
            "factory_stats": factory_stats,
            "agents": agents_list
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list agents: {str(e)}"
        )

async def _execute_agent_background(
    execution_id: str, 
    agent_key: str, 
    input_data: Any,
    config: Optional[Dict[str, Any]] = None
):
    """Background task for executing agents asynchronously."""
    try:
        agent = agent_factory.create_agent(agent_key, config)
        result = agent.process(input_data)
        
        # Update execution store
        execution_store[execution_id].update({
            "status": "completed",
            "completed_at": datetime.now().isoformat(),
            "result": result
        })
        
    except Exception as e:
        # Update execution store with error
        execution_store[execution_id].update({
            "status": "failed",
            "completed_at": datetime.now().isoformat(),
            "error": str(e)
        })

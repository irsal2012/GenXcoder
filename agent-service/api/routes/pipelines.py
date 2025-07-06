"""
Pipeline execution API routes for the standalone agent service.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Dict, Any, Optional
import asyncio
import json
import uuid
from datetime import datetime

from core.agent_manager_v2 import agent_manager_v2
from models.requests import PipelineExecutionRequest
from models.responses import PipelineExecutionResponse

router = APIRouter()

# Store for tracking pipeline executions
pipeline_execution_store: Dict[str, Dict[str, Any]] = {}

@router.post("/execute", response_model=PipelineExecutionResponse)
async def execute_pipeline(
    request: PipelineExecutionRequest,
    background_tasks: BackgroundTasks
):
    """
    Execute a complete agent pipeline.
    
    This endpoint runs the full multi-agent pipeline with the specified configuration.
    Supports both synchronous and asynchronous execution modes.
    """
    try:
        # Initialize pipeline
        pipeline_name = request.pipeline_name or "default"
        success = agent_manager_v2.initialize_pipeline(pipeline_name)
        
        if not success:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to initialize pipeline '{pipeline_name}'"
            )
        
        # Generate execution ID
        execution_id = str(uuid.uuid4())
        
        # Store execution info
        pipeline_execution_store[execution_id] = {
            "pipeline_name": pipeline_name,
            "status": "running",
            "started_at": datetime.now().isoformat(),
            "input_data": request.input_data,
            "config": request.config,
            "result": None,
            "error": None,
            "progress": agent_manager_v2.get_progress()
        }
        
            # Execute pipeline in background if async requested
        if request.async_execution:
            background_tasks.add_task(
                _execute_pipeline_background,
                execution_id,
                request.input_data,
                request.correlation_id,
                pipeline_name
            )
            
            return PipelineExecutionResponse(
                success=True,
                execution_id=execution_id,
                pipeline_name=pipeline_name,
                status="running",
                message="Pipeline execution started in background",
                result=None,
                progress=agent_manager_v2.get_progress()
            )
        else:
            # Execute synchronously
            try:
                result = await agent_manager_v2.execute_pipeline(
                    request.input_data,
                    request.correlation_id
                )
                
                # Update execution store
                pipeline_execution_store[execution_id].update({
                    "status": "completed" if result.get("success") else "failed",
                    "completed_at": datetime.now().isoformat(),
                    "result": result,
                    "progress": agent_manager_v2.get_progress()
                })
                
                return PipelineExecutionResponse(
                    success=result.get("success", False),
                    execution_id=execution_id,
                    pipeline_name=pipeline_name,
                    status="completed" if result.get("success") else "failed",
                    message="Pipeline execution completed",
                    result=result,
                    progress=agent_manager_v2.get_progress()
                )
                
            except Exception as e:
                # Update execution store with error
                pipeline_execution_store[execution_id].update({
                    "status": "failed",
                    "completed_at": datetime.now().isoformat(),
                    "error": str(e),
                    "progress": agent_manager_v2.get_progress()
                })
                
                raise HTTPException(
                    status_code=500,
                    detail=f"Pipeline execution failed: {str(e)}"
                )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute pipeline: {str(e)}"
        )

@router.get("/execution/{execution_id}/status")
async def get_pipeline_execution_status(execution_id: str):
    """
    Get the status of a pipeline execution.
    
    Returns current status, progress, and results if completed.
    """
    if execution_id not in pipeline_execution_store:
        raise HTTPException(
            status_code=404,
            detail=f"Pipeline execution '{execution_id}' not found"
        )
    
    execution_info = pipeline_execution_store[execution_id]
    
    # Update progress if still running
    if execution_info["status"] == "running":
        execution_info["progress"] = agent_manager_v2.get_progress()
    
    return {
        "execution_id": execution_id,
        "pipeline_name": execution_info["pipeline_name"],
        "status": execution_info["status"],
        "started_at": execution_info["started_at"],
        "completed_at": execution_info.get("completed_at"),
        "result": execution_info.get("result"),
        "error": execution_info.get("error"),
        "progress": execution_info.get("progress", {})
    }

@router.get("/execution/{execution_id}/stream")
async def stream_pipeline_execution_status(execution_id: str):
    """
    Stream pipeline execution status updates via Server-Sent Events.
    
    Provides real-time updates on pipeline progress including step completion,
    current status, and intermediate results.
    """
    if execution_id not in pipeline_execution_store:
        raise HTTPException(
            status_code=404,
            detail=f"Pipeline execution '{execution_id}' not found"
        )
    
    async def event_stream():
        while True:
            if execution_id not in pipeline_execution_store:
                break
                
            execution_info = pipeline_execution_store[execution_id]
            
            # Update progress if still running
            if execution_info["status"] == "running":
                execution_info["progress"] = agent_manager_v2.get_progress()
            
            # Send status update
            yield f"data: {json.dumps(execution_info)}\n\n"
            
            # Break if execution is completed or failed
            if execution_info["status"] in ["completed", "failed"]:
                break
                
            await asyncio.sleep(2)  # Poll every 2 seconds for pipeline updates
    
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

@router.get("/info")
async def get_pipeline_info():
    """
    Get information about the current pipeline configuration.
    
    Returns pipeline metadata, steps, execution order, and available configurations.
    """
    try:
        pipeline_info = agent_manager_v2.get_pipeline_info()
        active_agents = agent_manager_v2.get_active_agents()
        
        if not pipeline_info:
            return {
                "pipeline_loaded": False,
                "message": "No pipeline currently loaded. Use initialize endpoint to load a pipeline."
            }
        
        return {
            "pipeline_loaded": True,
            "pipeline_info": pipeline_info,
            "active_agents": active_agents,
            "current_progress": agent_manager_v2.get_progress()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get pipeline info: {str(e)}"
        )

@router.post("/initialize")
async def initialize_pipeline(pipeline_name: str = "default"):
    """
    Initialize a pipeline configuration.
    
    Loads the specified pipeline configuration and prepares agents for execution.
    Must be called before executing pipelines.
    """
    try:
        success = agent_manager_v2.initialize_pipeline(pipeline_name)
        
        if not success:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to initialize pipeline '{pipeline_name}'"
            )
        
        pipeline_info = agent_manager_v2.get_pipeline_info()
        active_agents = agent_manager_v2.get_active_agents()
        
        return {
            "success": True,
            "message": f"Pipeline '{pipeline_name}' initialized successfully",
            "pipeline_info": pipeline_info,
            "active_agents": active_agents
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize pipeline: {str(e)}"
        )

@router.post("/validate")
async def validate_pipeline_input(input_data: Dict[str, Any]):
    """
    Validate input data for pipeline execution.
    
    Returns validation results including warnings and suggestions for improvement.
    """
    try:
        validation_result = agent_manager_v2.validate_input(str(input_data))
        
        return {
            "validation": validation_result,
            "input_data": input_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to validate input: {str(e)}"
        )

@router.delete("/clear")
async def clear_pipeline():
    """
    Clear the current pipeline and reset all agents.
    
    Useful for cleaning up resources and preparing for a new pipeline configuration.
    """
    try:
        agent_manager_v2.clear_agents()
        
        return {
            "success": True,
            "message": "Pipeline cleared successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear pipeline: {str(e)}"
        )

@router.get("/")
async def list_pipeline_executions():
    """
    List all pipeline executions with their current status.
    
    Returns a summary of all pipeline executions including active and completed ones.
    """
    try:
        executions = []
        for execution_id, execution_info in pipeline_execution_store.items():
            # Update progress for running executions
            if execution_info["status"] == "running":
                execution_info["progress"] = agent_manager_v2.get_progress()
            
            executions.append({
                "execution_id": execution_id,
                "pipeline_name": execution_info["pipeline_name"],
                "status": execution_info["status"],
                "started_at": execution_info["started_at"],
                "completed_at": execution_info.get("completed_at"),
                "has_error": execution_info.get("error") is not None,
                "progress_percentage": execution_info.get("progress", {}).get("progress_percentage", 0)
            })
        
        return {
            "total_executions": len(executions),
            "executions": executions
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list executions: {str(e)}"
        )

async def _execute_pipeline_background(
    execution_id: str,
    input_data: Any,
    correlation_id: Optional[str] = None,
    pipeline_name: str = "default"
):
    """Background task for executing pipelines asynchronously."""
    import httpx
    import logging
    
    logger = logging.getLogger(__name__)
    
    try:
        result = await agent_manager_v2.execute_pipeline(input_data, correlation_id)
        
        # Update execution store
        pipeline_execution_store[execution_id].update({
            "status": "completed" if result.get("success") else "failed",
            "completed_at": datetime.now().isoformat(),
            "result": result,
            "progress": agent_manager_v2.get_progress()
        })
        
        # If pipeline completed successfully, save to backend
        if result.get("success"):
            try:
                # Prepare data for backend
                project_data = {
                    "execution_id": execution_id,
                    "pipeline_name": pipeline_name,
                    "input_data": input_data,
                    "status": "completed",
                    "started_at": pipeline_execution_store[execution_id]["started_at"],
                    "completed_at": pipeline_execution_store[execution_id]["completed_at"],
                    "result": result.get("results", {})
                }
                
                # Call backend to save the project
                async with httpx.AsyncClient() as client:
                    backend_response = await client.post(
                        "http://localhost:8000/api/v1/projects/save-generated",
                        json=project_data,
                        timeout=30.0
                    )
                    
                    if backend_response.status_code == 200:
                        logger.info(f"Successfully saved project {execution_id} to backend")
                    else:
                        logger.warning(f"Failed to save project {execution_id} to backend: {backend_response.status_code}")
                        
            except Exception as save_error:
                logger.error(f"Error saving project {execution_id} to backend: {str(save_error)}")
                # Don't fail the pipeline execution if saving fails
        
    except Exception as e:
        # Update execution store with error
        pipeline_execution_store[execution_id].update({
            "status": "failed",
            "completed_at": datetime.now().isoformat(),
            "error": str(e),
            "progress": agent_manager_v2.get_progress()
        })

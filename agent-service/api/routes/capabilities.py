"""
Capabilities API routes for the standalone agent service.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from core.agent_factory import agent_factory
from core.agent_manager_v2 import agent_manager_v2

router = APIRouter()

@router.get("/")
async def get_all_capabilities():
    """
    Get comprehensive capabilities information for all agents.
    
    Returns detailed information about all available agents including
    their capabilities, metadata, and current status.
    """
    try:
        available_agents = agent_factory.get_available_agents()
        factory_stats = agent_factory.get_factory_stats()
        pipeline_info = agent_manager_v2.get_pipeline_info()
        
        capabilities = {
            "service_info": {
                "name": "Agent Service",
                "version": "1.0.0",
                "description": "Standalone multi-agent service for code generation and analysis"
            },
            "factory_stats": factory_stats,
            "pipeline_info": pipeline_info,
            "total_agents": len(available_agents),
            "agents": {}
        }
        
        # Build detailed agent capabilities
        for agent_key, metadata in available_agents.items():
            capabilities["agents"][agent_key] = {
                "name": metadata.name,
                "description": metadata.description,
                "capabilities": metadata.capabilities,
                "config_type": metadata.config_type.value,
                "dependencies": metadata.dependencies or [],
                "version": metadata.version,
                "author": metadata.author,
                "endpoints": {
                    "execute": f"/v1/agents/{agent_key}/execute",
                    "metadata": f"/v1/agents/{agent_key}/metadata",
                    "validate": f"/v1/agents/{agent_key}/validate"
                }
            }
        
        return capabilities
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get capabilities: {str(e)}"
        )

@router.get("/summary")
async def get_capabilities_summary():
    """
    Get a summary of service capabilities.
    
    Returns high-level information about the service and available functionality.
    """
    try:
        available_agents = agent_factory.get_available_agents()
        factory_stats = agent_factory.get_factory_stats()
        
        # Collect unique capabilities across all agents
        all_capabilities = set()
        config_types = set()
        
        for metadata in available_agents.values():
            all_capabilities.update(metadata.capabilities)
            config_types.add(metadata.config_type.value)
        
        return {
            "service": "Agent Service",
            "version": "1.0.0",
            "total_agents": len(available_agents),
            "unique_capabilities": sorted(list(all_capabilities)),
            "config_types": sorted(list(config_types)),
            "factory_stats": factory_stats,
            "endpoints": {
                "agents": "/v1/agents",
                "pipelines": "/v1/pipelines",
                "capabilities": "/v1/capabilities"
            },
            "features": [
                "Individual agent execution",
                "Full pipeline execution",
                "Asynchronous processing",
                "Real-time progress streaming",
                "Input validation",
                "Agent discovery and metadata",
                "Cross-application compatibility"
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get capabilities summary: {str(e)}"
        )

@router.get("/agents")
async def get_agent_capabilities():
    """
    Get capabilities for all individual agents.
    
    Returns a list of all agents with their specific capabilities.
    """
    try:
        available_agents = agent_factory.get_available_agents()
        
        agents_capabilities = []
        for agent_key, metadata in available_agents.items():
            agents_capabilities.append({
                "agent_key": agent_key,
                "name": metadata.name,
                "description": metadata.description,
                "capabilities": metadata.capabilities,
                "config_type": metadata.config_type.value,
                "version": metadata.version
            })
        
        return {
            "total_agents": len(agents_capabilities),
            "agents": agents_capabilities
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get agent capabilities: {str(e)}"
        )

@router.get("/pipelines")
async def get_pipeline_capabilities():
    """
    Get capabilities for pipeline execution.
    
    Returns information about available pipeline configurations and execution modes.
    """
    try:
        pipeline_info = agent_manager_v2.get_pipeline_info()
        
        capabilities = {
            "pipeline_execution": {
                "synchronous": True,
                "asynchronous": True,
                "streaming_progress": True,
                "real_time_updates": True
            },
            "supported_formats": {
                "input": ["string", "object", "json"],
                "output": ["json", "structured_data"]
            },
            "features": [
                "Multi-step execution",
                "Dependency management",
                "Error handling and recovery",
                "Progress tracking",
                "Result aggregation",
                "Event-driven architecture"
            ]
        }
        
        if pipeline_info:
            capabilities["current_pipeline"] = pipeline_info
        else:
            capabilities["current_pipeline"] = None
            capabilities["message"] = "No pipeline currently loaded"
        
        return capabilities
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get pipeline capabilities: {str(e)}"
        )

@router.get("/config-types")
async def get_config_types():
    """
    Get information about available configuration types.
    
    Returns details about different agent configuration types and their purposes.
    """
    try:
        available_agents = agent_factory.get_available_agents()
        
        config_type_info = {
            "standard": {
                "description": "Standard configuration for general-purpose agents",
                "use_cases": ["General text processing", "Basic analysis", "Standard operations"],
                "agents": []
            },
            "coding": {
                "description": "Optimized configuration for code-related tasks",
                "use_cases": ["Code generation", "Code analysis", "Programming tasks"],
                "agents": []
            },
            "review": {
                "description": "Configuration for review and analysis tasks",
                "use_cases": ["Code review", "Quality assessment", "Error detection"],
                "agents": []
            },
            "creative": {
                "description": "Configuration for creative and generative tasks",
                "use_cases": ["Creative writing", "Design generation", "Innovative solutions"],
                "agents": []
            }
        }
        
        # Categorize agents by config type
        for agent_key, metadata in available_agents.items():
            config_type = metadata.config_type.value
            if config_type in config_type_info:
                config_type_info[config_type]["agents"].append({
                    "agent_key": agent_key,
                    "name": metadata.name,
                    "description": metadata.description
                })
        
        return {
            "total_config_types": len(config_type_info),
            "config_types": config_type_info
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get config types: {str(e)}"
        )

@router.get("/health")
async def get_service_health():
    """
    Get health status of the agent service capabilities.
    
    Returns information about service health and component status.
    """
    try:
        factory_stats = agent_factory.get_factory_stats()
        available_agents = agent_factory.get_available_agents()
        pipeline_info = agent_manager_v2.get_pipeline_info()
        
        health_status = {
            "overall_status": "healthy",
            "components": {
                "agent_factory": {
                    "status": "healthy",
                    "registered_agents": factory_stats.get("registered_agents", 0),
                    "cached_instances": factory_stats.get("cached_instances", 0)
                },
                "agent_manager": {
                    "status": "healthy",
                    "pipeline_loaded": pipeline_info is not None
                },
                "available_agents": {
                    "status": "healthy",
                    "count": len(available_agents)
                }
            },
            "capabilities_ready": True,
            "timestamp": "2025-01-07T12:51:25-05:00"
        }
        
        # Check if any critical issues
        if factory_stats.get("registered_agents", 0) == 0:
            health_status["overall_status"] = "degraded"
            health_status["components"]["agent_factory"]["status"] = "warning"
            health_status["components"]["agent_factory"]["message"] = "No agents registered"
        
        return health_status
        
    except Exception as e:
        return {
            "overall_status": "unhealthy",
            "error": str(e),
            "capabilities_ready": False,
            "timestamp": "2025-01-07T12:51:25-05:00"
        }

@router.get("/openapi-schema")
async def get_openapi_schema():
    """
    Get OpenAPI schema information for the agent service.
    
    Returns schema information that can be used by other applications
    to understand and integrate with the agent service.
    """
    try:
        available_agents = agent_factory.get_available_agents()
        
        # Build basic schema information
        schema_info = {
            "openapi": "3.0.0",
            "info": {
                "title": "Agent Service API",
                "version": "1.0.0",
                "description": "Standalone service providing multi-agent capabilities"
            },
            "servers": [
                {"url": "http://localhost:8001", "description": "Local development server"}
            ],
            "paths": {
                "/v1/agents": {
                    "get": {
                        "summary": "List available agents",
                        "responses": {"200": {"description": "List of agents"}}
                    }
                },
                "/v1/pipelines/execute": {
                    "post": {
                        "summary": "Execute pipeline",
                        "responses": {"200": {"description": "Pipeline execution result"}}
                    }
                },
                "/v1/capabilities": {
                    "get": {
                        "summary": "Get service capabilities",
                        "responses": {"200": {"description": "Service capabilities"}}
                    }
                }
            },
            "components": {
                "schemas": {
                    "AgentMetadata": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "description": {"type": "string"},
                            "capabilities": {"type": "array", "items": {"type": "string"}},
                            "config_type": {"type": "string"},
                            "version": {"type": "string"}
                        }
                    }
                }
            }
        }
        
        # Add agent-specific endpoints
        for agent_key in available_agents.keys():
            schema_info["paths"][f"/v1/agents/{agent_key}/execute"] = {
                "post": {
                    "summary": f"Execute {agent_key} agent",
                    "responses": {"200": {"description": "Agent execution result"}}
                }
            }
        
        return schema_info
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get OpenAPI schema: {str(e)}"
        )

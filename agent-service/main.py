"""
Standalone Agent Service - FastAPI backend for multi-agent framework.
This service provides agents as reusable components that can be consumed by multiple applications.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
from datetime import datetime
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional
import asyncio

from api.routes import agents, pipelines, capabilities
from core.utils import setup_logging

# Setup logging
logger = setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Starting Agent Service")
    yield
    logger.info("Shutting down Agent Service")

# Create FastAPI app
app = FastAPI(
    title="Agent Service API",
    description="Standalone service providing multi-agent capabilities for code generation and analysis",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware - Allow all origins for maximum shareability
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for cross-application usage
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers with v1 prefix (new API)
app.include_router(agents.router, prefix="/v1/agents", tags=["agents"])
app.include_router(pipelines.router, prefix="/v1/pipelines", tags=["pipelines"])
app.include_router(capabilities.router, prefix="/v1/capabilities", tags=["capabilities"])

# Include routers without prefix for backward compatibility
app.include_router(agents.router, prefix="/agents", tags=["agents-legacy"])
app.include_router(pipelines.router, prefix="/pipelines", tags=["pipelines-legacy"])
app.include_router(capabilities.router, prefix="/capabilities", tags=["capabilities-legacy"])

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Agent Service",
        "version": "1.0.0",
        "description": "Standalone multi-agent service for code generation and analysis",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "agents": "/v1/agents",
            "pipelines": "/v1/pipelines", 
            "capabilities": "/v1/capabilities"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint with service validation."""
    try:
        import psutil
        import os
        from core.agent_manager_v2 import agent_manager_v2
        from core.agent_factory import agent_factory
        
        # Get system resource information
        memory_info = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=0.1)
        disk_usage = psutil.disk_usage('/')
        
        # Test agent services
        services_status = {}
        overall_healthy = True
        
        # Check agent factory
        try:
            factory_stats = agent_factory.get_factory_stats()
            available_agents = agent_factory.get_available_agents()
            services_status["agent_factory"] = {
                "status": "healthy",
                "registered_agents": factory_stats.get("registered_agents", 0),
                "available_agents": len(available_agents)
            }
        except Exception as e:
            services_status["agent_factory"] = {"status": f"error: {str(e)}"}
            overall_healthy = False
        
        # Check agent manager
        try:
            pipeline_info = agent_manager_v2.get_pipeline_info()
            active_agents = agent_manager_v2.get_active_agents()
            services_status["agent_manager"] = {
                "status": "healthy",
                "pipeline_loaded": pipeline_info is not None,
                "active_agents": len(active_agents)
            }
        except Exception as e:
            services_status["agent_manager"] = {"status": f"error: {str(e)}"}
            overall_healthy = False
        
        # Resource health checks
        resource_warnings = []
        if memory_info.percent > 85:
            resource_warnings.append(f"High memory usage: {memory_info.percent:.1f}%")
            if memory_info.percent > 95:
                overall_healthy = False
        
        if cpu_percent > 90:
            resource_warnings.append(f"High CPU usage: {cpu_percent:.1f}%")
            if cpu_percent > 98:
                overall_healthy = False
        
        if disk_usage.percent > 90:
            resource_warnings.append(f"High disk usage: {disk_usage.percent:.1f}%")
            if disk_usage.percent > 98:
                overall_healthy = False
        
        return {
            "status": "healthy" if overall_healthy else "degraded",
            "service": "agent-service",
            "services": services_status,
            "resources": {
                "memory": {
                    "total_gb": round(memory_info.total / (1024**3), 2),
                    "available_gb": round(memory_info.available / (1024**3), 2),
                    "used_percent": memory_info.percent
                },
                "cpu": {
                    "usage_percent": cpu_percent,
                    "count": psutil.cpu_count()
                },
                "disk": {
                    "total_gb": round(disk_usage.total / (1024**3), 2),
                    "free_gb": round(disk_usage.free / (1024**3), 2),
                    "used_percent": disk_usage.percent
                },
                "process": {
                    "pid": os.getpid(),
                    "memory_mb": round(psutil.Process().memory_info().rss / (1024**2), 2)
                }
            },
            "warnings": resource_warnings,
            "timestamp": datetime.now().isoformat(),
            "ready": overall_healthy
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "service": "agent-service",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
            "ready": False
        }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "service": "agent-service"}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,  # Different port from main backend
        reload=True,
        log_level="info"
    )

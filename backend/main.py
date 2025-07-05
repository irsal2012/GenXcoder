"""
FastAPI backend server for Project Management.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
from datetime import datetime
from contextlib import asynccontextmanager

from api.routes import projects
from api.dependencies import get_project_service, get_file_storage_service

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Starting Project Management Backend")
    yield
    logger.info("Shutting down Project Management Backend")

# Create FastAPI app
app = FastAPI(
    title="Project Management API",
    description="Backend API for Project Management and File Storage",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8501", 
        "http://127.0.0.1:8501",
        "http://localhost:3000",  # React dev server
        "http://127.0.0.1:3000",
        "http://0.0.0.0:8501",    # Docker/container access
        "*"  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],
    expose_headers=["*"],
)

# Include routers
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Project Management Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Enhanced health check endpoint with service validation and resource monitoring."""
    try:
        import psutil
        import os
        
        # Get system resource information
        memory_info = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=0.1)
        disk_usage = psutil.disk_usage('/')
        
        # Test service initialization
        services_status = {}
        overall_healthy = True
        
        # Check project service
        try:
            project_service = get_project_service()
            # Test basic functionality
            test_stats = await project_service.get_statistics()
            services_status["project_service"] = "healthy"
        except Exception as e:
            services_status["project_service"] = f"error: {str(e)}"
            overall_healthy = False
        
        # Check file storage service
        try:
            file_storage_service = get_file_storage_service()
            # Test basic functionality
            storage_stats = file_storage_service.get_storage_stats()
            services_status["file_storage_service"] = "healthy"
        except Exception as e:
            services_status["file_storage_service"] = f"error: {str(e)}"
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
            "service": "project-management-backend",
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
            "service": "project-management-backend",
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
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

"""
Pydantic models for API requests.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class GenerateCodeRequest(BaseModel):
    """Request model for code generation."""
    user_input: str = Field(..., description="Natural language description of the software to build", min_length=10)
    project_name: Optional[str] = Field(None, description="Optional project name (auto-generated if not provided)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_input": "Create a web scraper that extracts product information from e-commerce websites, stores the data in a database, and provides a REST API to query the results.",
                "project_name": "web-scraper-api"
            }
        }

class ValidateInputRequest(BaseModel):
    """Request model for input validation."""
    user_input: str = Field(..., description="User input to validate")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_input": "Build a chatbot for customer service"
            }
        }

class ProjectQueryRequest(BaseModel):
    """Request model for project queries."""
    limit: Optional[int] = Field(10, description="Number of projects to return", ge=1, le=100)
    offset: Optional[int] = Field(0, description="Number of projects to skip", ge=0)
    filter_success: Optional[bool] = Field(None, description="Filter by success status")
    
    class Config:
        json_schema_extra = {
            "example": {
                "limit": 10,
                "offset": 0,
                "filter_success": True
            }
        }

class AgentExecutionRequest(BaseModel):
    """Request model for individual agent execution."""
    input_data: Any = Field(..., description="Input data for the agent")
    config: Optional[Dict[str, Any]] = Field(None, description="Optional configuration overrides for the agent")
    context: Optional[Dict[str, Any]] = Field(None, description="Optional context data for the agent")
    async_execution: bool = Field(False, description="Whether to execute the agent asynchronously")
    
    class Config:
        json_schema_extra = {
            "example": {
                "input_data": "Create a Python function that calculates fibonacci numbers",
                "config": {"temperature": 0.7, "max_tokens": 1000},
                "context": {"project_type": "python", "style": "functional"},
                "async_execution": False
            }
        }

class PipelineExecutionRequest(BaseModel):
    """Request model for pipeline execution."""
    input_data: Any = Field(..., description="Input data for the pipeline")
    pipeline_name: Optional[str] = Field("default", description="Name of the pipeline configuration to use")
    config: Optional[Dict[str, Any]] = Field(None, description="Optional configuration overrides")
    correlation_id: Optional[str] = Field(None, description="Optional correlation ID for tracking")
    async_execution: bool = Field(False, description="Whether to execute the pipeline asynchronously")
    
    class Config:
        json_schema_extra = {
            "example": {
                "input_data": "Build a web application for task management with user authentication",
                "pipeline_name": "default",
                "config": {"timeout": 300},
                "correlation_id": "task-123",
                "async_execution": True
            }
        }

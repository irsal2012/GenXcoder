# Agent Service Startup Scripts

This document explains how to use the agent service startup scripts to run the GenXcode Agent Service.

## Overview

The Agent Service is a standalone FastAPI service that provides multi-agent capabilities for code generation and analysis. It runs on port 8001 (separate from the main backend on port 8000) and provides REST API endpoints for agent management, pipeline execution, and service capabilities.

## Available Scripts

### 1. Python Script: `start_agent_service.py`

A comprehensive Python script with full error handling, dependency management, and health checking.

**Usage:**
```bash
python3 start_agent_service.py
```

**Features:**
- ✅ Automatic dependency installation
- ✅ Environment validation (.env file check)
- ✅ Health check with timeout
- ✅ Colored terminal output
- ✅ Graceful shutdown handling
- ✅ Detailed service information display

### 2. Shell Script: `start_agent_service.sh`

A lightweight bash script for Unix/Linux/macOS systems.

**Usage:**
```bash
./start_agent_service.sh
```

**Features:**
- ✅ Port availability checking
- ✅ Dependency validation
- ✅ Colored terminal output
- ✅ Signal handling for clean shutdown
- ✅ Service health monitoring

## Prerequisites

### System Requirements
- Python 3.8 or higher
- pip (Python package manager)
- curl (for health checks in shell script)
- lsof (for port checking in shell script)

### Environment Setup
1. Ensure you have a `.env` file in the project root with required environment variables
2. Make sure you're running the script from the project root directory
3. Ensure port 8001 is available

## Service Information

Once started, the Agent Service provides:

- **Main URL:** http://localhost:8001
- **API Documentation:** http://localhost:8001/docs
- **Health Check:** http://localhost:8001/health
- **OpenAPI Spec:** http://localhost:8001/openapi.json

### Available Endpoints

| Endpoint | Description |
|----------|-------------|
| `/v1/agents` | Agent management and execution |
| `/v1/pipelines` | Pipeline configuration and execution |
| `/v1/capabilities` | Service capabilities and agent information |

## Troubleshooting

### Common Issues

1. **Port 8001 already in use**
   ```bash
   # Find what's using the port
   lsof -i :8001
   
   # Kill the process if needed
   kill -9 <PID>
   ```

2. **Missing dependencies**
   ```bash
   # Install manually if auto-install fails
   cd agent-service
   pip install -r requirements.txt
   ```

3. **Permission denied (shell script)**
   ```bash
   # Make the script executable
   chmod +x start_agent_service.sh
   ```

4. **Environment variables not found**
   - Ensure `.env` file exists in project root
   - Check that required variables are set (OPENAI_API_KEY, etc.)

### Health Check Failures

If the health check fails, check:
- Service logs for startup errors
- Network connectivity
- Required environment variables
- Dependencies installation

## Integration with Other Services

The Agent Service is designed to work alongside:
- **Backend API** (port 8000) - Main application backend
- **Frontend** (port 5173) - React application
- **MCP Gateway** - Model Context Protocol gateway

Use `start_all_services.py` to start all services together, or start them individually as needed.

## Development

### Running in Development Mode

Both scripts start the service in development mode with:
- Auto-reload enabled
- Debug logging
- CORS enabled for all origins

### Manual Startup

If you prefer to start manually:
```bash
cd agent-service
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

## Production Deployment

For production deployment, consider:
- Using a process manager (PM2, systemd, etc.)
- Setting up proper logging
- Configuring reverse proxy (nginx)
- Using environment-specific configuration
- Disabling auto-reload and debug features

## Support

If you encounter issues:
1. Check the service logs for error messages
2. Verify all prerequisites are installed
3. Ensure environment variables are properly configured
4. Check that no other service is using port 8001

For more information, refer to the main project documentation or the API documentation at `/docs` endpoint.

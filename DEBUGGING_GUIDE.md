# Pipeline Execution Debugging Guide

## Overview

We've added comprehensive logging to identify where the pipeline execution process might be getting stuck. This guide explains how to use the debugging tools and interpret the logs.

## Debugging Tools Created

### 1. Enhanced Frontend Logging (`frontend/src/services/api.ts`)
- **Step-by-step timing**: Logs initialization and execution times
- **Detailed error information**: Captures error codes, status, and response data
- **Request tracking**: Monitors each API call with timestamps

### 2. Pipeline Route Logging (`agent-service/api/routes/pipelines.py`)
- **Request processing**: Logs incoming requests and their details
- **Pipeline initialization**: Tracks initialization time and success
- **Background task management**: Monitors async execution startup
- **Execution store updates**: Tracks status changes and progress

### 3. Agent Manager Logging (`agent-service/core/agent_manager_v2.py`)
- **Pipeline execution flow**: Detailed step-by-step execution tracking
- **Step group processing**: Monitors parallel and sequential execution
- **Agent interactions**: Logs individual agent execution
- **Progress updates**: Tracks overall pipeline progress

### 4. Debug Script (`debug_pipeline_execution.py`)
- **Comprehensive testing**: Tests all components individually
- **Real-time monitoring**: Polls execution status with detailed output
- **Stuck detection**: Identifies when execution appears frozen
- **Component isolation**: Tests agents, capabilities, and configurations separately

## How to Debug a Stuck Process

### Step 1: Run the Debug Script
```bash
python debug_pipeline_execution.py
```

This will:
- Test service health
- Check agent discovery
- Test pipeline initialization
- Monitor execution progress
- Detect if the process gets stuck

### Step 2: Check the Logs

#### Frontend Logs (Browser Console)
Look for these log patterns:
```
🚀 [API] Starting code generation process...
📋 [API] Step 1: Initializing pipeline...
✅ [API] Pipeline initialized successfully in XXXms
🔄 [API] Step 2: Starting async pipeline execution...
✅ [API] Pipeline execution started successfully in XXXms
```

#### Agent Service Logs
Look for these log patterns:
```
🚀 [PIPELINE] Starting pipeline execution request at...
🔧 [PIPELINE] Initializing pipeline: iterative_development
✅ [PIPELINE] Pipeline initialized successfully in X.XXs
🔄 [PIPELINE] Starting async execution for: execution-id
🔄 [BACKGROUND] Starting background pipeline execution for execution-id
⚡ [BACKGROUND] Calling agent_manager_v2.execute_pipeline for execution-id
🚀 [AGENT_MANAGER] Starting pipeline execution at...
📊 [AGENT_MANAGER] Execution order: [['step1'], ['step2'], ...]
🔄 [AGENT_MANAGER] Executing step group 1/X: ['step_name']
```

### Step 3: Identify Where It's Stuck

#### Common Stuck Points:

1. **Pipeline Initialization**
   - Look for: `🔧 [PIPELINE] Initializing pipeline`
   - If stuck here: Check agent discovery and pipeline configuration

2. **Background Task Startup**
   - Look for: `🔄 [BACKGROUND] Starting background pipeline execution`
   - If stuck here: Check FastAPI background task system

3. **Agent Manager Execution**
   - Look for: `🚀 [AGENT_MANAGER] Starting pipeline execution`
   - If stuck here: Check agent manager initialization

4. **Step Group Execution**
   - Look for: `🔄 [AGENT_MANAGER] Executing step group X/Y`
   - If stuck here: Check individual agent execution

5. **Individual Agent Processing**
   - Look for: `Executing step: step_name`
   - If stuck here: Check specific agent implementation

### Step 4: Analyze Specific Issues

#### If Stuck at Pipeline Initialization:
```bash
# Check if agents are discoverable
curl http://localhost:8001/v1/agents/

# Check pipeline configurations
curl http://localhost:8001/v1/pipelines/
```

#### If Stuck at Agent Execution:
- Check the specific agent that's running
- Look for AI model connectivity issues
- Check for missing dependencies or configuration

#### If Stuck at Background Task:
- Check FastAPI logs for background task errors
- Verify async/await patterns are working correctly

## Log File Locations

1. **Debug Script Log**: `debug_pipeline.log`
2. **Agent Service Logs**: Check your agent service startup logs
3. **Frontend Logs**: Browser Developer Console
4. **Backend Logs**: Check your backend service logs

## Quick Diagnostic Commands

### Check Service Health
```bash
# Agent Service
curl http://localhost:8001/health

# Backend Service  
curl http://localhost:8000/health
```

### Check Agent Discovery
```bash
curl http://localhost:8001/v1/agents/
```

### Check Pipeline Status
```bash
curl http://localhost:8001/v1/pipelines/
```

### Monitor Execution
```bash
# Replace EXECUTION_ID with actual ID
curl http://localhost:8001/v1/pipelines/execution/EXECUTION_ID/status
```

## Common Issues and Solutions

### 1. Agent Service Not Responding
**Symptoms**: Timeout errors, connection refused
**Solution**: 
- Check if agent service is running on port 8001
- Verify no firewall blocking
- Check agent service startup logs

### 2. Pipeline Configuration Missing
**Symptoms**: "Failed to initialize pipeline" errors
**Solution**:
- Check `agent-service/config/pipelines/iterative_development.yaml` exists
- Verify pipeline configuration is valid

### 3. Agent Discovery Failures
**Symptoms**: "No agents found" or agent initialization errors
**Solution**:
- Check agent files in `agent-service/agents/` directory
- Verify agent dependencies are installed
- Check agent factory initialization

### 4. AI Model Connectivity Issues
**Symptoms**: Stuck at specific agent execution
**Solution**:
- Check AI model API keys and configuration
- Verify network connectivity to AI services
- Check rate limiting or quota issues

### 5. Background Task Not Starting
**Symptoms**: Execution starts but never progresses
**Solution**:
- Check FastAPI background task system
- Verify async/await patterns
- Check for unhandled exceptions in background task

## Monitoring Real-Time Progress

Use the debug script to monitor execution in real-time:

```bash
python debug_pipeline_execution.py
```

The script will:
- Show step-by-step progress
- Detect when execution gets stuck
- Provide detailed status information
- Suggest next debugging steps

## Getting Help

If the process is still stuck after following this guide:

1. **Collect Logs**: Gather all relevant log files
2. **Note Timing**: Record exactly where the process stops
3. **Check Resources**: Monitor CPU, memory, and network usage
4. **Test Components**: Use the debug script to isolate the issue
5. **Review Configuration**: Verify all configuration files are correct

The comprehensive logging should help identify the exact point where execution stops and provide clues about the underlying issue.

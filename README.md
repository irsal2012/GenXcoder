# Multi-Agent Framework with MCP Gateway

A microservice architecture that provides multi-agent capabilities through both REST API and MCP (Model Context Protocol) interfaces, enabling AI tools like Claude to discover and use agent capabilities seamlessly.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Application   │    │      MCP        │
│       A         │    │       B         │    │    Client       │
│   (Your Web)    │    │  (External)     │    │  (Claude/etc)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ REST API              │ REST API              │ MCP Protocol
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                            │
│  ┌─────────────────┐              ┌─────────────────┐          │
│  │   FastAPI       │              │   MCP Server    │          │
│  │   Gateway       │◄────────────►│   Gateway       │          │
│  │                 │              │                 │          │
│  └─────────────────┘              └─────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Agent Service Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Agent     │  │   Agent     │  │   Agent     │            │
│  │  Service A  │  │  Service B  │  │  Service C  │            │
│  │             │  │             │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Components

### 1. Agent Service (Port 8001)
Standalone FastAPI service providing multi-agent capabilities:
- **Individual Agent Execution**: Run specific agents (Python coder, code reviewer, etc.)
- **Pipeline Execution**: Run complete multi-agent workflows
- **Asynchronous Processing**: Background execution with progress tracking
- **Real-time Monitoring**: WebSocket support for live updates
- **Cross-Application Compatibility**: REST API accessible by any application

### 2. MCP Gateway
TypeScript-based MCP server that translates MCP protocol to Agent Service calls:
- **MCP Tools**: Execute agents and pipelines through MCP protocol
- **MCP Resources**: Access agent metadata and execution status
- **Auto-Discovery**: Automatically discovers available agents
- **Error Handling**: Robust error handling and connection management

### 3. Original Backend (Port 8000) - Optional
Your existing FastAPI backend, now acting as a client to the Agent Service.

### 4. Frontend (Port 3000) - Optional
React frontend that can consume both the original backend and Agent Service directly.

## 🛠️ Available Agents

The system includes several specialized agents:

- **Python Coder**: Generates Python code from natural language descriptions
- **Code Reviewer**: Reviews and improves existing code
- **Documentation Writer**: Creates comprehensive documentation
- **Test Generator**: Generates unit tests for code
- **Deployment Engineer**: Creates deployment configurations
- **UI Designer**: Generates user interfaces (Streamlit apps)
- **Requirement Analyst**: Analyzes and structures project requirements

## 📋 Prerequisites

- **Docker & Docker Compose**: For containerized deployment
- **Python 3.11+**: For local development
- **Node.js 18+**: For MCP gateway development
- **MCP-compatible client**: Like Claude Desktop or Cline

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone and navigate to the project**:
   ```bash
   git clone <your-repo>
   cd GenXcode
   ```

2. **Start all services**:
   ```bash
   docker-compose up -d
   ```

3. **Verify services are running**:
   ```bash
   # Check Agent Service
   curl http://localhost:8001/health
   
   # Check available agents
   curl http://localhost:8001/v1/agents
   
   # Check capabilities
   curl http://localhost:8001/v1/capabilities
   ```

### Option 2: Local Development

1. **Start Agent Service**:
   ```bash
   cd agent-service
   pip install -r requirements.txt
   python main.py
   ```

2. **Build and test MCP Gateway**:
   ```bash
   cd mcp-gateway
   npm install
   npm run build
   npm run dev
   ```

## 🔧 MCP Integration

### Install MCP Server

Add the MCP server to your MCP settings file:

**For Cline** (`~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`):
```json
{
  "mcpServers": {
    "agents": {
      "command": "node",
      "args": ["/path/to/GenXcode/mcp-gateway/build/index.js"],
      "env": {
        "AGENT_SERVICE_URL": "http://localhost:8001"
      }
    }
  }
}
```

**For Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "agents": {
      "command": "node",
      "args": ["/path/to/GenXcode/mcp-gateway/build/index.js"],
      "env": {
        "AGENT_SERVICE_URL": "http://localhost:8001"
      }
    }
  }
}
```

### Available MCP Tools

Once configured, you'll have access to these MCP tools:

- **`execute_agent`**: Run individual agents
- **`execute_pipeline`**: Run complete multi-agent pipeline
- **`get_agent_capabilities`**: Discover available agents and features
- **`get_execution_status`**: Check agent execution status
- **`get_pipeline_status`**: Check pipeline execution status
- **`validate_input`**: Validate input for agents

### Available MCP Resources

- **`agent://capabilities`**: Service capabilities
- **`agent://health`**: Service health status
- **`agent://{agent_name}/metadata`**: Agent metadata
- **`execution://{execution_id}/status`**: Execution status
- **`pipeline://{execution_id}/progress`**: Pipeline progress

## 💡 Usage Examples

### Using MCP Tools (in Claude/Cline)

1. **Discover available agents**:
   ```
   Use the get_agent_capabilities tool to see what agents are available
   ```

2. **Execute a single agent**:
   ```
   Use execute_agent with:
   - agent_name: "python_coder"
   - input_data: "Create a function to calculate fibonacci numbers"
   ```

3. **Execute complete pipeline**:
   ```
   Use execute_pipeline with:
   - input_data: "Build a web scraper for e-commerce product data"
   - async_execution: true
   ```

4. **Check execution status**:
   ```
   Use get_pipeline_status with the execution_id from the previous call
   ```

### Using REST API

1. **List available agents**:
   ```bash
   curl http://localhost:8001/v1/agents
   ```

2. **Execute an agent**:
   ```bash
   curl -X POST http://localhost:8001/v1/agents/python_coder/execute \
     -H "Content-Type: application/json" \
     -d '{
       "input_data": "Create a function to calculate fibonacci numbers",
       "async_execution": false
     }'
   ```

3. **Execute a pipeline**:
   ```bash
   curl -X POST http://localhost:8001/v1/pipelines/execute \
     -H "Content-Type: application/json" \
     -d '{
       "input_data": "Build a web scraper for e-commerce product data",
       "async_execution": true
     }'
   ```

4. **Check pipeline status**:
   ```bash
   curl http://localhost:8001/v1/pipelines/execution/{execution_id}/status
   ```

## 🔍 Monitoring & Health Checks

### Service Health
```bash
# Agent Service health
curl http://localhost:8001/health

# Original backend health (if running)
curl http://localhost:8000/health
```

### Real-time Progress Monitoring
```bash
# Stream pipeline progress (Server-Sent Events)
curl http://localhost:8001/v1/pipelines/execution/{execution_id}/stream
```

### Docker Compose Monitoring
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs agent-service
docker-compose logs mcp-gateway

# Follow logs in real-time
docker-compose logs -f agent-service
```

## 🛠️ Development

### Agent Service Development

1. **Add new agents**: Create new agent classes in `agent-service/agents/`
2. **Modify API routes**: Update routes in `agent-service/api/routes/`
3. **Test locally**:
   ```bash
   cd agent-service
   python main.py
   ```

### MCP Gateway Development

1. **Add new tools**: Create new tool files in `mcp-gateway/src/tools/`
2. **Add new resources**: Update resource handlers in `mcp-gateway/src/index.ts`
3. **Test locally**:
   ```bash
   cd mcp-gateway
   npm run dev
   ```

### Building and Testing

```bash
# Build MCP Gateway
cd mcp-gateway && npm run build

# Test Agent Service
cd agent-service && python -m pytest

# Build Docker images
docker-compose build

# Run specific services
docker-compose up agent-service
docker-compose up mcp-gateway
```

## 🔧 Configuration

### Environment Variables

**Agent Service**:
- `PORT`: Service port (default: 8001)
- `HOST`: Service host (default: 0.0.0.0)
- `PYTHONPATH`: Python path for imports

**MCP Gateway**:
- `AGENT_SERVICE_URL`: URL of the Agent Service (default: http://localhost:8001)
- `NODE_ENV`: Node environment (development/production)

### Pipeline Configuration

Modify pipeline configurations in `agent-service/config/pipelines/default.yaml` to customize agent execution order and dependencies.

## 🚨 Troubleshooting

### Common Issues

1. **MCP Gateway can't connect to Agent Service**:
   - Ensure Agent Service is running on port 8001
   - Check `AGENT_SERVICE_URL` environment variable
   - Verify network connectivity

2. **Agents not discovered**:
   - Check agent registration in `agent-service/agents/`
   - Verify agent factory auto-discovery
   - Check logs for import errors

3. **Pipeline execution fails**:
   - Check pipeline configuration
   - Verify agent dependencies
   - Review execution logs

### Debugging

```bash
# Check service logs
docker-compose logs agent-service
docker-compose logs mcp-gateway

# Test MCP Gateway connection
cd mcp-gateway && npm run dev

# Test Agent Service directly
curl -v http://localhost:8001/health
```

## 📚 API Documentation

Once the Agent Service is running, visit:
- **OpenAPI Documentation**: http://localhost:8001/docs
- **Alternative Documentation**: http://localhost:8001/redoc

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with FastAPI, TypeScript, and the Model Context Protocol
- Inspired by microservice architecture patterns
- Designed for maximum shareability and interoperability

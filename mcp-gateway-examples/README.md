# MCP Gateway Connection Examples

This directory contains practical examples of how to connect to and use the GenXcoder MCP Gateway.

## 🔧 Configuration Examples

### 1. Claude Desktop Configuration

File: `claude-desktop-config.json`

Add this to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "genxcoder-agents": {
      "command": "node",
      "args": ["/Users/iimran/Desktop/Genexsus/GenXcoder/mcp-gateway/build/index.js"],
      "env": {
        "AGENT_SERVICE_URL": "http://localhost:8001"
      }
    }
  }
}
```

**Location of config file:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### 2. Cline MCP Configuration

In Cline, you can add the MCP server through the settings:

```json
{
  "name": "genxcoder-agents",
  "command": "node",
  "args": ["/Users/iimran/Desktop/Genexsus/GenXcoder/mcp-gateway/build/index.js"],
  "env": {
    "AGENT_SERVICE_URL": "http://localhost:8001"
  }
}
```

## 🚀 Running the Examples

### Prerequisites

1. **Build the MCP Gateway:**
   ```bash
   cd mcp-gateway
   npm install
   npm run build
   ```

2. **Start the Agent Service:**
   ```bash
   # From the root directory
   python3 start_all_services.py
   ```

### Test the Connection

Run the test client to verify everything works:

```bash
cd mcp-gateway-examples
node test-mcp-client.js
```

## 📋 Available Tools

Once connected, you can use these tools:

### 1. `execute_agent`
Execute a specific agent with input data.

**Example usage in Claude/Cline:**
```
"Use the execute_agent tool to run the python_coder agent with input: 'Create a function that calculates fibonacci numbers'"
```

**Parameters:**
- `agent_name`: Name of the agent (e.g., "python_coder", "code_reviewer")
- `input_data`: Natural language description or instructions
- `config`: Optional configuration (temperature, max_tokens, etc.)
- `context`: Optional context data
- `async_execution`: Whether to run asynchronously

### 2. `execute_pipeline`
Run a complete multi-agent workflow.

**Example usage:**
```
"Use the execute_pipeline tool to create a complete Python web application with input: 'Build a simple todo app with FastAPI'"
```

**Parameters:**
- `input_data`: Project description
- `pipeline_name`: Pipeline to use (default: "default")
- `config`: Optional configuration
- `correlation_id`: Optional tracking ID
- `async_execution`: Whether to run asynchronously

### 3. `get_agent_capabilities`
Discover available agents and their capabilities.

**Example usage:**
```
"Use the get_agent_capabilities tool to see what agents are available"
```

### 4. `get_execution_status`
Check the status of an agent execution.

**Parameters:**
- `execution_id`: ID returned from execute_agent or execute_pipeline

### 5. `get_pipeline_status`
Check the status of a pipeline execution.

**Parameters:**
- `execution_id`: ID returned from execute_pipeline

### 6. `validate_input`
Validate input data for a specific agent.

**Parameters:**
- `agent_name`: Name of the agent
- `input_data`: Data to validate

## 📚 Available Resources

### Static Resources
- `agent://capabilities` - Complete service capabilities
- `agent://health` - Service health status

### Dynamic Resources
- `agent://{agent_name}/metadata` - Metadata for specific agent
- `execution://{execution_id}/status` - Execution status
- `pipeline://{execution_id}/progress` - Pipeline progress

## 🎯 Usage Examples

### Example 1: Generate Python Code
```
"Use the execute_agent tool with agent_name 'python_coder' and input_data 'Create a class for managing a simple inventory system with add, remove, and search methods'"
```

### Example 2: Review Code
```
"Use the execute_agent tool with agent_name 'code_reviewer' and input_data 'Review this Python code for best practices and potential issues: [paste your code here]'"
```

### Example 3: Create Documentation
```
"Use the execute_agent tool with agent_name 'documentation_writer' and input_data 'Create comprehensive documentation for a REST API that manages user accounts'"
```

### Example 4: Full Project Pipeline
```
"Use the execute_pipeline tool with input_data 'Create a complete web application for managing a book library with user authentication, book CRUD operations, and search functionality'"
```

## 🔍 Troubleshooting

### Common Issues

1. **"Cannot connect to Agent Service"**
   - Make sure the agent service is running on port 8001
   - Check that all dependencies are installed
   - Verify the AGENT_SERVICE_URL environment variable

2. **"MCP server not found"**
   - Ensure the path to the MCP Gateway build file is correct
   - Make sure you've run `npm run build` in the mcp-gateway directory

3. **"Tool execution failed"**
   - Check that the agent service is healthy
   - Verify the agent name is correct (use get_agent_capabilities to list available agents)
   - Check the agent service logs for detailed error information

### Debug Mode

To see detailed logs from the MCP Gateway, you can run it directly:

```bash
cd mcp-gateway
npm start
```

This will show all the startup logs and connection attempts.

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **MCP Gateway startup logs:**
   ```
   🚀 Starting Agent MCP Gateway...
   ✅ Connected to Agent Service at http://localhost:8001
   📊 Found X available agents
   🎯 Agent MCP Gateway running on stdio
   ```

2. **Available tools and resources listed**

3. **Successful tool executions with agent responses**

The MCP Gateway provides a seamless bridge between AI assistants and your GenXcoder multi-agent framework!

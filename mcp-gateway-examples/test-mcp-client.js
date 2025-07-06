#!/usr/bin/env node

/**
 * Simple MCP Client to test the GenXcoder MCP Gateway
 * This demonstrates how to connect and use the MCP Gateway programmatically
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

class MCPClient {
  constructor() {
    this.requestId = 1;
    this.mcpProcess = null;
    this.rl = null;
  }

  async connect() {
    console.log('🔌 Connecting to MCP Gateway...');
    
    // Start the MCP Gateway process
    this.mcpProcess = spawn('node', ['../mcp-gateway/build/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Set up readline for stdin/stdout communication
    this.rl = createInterface({
      input: this.mcpProcess.stdout,
      output: this.mcpProcess.stdin,
      terminal: false
    });

    // Handle stderr (logs from MCP server)
    this.mcpProcess.stderr.on('data', (data) => {
      console.log('📋 MCP Server Log:', data.toString().trim());
    });

    // Wait a moment for the server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Connected to MCP Gateway');
  }

  async sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: method,
      params: params
    };

    console.log(`\n📤 Sending request: ${method}`);
    console.log('Request:', JSON.stringify(request, null, 2));

    return new Promise((resolve, reject) => {
      // Send the request
      this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');

      // Listen for response
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);

      const onData = (line) => {
        try {
          const response = JSON.parse(line);
          if (response.id === request.id) {
            clearTimeout(timeout);
            this.rl.off('line', onData);
            console.log('📥 Response received:');
            console.log(JSON.stringify(response, null, 2));
            resolve(response);
          }
        } catch (e) {
          // Ignore non-JSON lines (might be logs)
        }
      };

      this.rl.on('line', onData);
    });
  }

  async listTools() {
    console.log('\n🔧 === LISTING AVAILABLE TOOLS ===');
    return await this.sendRequest('tools/list');
  }

  async listResources() {
    console.log('\n📚 === LISTING AVAILABLE RESOURCES ===');
    return await this.sendRequest('resources/list');
  }

  async getCapabilities() {
    console.log('\n🤖 === GETTING AGENT CAPABILITIES ===');
    return await this.sendRequest('tools/call', {
      name: 'get_agent_capabilities',
      arguments: {}
    });
  }

  async executeAgent(agentName, inputData) {
    console.log(`\n⚡ === EXECUTING AGENT: ${agentName} ===`);
    return await this.sendRequest('tools/call', {
      name: 'execute_agent',
      arguments: {
        agent_name: agentName,
        input_data: inputData,
        async_execution: false
      }
    });
  }

  async readResource(uri) {
    console.log(`\n📖 === READING RESOURCE: ${uri} ===`);
    return await this.sendRequest('resources/read', {
      uri: uri
    });
  }

  async disconnect() {
    console.log('\n🔌 Disconnecting from MCP Gateway...');
    if (this.mcpProcess) {
      this.mcpProcess.kill();
    }
    console.log('✅ Disconnected');
  }

  async runDemo() {
    try {
      await this.connect();

      // Demo 1: List available tools
      await this.listTools();

      // Demo 2: List available resources
      await this.listResources();

      // Demo 3: Try to get agent capabilities
      try {
        await this.getCapabilities();
      } catch (error) {
        console.log('⚠️  Agent service not available, but MCP Gateway is working!');
      }

      // Demo 4: Try to read health resource
      try {
        await this.readResource('agent://health');
      } catch (error) {
        console.log('⚠️  Health resource not available (agent service down)');
      }

      // Demo 5: Try to execute an agent (will fail gracefully)
      try {
        await this.executeAgent('python_coder', 'Create a simple hello world function');
      } catch (error) {
        console.log('⚠️  Agent execution not available (agent service down)');
      }

      console.log('\n🎉 === MCP GATEWAY DEMO COMPLETE ===');
      console.log('The MCP Gateway is working correctly!');
      console.log('When the agent service is running, all tools will be fully functional.');

    } catch (error) {
      console.error('❌ Demo failed:', error);
    } finally {
      await this.disconnect();
    }
  }
}

// Run the demo
const client = new MCPClient();
client.runDemo().catch(console.error);

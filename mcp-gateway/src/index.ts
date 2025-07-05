#!/usr/bin/env node

/**
 * MCP Gateway Server for Agent Service
 * 
 * This server provides MCP protocol access to the multi-agent framework,
 * allowing AI tools like Claude to discover and use agent capabilities
 * through standardized MCP tools and resources.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import tools
import { executeAgentTool, handleExecuteAgent } from './tools/execute-agent.js';
import { executePipelineTool, handleExecutePipeline } from './tools/execute-pipeline.js';
import { getCapabilitiesTool, handleGetCapabilities } from './tools/get-capabilities.js';
import { 
  getExecutionStatusTool, 
  getPipelineStatusTool, 
  validateInputTool,
  handleGetExecutionStatus,
  handleGetPipelineStatus,
  handleValidateInput
} from './tools/get-status.js';

// Import agent client
import { agentClient } from './utils/agent-client.js';

class AgentMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'agent-mcp-gateway',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        executeAgentTool,
        executePipelineTool,
        getCapabilitiesTool,
        getExecutionStatusTool,
        getPipelineStatusTool,
        validateInputTool,
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'execute_agent':
            return await handleExecuteAgent(args);
          
          case 'execute_pipeline':
            return await handleExecutePipeline(args);
          
          case 'get_agent_capabilities':
            return await handleGetCapabilities(args);
          
          case 'get_execution_status':
            return await handleGetExecutionStatus(args);
          
          case 'get_pipeline_status':
            return await handleGetPipelineStatus(args);
          
          case 'validate_input':
            return await handleValidateInput(args);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error: any) {
        console.error(`Tool execution error for ${name}:`, error);
        
        // Return error as tool result rather than throwing
        return {
          content: [
            {
              type: 'text',
              text: `Tool execution failed: ${error.message || 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupResourceHandlers() {
    // List static resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'agent://capabilities',
          name: 'Agent Service Capabilities',
          mimeType: 'application/json',
          description: 'Complete capabilities and metadata for all available agents',
        },
        {
          uri: 'agent://health',
          name: 'Agent Service Health',
          mimeType: 'application/json',
          description: 'Health status and connectivity information for the agent service',
        },
      ],
    }));

    // List resource templates for dynamic resources
    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
      resourceTemplates: [
        {
          uriTemplate: 'agent://{agent_name}/metadata',
          name: 'Agent Metadata',
          mimeType: 'application/json',
          description: 'Detailed metadata for a specific agent including capabilities and configuration',
        },
        {
          uriTemplate: 'execution://{execution_id}/status',
          name: 'Execution Status',
          mimeType: 'application/json',
          description: 'Real-time status information for agent or pipeline executions',
        },
        {
          uriTemplate: 'pipeline://{execution_id}/progress',
          name: 'Pipeline Progress',
          mimeType: 'application/json',
          description: 'Detailed progress information for pipeline executions',
        },
      ],
    }));

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;

      try {
        // Static resources
        if (uri === 'agent://capabilities') {
          const capabilities = await agentClient.getCapabilities();
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'application/json',
                text: JSON.stringify(capabilities, null, 2),
              },
            ],
          };
        }

        if (uri === 'agent://health') {
          const health = await agentClient.getHealth();
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'application/json',
                text: JSON.stringify(health, null, 2),
              },
            ],
          };
        }

        // Dynamic resources - Agent metadata
        const agentMetadataMatch = uri.match(/^agent:\/\/([^/]+)\/metadata$/);
        if (agentMetadataMatch) {
          const agentName = decodeURIComponent(agentMetadataMatch[1]);
          const metadata = await agentClient.getAgentMetadata(agentName);
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'application/json',
                text: JSON.stringify(metadata, null, 2),
              },
            ],
          };
        }

        // Dynamic resources - Execution status
        const executionStatusMatch = uri.match(/^execution:\/\/([^/]+)\/status$/);
        if (executionStatusMatch) {
          const executionId = decodeURIComponent(executionStatusMatch[1]);
          const status = await agentClient.getExecutionStatus(executionId);
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'application/json',
                text: JSON.stringify(status, null, 2),
              },
            ],
          };
        }

        // Dynamic resources - Pipeline progress
        const pipelineProgressMatch = uri.match(/^pipeline:\/\/([^/]+)\/progress$/);
        if (pipelineProgressMatch) {
          const executionId = decodeURIComponent(pipelineProgressMatch[1]);
          const status = await agentClient.getPipelineExecutionStatus(executionId);
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'application/json',
                text: JSON.stringify(status, null, 2),
              },
            ],
          };
        }

        throw new McpError(
          ErrorCode.InvalidRequest,
          `Unknown resource URI: ${uri}`
        );

      } catch (error: any) {
        console.error('Resource read error:', error);
        
        if (error instanceof McpError) {
          throw error;
        }

        // Handle specific error cases
        if (error.response?.status === 404) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            `Resource not found: ${uri}`
          );
        }

        if (error.code === 'ECONNREFUSED' || error.message.includes('connect')) {
          throw new McpError(
            ErrorCode.InternalError,
            `Cannot connect to Agent Service at ${agentClient.getBaseUrl()}. Please ensure the agent service is running.`
          );
        }

        throw new McpError(
          ErrorCode.InternalError,
          `Failed to read resource: ${error.message || 'Unknown error'}`
        );
      }
    });
  }

  async run() {
    // Test connection to agent service on startup
    console.error('🚀 Starting Agent MCP Gateway...');
    
    try {
      const isConnected = await agentClient.testConnection();
      if (isConnected) {
        console.error('✅ Connected to Agent Service at', agentClient.getBaseUrl());
        
        // Get basic info about available agents
        const agents = await agentClient.getAvailableAgents();
        console.error(`📊 Found ${agents.total_agents} available agents`);
        
        if (agents.agents && agents.agents.length > 0) {
          console.error('🤖 Available agents:');
          agents.agents.forEach(agent => {
            console.error(`   • ${agent.name} (${agent.agent_key})`);
          });
        }
      } else {
        console.error('⚠️  Warning: Cannot connect to Agent Service at', agentClient.getBaseUrl());
        console.error('   The MCP server will start but tools may not work until the agent service is available.');
      }
    } catch (error) {
      console.error('⚠️  Warning: Failed to test agent service connection:', error);
      console.error('   The MCP server will start but tools may not work until the agent service is available.');
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🎯 Agent MCP Gateway running on stdio');
    console.error('');
    console.error('Available tools:');
    console.error('  • execute_agent - Run individual agents');
    console.error('  • execute_pipeline - Run complete multi-agent pipeline');
    console.error('  • get_agent_capabilities - Discover available agents and features');
    console.error('  • get_execution_status - Check agent execution status');
    console.error('  • get_pipeline_status - Check pipeline execution status');
    console.error('  • validate_input - Validate input for agents');
    console.error('');
    console.error('Available resources:');
    console.error('  • agent://capabilities - Service capabilities');
    console.error('  • agent://health - Service health status');
    console.error('  • agent://{agent_name}/metadata - Agent metadata');
    console.error('  • execution://{execution_id}/status - Execution status');
    console.error('  • pipeline://{execution_id}/progress - Pipeline progress');
    console.error('');
    console.error('💡 Try: get_agent_capabilities to see what agents are available!');
  }
}

const server = new AgentMCPServer();
server.run().catch(console.error);

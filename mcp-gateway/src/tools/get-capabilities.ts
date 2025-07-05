/**
 * MCP Tool for getting agent capabilities and service information
 */

import { agentClient } from '../utils/agent-client.js';

export const getCapabilitiesTool = {
  name: 'get_agent_capabilities',
  description: 'Get comprehensive information about all available agents, their capabilities, and service features. Use this to discover what agents are available and what they can do.',
  inputSchema: {
    type: 'object',
    properties: {
      detailed: {
        type: 'boolean',
        description: 'Whether to return detailed information including endpoints and configuration types (default: true)',
        default: true
      },
      agent_name: {
        type: 'string',
        description: 'Optional: Get capabilities for a specific agent only'
      }
    },
    required: [],
  },
};

export async function handleGetCapabilities(args: any) {
  try {
    // Test connection to agent service
    const isConnected = await agentClient.testConnection();
    if (!isConnected) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Cannot connect to Agent Service at ${agentClient.getBaseUrl()}. Please ensure the agent service is running.`,
          },
        ],
        isError: true,
      };
    }

    // If specific agent requested, get its metadata
    if (args.agent_name) {
      try {
        const agentMetadata = await agentClient.getAgentMetadata(args.agent_name);
        
        let resultText = `Agent Capabilities: ${agentMetadata.metadata.name}\n\n`;
        resultText += `Description: ${agentMetadata.metadata.description}\n`;
        resultText += `Version: ${agentMetadata.metadata.version}\n`;
        resultText += `Author: ${agentMetadata.metadata.author}\n`;
        resultText += `Configuration Type: ${agentMetadata.metadata.config_type}\n`;
        
        if (agentMetadata.metadata.capabilities.length > 0) {
          resultText += `\nCapabilities:\n`;
          agentMetadata.metadata.capabilities.forEach(capability => {
            resultText += `• ${capability}\n`;
          });
        }
        
        if (agentMetadata.metadata.dependencies.length > 0) {
          resultText += `\nDependencies:\n`;
          agentMetadata.metadata.dependencies.forEach(dep => {
            resultText += `• ${dep}\n`;
          });
        }

        resultText += `\nUsage:\n`;
        resultText += `Use the execute_agent tool with agent_name="${agentMetadata.agent_key}" to run this agent.\n`;

        return {
          content: [
            {
              type: 'text',
              text: resultText,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: Agent "${args.agent_name}" not found. Use get_agent_capabilities without agent_name to see all available agents.`,
            },
          ],
          isError: true,
        };
      }
    }

    // Get all capabilities
    const [capabilities, availableAgents] = await Promise.all([
      agentClient.getCapabilities(),
      agentClient.getAvailableAgents()
    ]);

    let resultText = `🤖 Agent Service Capabilities\n\n`;
    
    // Service information
    if (capabilities.service_info) {
      resultText += `Service: ${capabilities.service_info.name} v${capabilities.service_info.version}\n`;
      resultText += `Description: ${capabilities.service_info.description}\n\n`;
    }

    // Available agents summary
    resultText += `📊 Available Agents: ${availableAgents.total_agents}\n\n`;

    // List all agents with their capabilities
    if (availableAgents.agents && availableAgents.agents.length > 0) {
      resultText += `🔧 Individual Agents:\n\n`;
      
      availableAgents.agents.forEach(agent => {
        resultText += `▶ ${agent.name} (${agent.agent_key})\n`;
        resultText += `  Description: ${agent.description}\n`;
        resultText += `  Config Type: ${agent.config_type}\n`;
        resultText += `  Version: ${agent.version}\n`;
        
        if (agent.capabilities.length > 0) {
          resultText += `  Capabilities: ${agent.capabilities.join(', ')}\n`;
        }
        resultText += `\n`;
      });
    }

    // Service features
    if (args.detailed !== false) {
      resultText += `🚀 Service Features:\n`;
      resultText += `• Individual agent execution\n`;
      resultText += `• Full pipeline execution\n`;
      resultText += `• Asynchronous processing\n`;
      resultText += `• Real-time progress streaming\n`;
      resultText += `• Input validation\n`;
      resultText += `• Agent discovery and metadata\n`;
      resultText += `• Cross-application compatibility\n`;
      resultText += `• MCP protocol support\n\n`;

      // Available tools
      resultText += `🛠 Available MCP Tools:\n`;
      resultText += `• execute_agent - Run individual agents\n`;
      resultText += `• execute_pipeline - Run complete multi-agent pipeline\n`;
      resultText += `• get_agent_capabilities - Get this information\n`;
      resultText += `• get_execution_status - Check agent execution status\n`;
      resultText += `• get_pipeline_status - Check pipeline execution status\n`;
      resultText += `• validate_input - Validate input for agents\n\n`;

      // Configuration types
      if (capabilities.config_types) {
        resultText += `⚙️ Configuration Types:\n`;
        Object.entries(capabilities.config_types).forEach(([type, info]: [string, any]) => {
          resultText += `• ${type}: ${info.description}\n`;
          if (info.agents && info.agents.length > 0) {
            resultText += `  Agents: ${info.agents.map((a: any) => a.name).join(', ')}\n`;
          }
        });
        resultText += `\n`;
      }

      // Factory stats
      if (availableAgents.factory_stats) {
        resultText += `📈 Factory Statistics:\n`;
        resultText += `• Registered Agents: ${availableAgents.factory_stats.registered_agents || 0}\n`;
        resultText += `• Cached Instances: ${availableAgents.factory_stats.cached_instances || 0}\n`;
        resultText += `• Config Types: ${availableAgents.factory_stats.config_types || 0}\n\n`;
      }
    }

    resultText += `💡 Getting Started:\n`;
    resultText += `1. Use execute_agent to run individual agents\n`;
    resultText += `2. Use execute_pipeline for complete project generation\n`;
    resultText += `3. Use get_agent_capabilities with agent_name for specific agent details\n`;

    return {
      content: [
        {
          type: 'text',
          text: resultText,
        },
      ],
    };

  } catch (error: any) {
    console.error('Get capabilities error:', error);
    
    let errorMessage = 'Failed to get capabilities: ';
    if (error.response?.data?.detail) {
      errorMessage += error.response.data.detail;
    } else if (error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += 'Unknown error occurred';
    }

    return {
      content: [
        {
          type: 'text',
          text: errorMessage,
        },
      ],
      isError: true,
    };
  }
}

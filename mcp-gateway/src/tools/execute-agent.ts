/**
 * MCP Tool for executing individual agents
 */

import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { agentClient } from '../utils/agent-client.js';

export const executeAgentTool = {
  name: 'execute_agent',
  description: 'Execute a specific agent with input data. Allows running individual agents without executing the full pipeline.',
  inputSchema: {
    type: 'object',
    properties: {
      agent_name: {
        type: 'string',
        description: 'Name of the agent to execute (e.g., "python_coder", "code_reviewer", "documentation_writer")',
      },
      input_data: {
        type: 'string',
        description: 'Input data for the agent (natural language description or specific instructions)',
      },
      config: {
        type: 'object',
        description: 'Optional configuration overrides for the agent (e.g., temperature, max_tokens)',
        properties: {
          temperature: { type: 'number', minimum: 0, maximum: 2 },
          max_tokens: { type: 'number', minimum: 1 },
          timeout: { type: 'number', minimum: 1 }
        },
        additionalProperties: true
      },
      context: {
        type: 'object',
        description: 'Optional context data for the agent (e.g., project_type, style preferences)',
        additionalProperties: true
      },
      async_execution: {
        type: 'boolean',
        description: 'Whether to execute the agent asynchronously (default: false)',
        default: false
      }
    },
    required: ['agent_name', 'input_data'],
  },
};

export async function handleExecuteAgent(args: any) {
  try {
    // Validate required arguments
    if (!args.agent_name || !args.input_data) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Both agent_name and input_data are required parameters.',
          },
        ],
        isError: true,
      };
    }

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

    // Prepare the execution request
    const request = {
      input_data: args.input_data,
      config: args.config || {},
      context: args.context || {},
      async_execution: args.async_execution || false,
    };

    // Execute the agent
    const response = await agentClient.executeAgent(args.agent_name, request);

    // Format the response
    let resultText = `Agent Execution Result:\n\n`;
    resultText += `Agent: ${response.agent_name}\n`;
    resultText += `Status: ${response.status}\n`;
    resultText += `Execution ID: ${response.execution_id}\n`;
    resultText += `Message: ${response.message}\n`;

    if (response.started_at) {
      resultText += `Started: ${response.started_at}\n`;
    }

    if (response.completed_at) {
      resultText += `Completed: ${response.completed_at}\n`;
    }

    if (response.result) {
      resultText += `\nResult:\n${JSON.stringify(response.result, null, 2)}\n`;
    }

    if (response.error) {
      resultText += `\nError: ${response.error}\n`;
    }

    // If async execution, provide instructions for checking status
    if (args.async_execution && response.status === 'running') {
      resultText += `\nThis is an asynchronous execution. Use the get_execution_status tool with execution_id "${response.execution_id}" to check progress.`;
    }

    return {
      content: [
        {
          type: 'text',
          text: resultText,
        },
      ],
    };

  } catch (error: any) {
    console.error('Execute agent error:', error);
    
    let errorMessage = 'Failed to execute agent: ';
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

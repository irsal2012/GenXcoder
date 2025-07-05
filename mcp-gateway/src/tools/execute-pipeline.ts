/**
 * MCP Tool for executing complete agent pipelines
 */

import { agentClient } from '../utils/agent-client.js';

export const executePipelineTool = {
  name: 'execute_pipeline',
  description: 'Execute a complete multi-agent pipeline for comprehensive code generation and analysis. This runs all agents in sequence to create a complete project.',
  inputSchema: {
    type: 'object',
    properties: {
      input_data: {
        type: 'string',
        description: 'Natural language description of the software project to build (e.g., "Create a web scraper that extracts product information")',
      },
      pipeline_name: {
        type: 'string',
        description: 'Name of the pipeline configuration to use (default: "default")',
        default: 'default'
      },
      config: {
        type: 'object',
        description: 'Optional configuration overrides for the pipeline',
        properties: {
          timeout: { type: 'number', minimum: 1, description: 'Pipeline timeout in seconds' },
          temperature: { type: 'number', minimum: 0, maximum: 2, description: 'LLM temperature setting' },
          max_tokens: { type: 'number', minimum: 1, description: 'Maximum tokens per agent' }
        },
        additionalProperties: true
      },
      correlation_id: {
        type: 'string',
        description: 'Optional correlation ID for tracking this pipeline execution'
      },
      async_execution: {
        type: 'boolean',
        description: 'Whether to execute the pipeline asynchronously (recommended for long-running tasks)',
        default: true
      }
    },
    required: ['input_data'],
  },
};

export async function handleExecutePipeline(args: any) {
  try {
    // Validate required arguments
    if (!args.input_data) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: input_data is a required parameter. Please provide a description of the software project to build.',
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
      pipeline_name: args.pipeline_name || 'default',
      config: args.config || {},
      correlation_id: args.correlation_id,
      async_execution: args.async_execution !== false, // Default to true
    };

    // Execute the pipeline
    const response = await agentClient.executePipeline(request);

    // Format the response
    let resultText = `Pipeline Execution Result:\n\n`;
    resultText += `Pipeline: ${response.pipeline_name}\n`;
    resultText += `Status: ${response.status}\n`;
    resultText += `Execution ID: ${response.execution_id}\n`;
    resultText += `Message: ${response.message}\n`;

    if (response.started_at) {
      resultText += `Started: ${response.started_at}\n`;
    }

    if (response.completed_at) {
      resultText += `Completed: ${response.completed_at}\n`;
    }

    // Add progress information if available
    if (response.progress) {
      resultText += `\nProgress Information:\n`;
      resultText += `- Total Steps: ${response.progress.total_steps || 'N/A'}\n`;
      resultText += `- Completed Steps: ${response.progress.completed_steps || 0}\n`;
      resultText += `- Progress: ${response.progress.progress_percentage || 0}%\n`;
      resultText += `- Running: ${response.progress.is_running ? 'Yes' : 'No'}\n`;
      
      if (response.progress.current_step_info) {
        resultText += `- Current Step: ${response.progress.current_step_info.name}\n`;
      }
      
      if (response.progress.estimated_remaining_time) {
        resultText += `- Estimated Time Remaining: ${Math.round(response.progress.estimated_remaining_time)} seconds\n`;
      }
    }

    // Add result information if completed
    if (response.result && response.status === 'completed') {
      resultText += `\nExecution Results:\n`;
      if (response.result.success) {
        resultText += `✅ Pipeline completed successfully!\n`;
        if (response.result.results) {
          resultText += `\nGenerated Components:\n`;
          Object.keys(response.result.results).forEach(key => {
            resultText += `- ${key}: Available\n`;
          });
        }
      } else {
        resultText += `❌ Pipeline failed\n`;
        if (response.result.error) {
          resultText += `Error: ${response.result.error}\n`;
        }
      }
    }

    if (response.error) {
      resultText += `\nError: ${response.error}\n`;
    }

    // If async execution, provide instructions for monitoring
    if (request.async_execution && response.status === 'running') {
      resultText += `\n📋 Monitoring Instructions:\n`;
      resultText += `This is an asynchronous execution that may take several minutes to complete.\n`;
      resultText += `Use the get_pipeline_status tool with execution_id "${response.execution_id}" to check progress.\n`;
      resultText += `You can also use get_pipeline_stream for real-time updates.\n`;
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
    console.error('Execute pipeline error:', error);
    
    let errorMessage = 'Failed to execute pipeline: ';
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

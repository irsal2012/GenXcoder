/**
 * MCP Tools for getting execution status and monitoring progress
 */

import { agentClient } from '../utils/agent-client.js';

export const getExecutionStatusTool = {
  name: 'get_execution_status',
  description: 'Get the status of an agent execution. Use this to check progress and results of individual agent executions.',
  inputSchema: {
    type: 'object',
    properties: {
      execution_id: {
        type: 'string',
        description: 'The execution ID returned from execute_agent call',
      }
    },
    required: ['execution_id'],
  },
};

export const getPipelineStatusTool = {
  name: 'get_pipeline_status',
  description: 'Get the status of a pipeline execution. Use this to monitor progress of complete pipeline runs and see detailed step information.',
  inputSchema: {
    type: 'object',
    properties: {
      execution_id: {
        type: 'string',
        description: 'The execution ID returned from execute_pipeline call',
      }
    },
    required: ['execution_id'],
  },
};

export const validateInputTool = {
  name: 'validate_input',
  description: 'Validate input data for a specific agent before execution. This helps ensure your input will work well with the agent.',
  inputSchema: {
    type: 'object',
    properties: {
      agent_name: {
        type: 'string',
        description: 'Name of the agent to validate input for',
      },
      input_data: {
        type: 'string',
        description: 'Input data to validate',
      }
    },
    required: ['agent_name', 'input_data'],
  },
};

export async function handleGetExecutionStatus(args: any) {
  try {
    if (!args.execution_id) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: execution_id is required.',
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

    const status = await agentClient.getExecutionStatus(args.execution_id);

    let resultText = `Agent Execution Status\n\n`;
    resultText += `Execution ID: ${status.execution_id}\n`;
    resultText += `Agent: ${status.agent_name}\n`;
    resultText += `Status: ${status.status}\n`;
    resultText += `Started: ${status.started_at || 'N/A'}\n`;

    if (status.completed_at) {
      resultText += `Completed: ${status.completed_at}\n`;
      
      // Calculate duration if both times available
      if (status.started_at) {
        const start = new Date(status.started_at);
        const end = new Date(status.completed_at);
        const duration = (end.getTime() - start.getTime()) / 1000;
        resultText += `Duration: ${duration.toFixed(2)} seconds\n`;
      }
    }

    if (status.result) {
      resultText += `\nResult:\n${JSON.stringify(status.result, null, 2)}\n`;
    }

    if (status.error) {
      resultText += `\nError: ${status.error}\n`;
    }

    // Add status-specific information
    switch (status.status) {
      case 'running':
        resultText += `\n⏳ Execution is still in progress. Check again in a few moments.`;
        break;
      case 'completed':
        resultText += `\n✅ Execution completed successfully!`;
        break;
      case 'failed':
        resultText += `\n❌ Execution failed. Check the error message above.`;
        break;
      case 'pending':
        resultText += `\n⏸ Execution is pending and will start soon.`;
        break;
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
    console.error('Get execution status error:', error);
    
    let errorMessage = 'Failed to get execution status: ';
    if (error.response?.status === 404) {
      errorMessage += `Execution ID "${args.execution_id}" not found. Please check the execution ID.`;
    } else if (error.response?.data?.detail) {
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

export async function handleGetPipelineStatus(args: any) {
  try {
    if (!args.execution_id) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: execution_id is required.',
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

    const status = await agentClient.getPipelineExecutionStatus(args.execution_id);

    let resultText = `Pipeline Execution Status\n\n`;
    resultText += `Execution ID: ${status.execution_id}\n`;
    resultText += `Pipeline: ${status.pipeline_name}\n`;
    resultText += `Status: ${status.status}\n`;
    resultText += `Started: ${status.started_at || 'N/A'}\n`;

    if (status.completed_at) {
      resultText += `Completed: ${status.completed_at}\n`;
      
      // Calculate duration if both times available
      if (status.started_at) {
        const start = new Date(status.started_at);
        const end = new Date(status.completed_at);
        const duration = (end.getTime() - start.getTime()) / 1000;
        resultText += `Duration: ${duration.toFixed(2)} seconds\n`;
      }
    }

    // Add progress information
    if (status.progress) {
      resultText += `\nProgress Information:\n`;
      resultText += `• Total Steps: ${status.progress.total_steps || 'N/A'}\n`;
      resultText += `• Completed Steps: ${status.progress.completed_steps || 0}\n`;
      resultText += `• Failed Steps: ${status.progress.failed_steps || 0}\n`;
      resultText += `• Progress: ${status.progress.progress_percentage || 0}%\n`;
      resultText += `• Running: ${status.progress.is_running ? 'Yes' : 'No'}\n`;
      resultText += `• Completed: ${status.progress.is_completed ? 'Yes' : 'No'}\n`;
      resultText += `• Has Failures: ${status.progress.has_failures ? 'Yes' : 'No'}\n`;

      if (status.progress.elapsed_time) {
        resultText += `• Elapsed Time: ${status.progress.elapsed_time.toFixed(2)} seconds\n`;
      }

      if (status.progress.estimated_remaining_time) {
        resultText += `• Estimated Remaining: ${status.progress.estimated_remaining_time.toFixed(2)} seconds\n`;
      }

      if (status.progress.current_step_info) {
        resultText += `• Current Step: ${status.progress.current_step_info.name}\n`;
        resultText += `• Step Progress: ${status.progress.current_step_info.progress_percentage || 0}%\n`;
      }

      // Show step details
      if (status.progress.steps && status.progress.steps.length > 0) {
        resultText += `\nStep Details:\n`;
        status.progress.steps.forEach((step: any, index: number) => {
          const stepNumber = index + 1;
          const statusIcon = step.status === 'completed' ? '✅' : 
                           step.status === 'failed' ? '❌' : 
                           step.status === 'running' ? '⏳' : '⏸';
          
          resultText += `${stepNumber}. ${statusIcon} ${step.name} (${step.progress_percentage || 0}%)\n`;
          if (step.description) {
            resultText += `   ${step.description}\n`;
          }
        });
      }
    }

    if (status.result) {
      resultText += `\nExecution Results:\n`;
      if (status.result.success) {
        resultText += `✅ Pipeline completed successfully!\n`;
        if (status.result.results) {
          resultText += `\nGenerated Components:\n`;
          Object.keys(status.result.results).forEach(key => {
            resultText += `• ${key}: Available\n`;
          });
        }
      } else {
        resultText += `❌ Pipeline failed\n`;
        if (status.result.error) {
          resultText += `Error: ${status.result.error}\n`;
        }
      }
    }

    if (status.error) {
      resultText += `\nError: ${status.error}\n`;
    }

    // Add status-specific information
    switch (status.status) {
      case 'running':
        resultText += `\n⏳ Pipeline is still executing. Check again in a few moments for updates.`;
        break;
      case 'completed':
        resultText += `\n✅ Pipeline completed successfully!`;
        break;
      case 'failed':
        resultText += `\n❌ Pipeline execution failed. Check the error details above.`;
        break;
      case 'pending':
        resultText += `\n⏸ Pipeline is pending and will start soon.`;
        break;
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
    console.error('Get pipeline status error:', error);
    
    let errorMessage = 'Failed to get pipeline status: ';
    if (error.response?.status === 404) {
      errorMessage += `Pipeline execution ID "${args.execution_id}" not found. Please check the execution ID.`;
    } else if (error.response?.data?.detail) {
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

export async function handleValidateInput(args: any) {
  try {
    if (!args.agent_name || !args.input_data) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Both agent_name and input_data are required.',
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

    const validation = await agentClient.validateAgentInput(args.agent_name, args.input_data);

    let resultText = `Input Validation Results\n\n`;
    resultText += `Agent: ${validation.agent_name}\n`;
    resultText += `Input: "${args.input_data}"\n\n`;

    if (validation.validation) {
      const isValid = validation.validation.is_valid;
      resultText += `Validation Status: ${isValid ? '✅ Valid' : '❌ Invalid'}\n\n`;

      if (validation.validation.warnings && validation.validation.warnings.length > 0) {
        resultText += `⚠️ Warnings:\n`;
        validation.validation.warnings.forEach((warning: string) => {
          resultText += `• ${warning}\n`;
        });
        resultText += `\n`;
      }

      if (validation.validation.suggestions && validation.validation.suggestions.length > 0) {
        resultText += `💡 Suggestions:\n`;
        validation.validation.suggestions.forEach((suggestion: string) => {
          resultText += `• ${suggestion}\n`;
        });
        resultText += `\n`;
      }

      if (isValid && validation.validation.warnings.length === 0) {
        resultText += `🎉 Your input looks great! You can proceed with executing the agent.`;
      } else if (isValid) {
        resultText += `✅ Your input is valid but consider the warnings above for better results.`;
      } else {
        resultText += `❌ Please address the issues above before executing the agent.`;
      }
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
    console.error('Validate input error:', error);
    
    let errorMessage = 'Failed to validate input: ';
    if (error.response?.status === 404) {
      errorMessage += `Agent "${args.agent_name}" not found. Use get_agent_capabilities to see available agents.`;
    } else if (error.response?.data?.detail) {
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

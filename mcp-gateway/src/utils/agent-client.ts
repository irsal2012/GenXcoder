/**
 * HTTP client for communicating with the Agent Service
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface AgentExecutionRequest {
  input_data: any;
  config?: Record<string, any>;
  context?: Record<string, any>;
  async_execution?: boolean;
}

export interface PipelineExecutionRequest {
  input_data: any;
  pipeline_name?: string;
  config?: Record<string, any>;
  correlation_id?: string;
  async_execution?: boolean;
}

export interface AgentExecutionResponse {
  success: boolean;
  execution_id: string;
  agent_name: string;
  status: string;
  message: string;
  result?: any;
  error?: string;
  started_at?: string;
  completed_at?: string;
}

export interface PipelineExecutionResponse {
  success: boolean;
  execution_id: string;
  pipeline_name: string;
  status: string;
  message: string;
  result?: any;
  progress?: any;
  error?: string;
  started_at?: string;
  completed_at?: string;
}

export interface AgentMetadata {
  agent_name: string;
  agent_key: string;
  metadata: {
    name: string;
    description: string;
    capabilities: string[];
    config_type: string;
    dependencies: string[];
    version: string;
    author: string;
  };
}

export interface AgentCapabilities {
  total_agents: number;
  factory_stats: Record<string, any>;
  agents: Array<{
    agent_key: string;
    name: string;
    description: string;
    capabilities: string[];
    config_type: string;
    version: string;
  }>;
}

export class AgentServiceClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8001') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Agent Service API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Execute a specific agent
   */
  async executeAgent(
    agentName: string,
    request: AgentExecutionRequest
  ): Promise<AgentExecutionResponse> {
    const response = await this.client.post<AgentExecutionResponse>(
      `/v1/agents/${agentName}/execute`,
      request
    );
    return response.data;
  }

  /**
   * Execute a pipeline
   */
  async executePipeline(
    request: PipelineExecutionRequest
  ): Promise<PipelineExecutionResponse> {
    const response = await this.client.post<PipelineExecutionResponse>(
      '/v1/pipelines/execute',
      request
    );
    return response.data;
  }

  /**
   * Get agent metadata
   */
  async getAgentMetadata(agentName: string): Promise<AgentMetadata> {
    const response = await this.client.get<AgentMetadata>(
      `/v1/agents/${agentName}/metadata`
    );
    return response.data;
  }

  /**
   * Get all available agents
   */
  async getAvailableAgents(): Promise<AgentCapabilities> {
    const response = await this.client.get<AgentCapabilities>('/v1/agents');
    return response.data;
  }

  /**
   * Get agent execution status
   */
  async getExecutionStatus(executionId: string): Promise<any> {
    const response = await this.client.get(
      `/v1/agents/execution/${executionId}/status`
    );
    return response.data;
  }

  /**
   * Get pipeline execution status
   */
  async getPipelineExecutionStatus(executionId: string): Promise<any> {
    const response = await this.client.get(
      `/v1/pipelines/execution/${executionId}/status`
    );
    return response.data;
  }

  /**
   * Validate agent input
   */
  async validateAgentInput(agentName: string, inputData: any): Promise<any> {
    const response = await this.client.get(
      `/v1/agents/${agentName}/validate`,
      { params: { input_data: inputData } }
    );
    return response.data;
  }

  /**
   * Get pipeline information
   */
  async getPipelineInfo(): Promise<any> {
    const response = await this.client.get('/v1/pipelines/info');
    return response.data;
  }

  /**
   * Initialize a pipeline
   */
  async initializePipeline(pipelineName: string = 'default'): Promise<any> {
    const response = await this.client.post('/v1/pipelines/initialize', null, {
      params: { pipeline_name: pipelineName }
    });
    return response.data;
  }

  /**
   * Get service capabilities
   */
  async getCapabilities(): Promise<any> {
    const response = await this.client.get('/v1/capabilities');
    return response.data;
  }

  /**
   * Get service health
   */
  async getHealth(): Promise<any> {
    const response = await this.client.get('/health');
    return response.data;
  }

  /**
   * Test connection to the agent service
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getHealth();
      return true;
    } catch (error) {
      console.error('Failed to connect to Agent Service:', error);
      return false;
    }
  }

  /**
   * Get the base URL of the agent service
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Create a default client instance
const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';
export const agentClient = new AgentServiceClient(AGENT_SERVICE_URL);

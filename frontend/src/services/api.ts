import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  GenerateCodeRequest,
  GenerationResponse,
  ValidationResponse,
  HealthStatus,
  ProjectProgress,
  ProjectResult,
  PipelineStatus,
  AgentsInfo,
  ProjectHistory,
  ProjectStatistics,
} from '@/types/api';

class APIClient {
  private client: AxiosInstance;
  private agentClient: AxiosInstance;
  private baseURL: string;
  private agentServiceURL: string;
  private connectionStatus: boolean | null = null;
  private lastHealthCheck = 0;

  constructor(baseURL = 'http://localhost:8000', agentServiceURL = 'http://localhost:8001') {
    this.baseURL = baseURL;
    this.agentServiceURL = agentServiceURL;
    
    // Backend service client
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Agent service client
    this.agentClient = axios.create({
      baseURL: agentServiceURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  private async request<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any,
    config?: any
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client[method](url, data, config);
      return response.data;
    } catch (error) {
      console.error(`API ${method.toUpperCase()} ${url} failed:`, error);
      throw error;
    }
  }

  // Health check with caching
  async healthCheck(maxRetries = 3, retryDelay = 1000): Promise<boolean> {
    const currentTime = Date.now();
    
    // Use cached result if recent (within 5 seconds)
    if (this.connectionStatus !== null && currentTime - this.lastHealthCheck < 5000) {
      return this.connectionStatus;
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.client.get('/health', { timeout: 10000 });
        if (response.status === 200) {
          const healthData = response.data;
          const isReady = healthData?.ready !== false; // Default to true for backward compatibility
          
          this.connectionStatus = isReady;
          this.lastHealthCheck = currentTime;
          
          if (!isReady) {
            console.warn('Backend services not ready:', healthData);
          }
          
          return isReady;
        }
      } catch (error: any) {
        console.warn(`Health check attempt ${attempt + 1}/${maxRetries} failed:`, error.message);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    this.connectionStatus = false;
    this.lastHealthCheck = currentTime;
    return false;
  }

  // Get detailed health status
  async getDetailedHealthStatus(): Promise<HealthStatus> {
    try {
      const response = await this.client.get('/health');
      if (response.status === 200) {
        return response.data;
      } else {
        return {
          status: 'unhealthy',
          error: `HTTP ${response.status}`,
          ready: false,
        };
      }
    } catch (error: any) {
      return {
        status: 'unreachable',
        error: error.message,
        ready: false,
      };
    }
  }

  // Code generation
  async generateCode(request: GenerateCodeRequest): Promise<GenerationResponse> {
    const startTime = Date.now();
    console.log('🚀 [API] Starting code generation process...', {
      user_input_length: request.user_input?.length,
      project_name: request.project_name,
      timestamp: new Date().toISOString()
    });

    try {
      // First, initialize the pipeline
      console.log('📋 [API] Step 1: Initializing pipeline...');
      const initStartTime = Date.now();
      
      await this.agentRequest<any>('post', '/v1/pipelines/initialize', null, {
        params: { pipeline_name: 'iterative_development' }
      });
      
      const initDuration = Date.now() - initStartTime;
      console.log(`✅ [API] Pipeline initialized successfully in ${initDuration}ms`);
      
      // Then execute the pipeline asynchronously
      console.log('🔄 [API] Step 2: Starting async pipeline execution...');
      const execStartTime = Date.now();
      
      const response = await this.agentRequest<any>('post', '/v1/pipelines/execute', {
        input_data: request.user_input,
        pipeline_name: request.project_name || "iterative_development",
        async_execution: true
      }, {
        timeout: 10000 // Shorter timeout for the initial request
      });
      
      const execDuration = Date.now() - execStartTime;
      const totalDuration = Date.now() - startTime;
      
      console.log(`✅ [API] Pipeline execution started successfully in ${execDuration}ms (total: ${totalDuration}ms)`, {
        execution_id: response.execution_id,
        status: response.status,
        message: response.message
      });
      
      return {
        project_id: response.execution_id,
        message: response.message || "Pipeline execution started",
        status: response.status || "running"
      };
    } catch (error: any) {
      const totalDuration = Date.now() - startTime;
      console.error(`❌ [API] Code generation failed after ${totalDuration}ms:`, {
        error: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      });
      throw error;
    }
  }

  // Input validation
  async validateInput(userInput: string): Promise<ValidationResponse> {
    try {
      const response = await this.agentRequest<any>('post', '/v1/pipelines/validate', {
        input_data: userInput
      });
      
      return {
        is_valid: response.validation?.is_valid !== false,
        warnings: response.validation?.warnings || [],
        suggestions: response.validation?.suggestions || []
      };
    } catch (error) {
      console.error('Failed to validate input:', error);
      throw error;
    }
  }

  // Pipeline status
  async getPipelineStatus(): Promise<PipelineStatus> {
    try {
      const response = await this.agentRequest<any>('get', '/v1/pipelines/');
      // Transform the response to match the expected PipelineStatus format
      return {
        current_progress: {
          total_steps: 0,
          completed_steps: 0,
          failed_steps: 0,
          progress_percentage: 0
        },
        total_runs: response.total_executions || 0,
        successful_runs: 0,
        failed_runs: 0
      };
    } catch (error) {
      console.error('Failed to get pipeline status:', error);
      throw error;
    }
  }

  // Project status
  async getProjectStatus(projectId: string): Promise<any> {
    try {
      const response = await this.agentRequest<any>('get', `/v1/pipelines/execution/${projectId}/status`);
      return response;
    } catch (error) {
      console.error('Failed to get project status:', error);
      throw error;
    }
  }

  // Project result
  async getProjectResult(projectId: string): Promise<ProjectResult> {
    try {
      const response = await this.agentRequest<any>('get', `/v1/pipelines/execution/${projectId}/status`);
      
      // Transform the response to match ProjectResult format
      return {
        project_id: projectId,
        project_name: response.pipeline_name || 'Generated Project',
        success: response.status === 'completed',
        timestamp: response.completed_at || response.started_at,
        execution_time: 0, // Calculate if needed
        user_input: '',
        code: response.result?.code || {},
        documentation: response.result?.documentation || {},
        tests: response.result?.tests || {},
        deployment: response.result?.deployment || {},
        ui: response.result?.ui || {},
        pipeline_metadata: response.result?.metadata || {},
        progress: response.progress || {},
        error: response.error
      };
    } catch (error) {
      console.error('Failed to get project result:', error);
      throw error;
    }
  }

  // Cancel project
  async cancelProject(projectId: string): Promise<boolean> {
    try {
      // Note: The agent service doesn't have a cancel endpoint, so we'll return false for now
      console.warn('Cancel project not implemented in agent service');
      return false;
    } catch (error) {
      return false;
    }
  }

  // Progress tracking with extended timeout support
  async getProjectProgress(projectId: string, extendedTimeout = false): Promise<ProjectProgress> {
    try {
      const response = await this.agentRequest<any>('get', `/v1/pipelines/execution/${projectId}/status`);
      
      // Transform the response to match ProjectProgress format
      const progress = response.progress || {};
      return {
        project_id: projectId,
        progress_percentage: progress.progress_percentage || 0,
        total_steps: progress.total_steps || 0,
        completed_steps: progress.completed_steps || 0,
        failed_steps: progress.failed_steps || 0,
        is_running: response.status === 'running',
        is_completed: response.status === 'completed',
        has_failures: response.status === 'failed',
        current_step_info: progress.current_step_info,
        steps: progress.steps || [],
        logs: progress.logs || []
      };
    } catch (error) {
      console.error('Failed to get project progress:', error);
      throw error;
    }
  }

  // Project logs
  async getProjectLogs(projectId: string, limit = 50): Promise<any> {
    try {
      const response = await this.agentRequest<any>('get', `/v1/pipelines/execution/${projectId}/status`);
      return {
        logs: response.progress?.logs || [],
        project_id: projectId
      };
    } catch (error) {
      console.error('Failed to get project logs:', error);
      throw error;
    }
  }

  // Agent service request helper
  private async agentRequest<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any,
    config?: any
  ): Promise<T> {
    try {
      // Merge config with default timeout
      const requestConfig = {
        timeout: 30000,
        ...config
      };
      
      const response: AxiosResponse<T> = await this.agentClient[method](url, data, requestConfig);
      return response.data;
    } catch (error) {
      console.error(`Agent Service ${method.toUpperCase()} ${url} failed:`, error);
      throw error;
    }
  }

  // Agents information
  async getAgentsInfo(): Promise<AgentsInfo> {
    try {
      const response = await this.agentRequest<any>('get', '/v1/agents/');
      // Transform the response to match the expected AgentsInfo format
      return {
        total_agents: response.total_agents || 0,
        agents: response.agents || [],
        factory_stats: response.factory_stats || {}
      };
    } catch (error) {
      console.error('Failed to get agents info:', error);
      throw error;
    }
  }

  // Agent details
  async getAgentDetails(agentName: string): Promise<any> {
    return this.agentRequest('get', `/v1/agents/${agentName}/`);
  }

  // Get agent capabilities
  async getAgentCapabilities(): Promise<any> {
    return this.agentRequest('get', '/v1/capabilities/');
  }

  // Execute agent
  async executeAgent(agentKey: string, request: any): Promise<any> {
    return this.agentRequest('post', `/v1/agents/${agentKey}/execute/`, request);
  }

  // Get pipeline info
  async getPipelineInfo(): Promise<any> {
    return this.agentRequest('get', '/v1/pipelines/');
  }

  // Execute pipeline
  async executePipeline(pipelineConfig: any): Promise<any> {
    return this.agentRequest('post', '/v1/pipelines/execute/', pipelineConfig);
  }

  // Agent service health check
  async getAgentServiceHealth(): Promise<any> {
    try {
      const response = await this.agentClient.get('/health');
      return response.data;
    } catch (error: any) {
      return {
        status: 'unreachable',
        error: error.message,
        ready: false,
      };
    }
  }

  // Project history
  async getProjectHistory(limit = 10, offset = 0, filterSuccess?: boolean): Promise<ProjectHistory> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (filterSuccess !== undefined) {
      params.append('filter_success', filterSuccess.toString());
    }

    return this.request<ProjectHistory>('get', `/api/v1/projects/history?${params}`);
  }

  // Project statistics
  async getProjectStatistics(): Promise<ProjectStatistics> {
    return this.request<ProjectStatistics>('get', '/api/v1/projects/statistics');
  }

  // Search projects
  async searchProjects(query: string): Promise<any> {
    return this.request('get', `/api/v1/projects/search?q=${encodeURIComponent(query)}`);
  }

  // Recent projects
  async getRecentProjects(limit = 10): Promise<any> {
    return this.request('get', `/api/v1/projects/recent?limit=${limit}`);
  }

  // Test progress tracking
  async testProgressTracking(projectId: string): Promise<any> {
    return this.request('get', `/api/v1/progress/test/${projectId}`);
  }

  // Check project completion fallback
  async checkProjectCompletionFallback(projectId: string): Promise<any> {
    try {
      const result = await this.getProjectResult(projectId);
      console.log(`Found completed project result for ${projectId}`);
      return {
        is_completed: true,
        has_result: true,
        result,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          is_completed: false,
          has_result: false,
          result: null,
        };
      }
      throw error;
    }
  }
}

// Create singleton instance
export const apiClient = new APIClient();
export default apiClient;

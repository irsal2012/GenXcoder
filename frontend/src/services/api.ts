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
  private baseURL: string;
  private connectionStatus: boolean | null = null;
  private lastHealthCheck = 0;

  constructor(baseURL = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
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
    return this.request<GenerationResponse>('post', '/api/v1/pipeline/generate', request);
  }

  // Input validation
  async validateInput(userInput: string): Promise<ValidationResponse> {
    return this.request<ValidationResponse>('post', '/api/v1/pipeline/validate', {
      user_input: userInput,
    });
  }

  // Pipeline status
  async getPipelineStatus(): Promise<PipelineStatus> {
    return this.request<PipelineStatus>('get', '/api/v1/pipeline/status');
  }

  // Project status
  async getProjectStatus(projectId: string): Promise<any> {
    return this.request('get', `/api/v1/pipeline/status/${projectId}`);
  }

  // Project result
  async getProjectResult(projectId: string): Promise<ProjectResult> {
    return this.request<ProjectResult>('get', `/api/v1/pipeline/result/${projectId}`);
  }

  // Cancel project
  async cancelProject(projectId: string): Promise<boolean> {
    try {
      await this.request('post', `/api/v1/pipeline/cancel/${projectId}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Progress tracking with extended timeout support
  async getProjectProgress(projectId: string, extendedTimeout = false): Promise<ProjectProgress> {
    const timeout = extendedTimeout ? 120000 : 30000;
    return this.request<ProjectProgress>('get', `/api/v1/progress/${projectId}`, undefined, {
      timeout,
    });
  }

  // Project logs
  async getProjectLogs(projectId: string, limit = 50): Promise<any> {
    return this.request('get', `/api/v1/progress/${projectId}/logs?limit=${limit}`);
  }

  // Agents information
  async getAgentsInfo(): Promise<AgentsInfo> {
    return this.request<AgentsInfo>('get', '/api/v1/agents/info');
  }

  // Agent details
  async getAgentDetails(agentName: string): Promise<any> {
    return this.request('get', `/api/v1/agents/${agentName}`);
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

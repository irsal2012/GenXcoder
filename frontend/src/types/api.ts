export interface GenerateCodeRequest {
  user_input: string;
  project_name?: string;
}

export interface GenerationResponse {
  project_id: string;
  message: string;
  status: string;
}

export interface ValidationResponse {
  is_valid: boolean;
  warnings?: string[];
  suggestions?: string[];
}

export interface HealthStatus {
  status: string;
  ready: boolean;
  error?: string;
  services?: Record<string, any>;
}

export interface ProjectProgress {
  project_id: string;
  progress_percentage: number;
  total_steps: number;
  completed_steps: number;
  failed_steps: number;
  is_running: boolean;
  is_completed: boolean;
  has_failures: boolean;
  current_step_info?: {
    name: string;
    description: string;
    status: string;
    progress_percentage: number;
    agent_name?: string;
  };
  steps: Array<{
    name: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress_percentage: number;
    start_time?: string;
    end_time?: string;
    agent_name?: string;
  }>;
  logs: Array<{
    timestamp: string;
    level: string;
    message: string;
    agent_name?: string;
  }>;
}

export interface ProjectResult {
  project_id: string;
  project_name: string;
  success: boolean;
  timestamp: string;
  execution_time: number;
  user_input: string;
  requirements?: any;
  code?: {
    final_code: string;
  };
  documentation?: {
    readme: string;
  };
  tests?: {
    test_code: string;
  };
  deployment?: {
    deployment_configs: string;
  };
  ui?: {
    streamlit_app: string;
  };
  pipeline_metadata?: {
    execution_time_seconds: number;
  };
  progress?: {
    progress_percentage: number;
  };
  error?: string;
}

export interface PipelineStatus {
  current_progress: {
    total_steps: number;
    completed_steps: number;
    failed_steps: number;
    progress_percentage: number;
  };
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
}

export interface AgentInfo {
  name: string;
  description: string;
  capabilities: string[];
}

export interface AgentsInfo {
  pipeline_steps: string[];
  agents_info: AgentInfo[];
  available_agents: string[];
}

export interface ProjectHistory {
  projects: Array<{
    project_id: string;
    project_name: string;
    timestamp: string;
    success: boolean;
    execution_time: number;
    user_input: string;
    error?: string;
  }>;
  total_count: number;
}

export interface ProjectStatistics {
  total_projects: number;
  successful_projects: number;
  failed_projects: number;
  success_rate: number;
}

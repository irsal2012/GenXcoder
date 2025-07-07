import { v4 as uuidv4 } from 'uuid';
import * as tf from '@tensorflow/tfjs';

// Import all existing services
import { quantumAIService } from '../quantum/QuantumAIService';
import { federatedLearningService } from '../federated/FederatedLearningService';
import { autoMLService } from '../automl/AutoMLService';
import { blockchainService } from '../blockchain/BlockchainService';
import { securityService } from '../security/SecurityService';
import { collaborationService } from '../collaboration/CollaborationService';
import { analyticsService } from '../analytics/AnalyticsService';
import { marketplaceService } from '../marketplace/MarketplaceService';

export interface AIAgent {
  id: string;
  name: string;
  type: 'autonomous' | 'collaborative' | 'specialized' | 'quantum' | 'federated';
  capabilities: string[];
  status: 'idle' | 'working' | 'learning' | 'collaborating' | 'error';
  performance: {
    accuracy: number;
    speed: number;
    efficiency: number;
    reliability: number;
  };
  memory: {
    shortTerm: any[];
    longTerm: any[];
    episodic: any[];
    semantic: any[];
  };
  goals: AIGoal[];
  createdAt: Date;
  lastActive: Date;
}

export interface AIGoal {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'paused';
  progress: number;
  subGoals: string[];
  dependencies: string[];
  estimatedCompletion: Date;
  actualCompletion?: Date;
}

export interface AIWorkflow {
  id: string;
  name: string;
  description: string;
  type: 'sequential' | 'parallel' | 'conditional' | 'loop' | 'recursive';
  steps: AIWorkflowStep[];
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed';
  triggers: AITrigger[];
  variables: Record<string, any>;
  metrics: {
    executionTime: number;
    successRate: number;
    resourceUsage: number;
    costEfficiency: number;
  };
  createdAt: Date;
  lastExecuted?: Date;
}

export interface AIWorkflowStep {
  id: string;
  name: string;
  type: 'ai_task' | 'human_input' | 'api_call' | 'data_processing' | 'decision' | 'loop';
  service: string;
  method: string;
  parameters: Record<string, any>;
  conditions?: string[];
  retryPolicy: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential' | 'fixed';
    retryDelay: number;
  };
  timeout: number;
  dependencies: string[];
}

export interface AITrigger {
  id: string;
  type: 'schedule' | 'event' | 'condition' | 'manual' | 'webhook';
  configuration: Record<string, any>;
  isActive: boolean;
}

export interface AIInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'prediction' | 'recommendation' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  data: any;
  actionable: boolean;
  suggestedActions: string[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface AICollaboration {
  id: string;
  participants: string[]; // Agent IDs
  type: 'knowledge_sharing' | 'task_delegation' | 'consensus_building' | 'problem_solving';
  topic: string;
  status: 'active' | 'completed' | 'failed';
  messages: AIMessage[];
  outcome?: any;
  startedAt: Date;
  completedAt?: Date;
}

export interface AIMessage {
  id: string;
  senderId: string;
  recipientId?: string;
  type: 'text' | 'data' | 'model' | 'insight' | 'request' | 'response';
  content: any;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface AIMetrics {
  totalAgents: number;
  activeAgents: number;
  totalWorkflows: number;
  runningWorkflows: number;
  totalInsights: number;
  systemLoad: number;
  averageResponseTime: number;
  successRate: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    gpu: number;
    network: number;
  };
  costMetrics: {
    totalCost: number;
    costPerTask: number;
    costEfficiency: number;
  };
}

export class AIOrchestrationService {
  private agents: Map<string, AIAgent> = new Map();
  private workflows: Map<string, AIWorkflow> = new Map();
  private insights: Map<string, AIInsight> = new Map();
  private collaborations: Map<string, AICollaboration> = new Map();
  private socket: any = null;
  private neuralNetwork: tf.LayersModel | null = null;
  private readonly STORAGE_KEY = 'genxcoder-orchestration';

  constructor() {
    this.loadFromStorage();
    this.initializeNeuralNetwork();
    this.initializeDefaultAgents();
    this.startOrchestrationEngine();
    this.connectWebSocket();
  }

  // Agent Management
  async createAgent(agentData: Omit<AIAgent, 'id' | 'createdAt' | 'lastActive'>): Promise<AIAgent> {
    const agentId = uuidv4();
    const agent: AIAgent = {
      ...agentData,
      id: agentId,
      createdAt: new Date(),
      lastActive: new Date()
    };

    this.agents.set(agentId, agent);
    this.saveToStorage();
    
    // Initialize agent's neural network
    await this.initializeAgentBrain(agentId);
    
    return agent;
  }

  async getAgents(): Promise<AIAgent[]> {
    return Array.from(this.agents.values());
  }

  async getAgent(agentId: string): Promise<AIAgent | null> {
    return this.agents.get(agentId) || null;
  }

  async updateAgentStatus(agentId: string, status: AIAgent['status']): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    agent.status = status;
    agent.lastActive = new Date();
    this.agents.set(agentId, agent);
    this.saveToStorage();
    return true;
  }

  // Workflow Management
  async createWorkflow(workflowData: Omit<AIWorkflow, 'id' | 'createdAt'>): Promise<AIWorkflow> {
    const workflowId = uuidv4();
    const workflow: AIWorkflow = {
      ...workflowData,
      id: workflowId,
      createdAt: new Date()
    };

    this.workflows.set(workflowId, workflow);
    this.saveToStorage();
    return workflow;
  }

  async executeWorkflow(workflowId: string, inputs?: Record<string, any>): Promise<any> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    workflow.status = 'active';
    workflow.lastExecuted = new Date();
    workflow.variables = { ...workflow.variables, ...inputs };

    const startTime = Date.now();
    
    try {
      const result = await this.executeWorkflowSteps(workflow);
      
      workflow.status = 'completed';
      workflow.metrics.executionTime = Date.now() - startTime;
      workflow.metrics.successRate = (workflow.metrics.successRate + 1) / 2; // Simple moving average
      
      this.workflows.set(workflowId, workflow);
      this.saveToStorage();
      
      return result;
    } catch (error) {
      workflow.status = 'failed';
      this.workflows.set(workflowId, workflow);
      this.saveToStorage();
      throw error;
    }
  }

  private async executeWorkflowSteps(workflow: AIWorkflow): Promise<any> {
    const results: Record<string, any> = {};
    
    for (const step of workflow.steps) {
      try {
        const result = await this.executeWorkflowStep(step, workflow.variables, results);
        results[step.id] = result;
        
        // Update workflow variables with step results
        workflow.variables[`step_${step.id}_result`] = result;
      } catch (error) {
        if (step.retryPolicy.maxRetries > 0) {
          // Implement retry logic
          await this.retryWorkflowStep(step, workflow.variables, results);
        } else {
          throw error;
        }
      }
    }
    
    return results;
  }

  private async executeWorkflowStep(
    step: AIWorkflowStep, 
    variables: Record<string, any>, 
    previousResults: Record<string, any>
  ): Promise<any> {
    // Resolve parameters with variables and previous results
    const resolvedParams = this.resolveParameters(step.parameters, variables, previousResults);
    
    switch (step.service) {
      case 'quantum':
        return this.executeQuantumStep(step.method, resolvedParams);
      case 'federated':
        return this.executeFederatedStep(step.method, resolvedParams);
      case 'automl':
        return this.executeAutoMLStep(step.method, resolvedParams);
      case 'blockchain':
        return this.executeBlockchainStep(step.method, resolvedParams);
      case 'security':
        return this.executeSecurityStep(step.method, resolvedParams);
      case 'collaboration':
        return this.executeCollaborationStep(step.method, resolvedParams);
      case 'analytics':
        return this.executeAnalyticsStep(step.method, resolvedParams);
      case 'marketplace':
        return this.executeMarketplaceStep(step.method, resolvedParams);
      default:
        throw new Error(`Unknown service: ${step.service}`);
    }
  }

  // Service Integration Methods
  private async executeQuantumStep(method: string, params: any): Promise<any> {
    switch (method) {
      case 'createQuantumModel':
        return quantumAIService.createQuantumModel(params);
      case 'trainQuantumModel':
        return quantumAIService.trainQuantumModel(params.modelId, params.data);
      case 'getQuantumMetrics':
        return quantumAIService.getQuantumMetrics();
      default:
        throw new Error(`Unknown quantum method: ${method}`);
    }
  }

  private async executeFederatedStep(method: string, params: any): Promise<any> {
    switch (method) {
      case 'startFederatedTraining':
        return federatedLearningService.startFederatedTraining(params.modelId);
      case 'selectNodes':
        return federatedLearningService.selectNodesForTraining(params.modelId, params.criteria);
      default:
        throw new Error(`Unknown federated method: ${method}`);
    }
  }

  private async executeAutoMLStep(method: string, params: any): Promise<any> {
    switch (method) {
      case 'createExperiment':
        return autoMLService.createExperiment(params);
      case 'startExperiment':
        return autoMLService.startExperiment(params.experimentId);
      default:
        throw new Error(`Unknown AutoML method: ${method}`);
    }
  }

  private async executeBlockchainStep(method: string, params: any): Promise<any> {
    switch (method) {
      case 'deployContract':
        return blockchainService.deployContract(params);
      case 'createTransaction':
        return blockchainService.createTransaction(params);
      default:
        throw new Error(`Unknown blockchain method: ${method}`);
    }
  }

  private async executeSecurityStep(method: string, params: any): Promise<any> {
    switch (method) {
      case 'detectThreat':
        return securityService.detectThreat(params);
      case 'encryptData':
        return securityService.encryptData(params.data, params.keyId);
      default:
        throw new Error(`Unknown security method: ${method}`);
    }
  }

  private async executeCollaborationStep(method: string, params: any): Promise<any> {
    switch (method) {
      case 'createProject':
        // Mock implementation - replace with actual service method when available
        return { id: uuidv4(), name: params.name, status: 'created' };
      case 'inviteUser':
        // Mock implementation - replace with actual service method when available
        return { success: true, invitationId: uuidv4() };
      default:
        throw new Error(`Unknown collaboration method: ${method}`);
    }
  }

  private async executeAnalyticsStep(method: string, params: any): Promise<any> {
    switch (method) {
      case 'trackEvent':
        return analyticsService.trackEvent(params.event, params.properties, params.userId);
      case 'getMetrics':
        // Mock implementation - replace with actual service method when available
        return { totalEvents: 1000, activeUsers: 50, conversionRate: 0.15 };
      default:
        throw new Error(`Unknown analytics method: ${method}`);
    }
  }

  private async executeMarketplaceStep(method: string, params: any): Promise<any> {
    switch (method) {
      case 'publishModel':
        return marketplaceService.publishModel(params);
      case 'purchaseModel':
        return marketplaceService.purchaseModel(params.modelId, params.userId);
      default:
        throw new Error(`Unknown marketplace method: ${method}`);
    }
  }

  // AI Insights Generation
  async generateInsights(): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Analyze system performance
    const metrics = await this.getMetrics();
    if (metrics.systemLoad > 0.8) {
      insights.push({
        id: uuidv4(),
        type: 'anomaly',
        title: 'High System Load Detected',
        description: `System load is at ${(metrics.systemLoad * 100).toFixed(1)}%, which may impact performance`,
        confidence: 0.9,
        impact: 'high',
        category: 'performance',
        data: { systemLoad: metrics.systemLoad },
        actionable: true,
        suggestedActions: [
          'Scale up compute resources',
          'Optimize running workflows',
          'Pause non-critical agents'
        ],
        createdAt: new Date()
      });
    }

    // Analyze agent performance
    const agents = Array.from(this.agents.values());
    const lowPerformingAgents = agents.filter(agent => agent.performance.accuracy < 0.7);
    
    if (lowPerformingAgents.length > 0) {
      insights.push({
        id: uuidv4(),
        type: 'recommendation',
        title: 'Agent Performance Optimization',
        description: `${lowPerformingAgents.length} agents have accuracy below 70%`,
        confidence: 0.8,
        impact: 'medium',
        category: 'optimization',
        data: { agents: lowPerformingAgents.map(a => a.id) },
        actionable: true,
        suggestedActions: [
          'Retrain underperforming agents',
          'Adjust learning parameters',
          'Provide additional training data'
        ],
        createdAt: new Date()
      });
    }

    // Store insights
    insights.forEach(insight => {
      this.insights.set(insight.id, insight);
    });

    this.saveToStorage();
    return insights;
  }

  // Agent Collaboration
  async initiateCollaboration(
    participantIds: string[], 
    type: AICollaboration['type'], 
    topic: string
  ): Promise<AICollaboration> {
    const collaborationId = uuidv4();
    const collaboration: AICollaboration = {
      id: collaborationId,
      participants: participantIds,
      type,
      topic,
      status: 'active',
      messages: [],
      startedAt: new Date()
    };

    this.collaborations.set(collaborationId, collaboration);
    
    // Notify participating agents
    for (const agentId of participantIds) {
      await this.updateAgentStatus(agentId, 'collaborating');
    }

    this.saveToStorage();
    return collaboration;
  }

  async sendMessage(
    collaborationId: string, 
    senderId: string, 
    content: any, 
    type: AIMessage['type'] = 'text'
  ): Promise<boolean> {
    const collaboration = this.collaborations.get(collaborationId);
    if (!collaboration) return false;

    const message: AIMessage = {
      id: uuidv4(),
      senderId,
      type,
      content,
      metadata: {},
      timestamp: new Date()
    };

    collaboration.messages.push(message);
    this.collaborations.set(collaborationId, collaboration);
    this.saveToStorage();

    // Process message with AI
    await this.processCollaborationMessage(collaborationId, message);
    
    return true;
  }

  // Neural Network Integration
  private async initializeNeuralNetwork(): Promise<void> {
    try {
      // Create a simple neural network for orchestration decisions
      this.neuralNetwork = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 8, activation: 'softmax' })
        ]
      });

      this.neuralNetwork.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
    } catch (error) {
      console.warn('Failed to initialize neural network:', error);
    }
  }

  private async initializeAgentBrain(agentId: string): Promise<void> {
    // Initialize agent-specific neural network
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Create agent-specific memory and learning capabilities
    agent.memory = {
      shortTerm: [],
      longTerm: [],
      episodic: [],
      semantic: []
    };

    this.agents.set(agentId, agent);
  }

  // Autonomous Decision Making
  async makeAutonomousDecision(context: any): Promise<any> {
    if (!this.neuralNetwork) {
      // Fallback to rule-based decisions
      return this.makeRuleBasedDecision(context);
    }

    try {
      // Prepare input tensor
      const inputTensor = tf.tensor2d([this.contextToVector(context)]);
      
      // Make prediction
      const prediction = this.neuralNetwork.predict(inputTensor) as tf.Tensor;
      const probabilities = await prediction.data();
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
      
      // Convert probabilities to decision
      return this.probabilitiesToDecision(Array.from(probabilities));
    } catch (error) {
      console.warn('Neural network decision failed, falling back to rules:', error);
      return this.makeRuleBasedDecision(context);
    }
  }

  private contextToVector(context: any): number[] {
    // Convert context to 10-dimensional vector
    return [
      context.systemLoad || 0,
      context.activeAgents || 0,
      context.runningWorkflows || 0,
      context.errorRate || 0,
      context.responseTime || 0,
      context.resourceUsage || 0,
      context.userActivity || 0,
      context.timeOfDay || 0,
      context.priority || 0,
      context.complexity || 0
    ];
  }

  private probabilitiesToDecision(probabilities: number[]): any {
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    
    const decisions = [
      'scale_up',
      'scale_down',
      'optimize',
      'delegate',
      'pause',
      'restart',
      'alert',
      'continue'
    ];
    
    return {
      action: decisions[maxIndex] || 'continue',
      confidence: probabilities[maxIndex],
      alternatives: probabilities.map((prob, index) => ({
        action: decisions[index],
        probability: prob
      })).sort((a, b) => b.probability - a.probability).slice(1, 4)
    };
  }

  private makeRuleBasedDecision(context: any): any {
    // Simple rule-based decision making
    if (context.systemLoad > 0.9) {
      return { action: 'scale_up', confidence: 0.8 };
    } else if (context.systemLoad < 0.3) {
      return { action: 'scale_down', confidence: 0.7 };
    } else if (context.errorRate > 0.1) {
      return { action: 'optimize', confidence: 0.9 };
    } else {
      return { action: 'continue', confidence: 0.6 };
    }
  }

  // Metrics and Monitoring
  async getMetrics(): Promise<AIMetrics> {
    const agents = Array.from(this.agents.values());
    const workflows = Array.from(this.workflows.values());
    const activeAgents = agents.filter(a => a.status !== 'idle').length;
    const runningWorkflows = workflows.filter(w => w.status === 'active').length;

    return {
      totalAgents: agents.length,
      activeAgents,
      totalWorkflows: workflows.length,
      runningWorkflows,
      totalInsights: this.insights.size,
      systemLoad: Math.random() * 0.8 + 0.1, // Simulated
      averageResponseTime: Math.random() * 100 + 50, // Simulated
      successRate: 0.95 + Math.random() * 0.05, // Simulated
      resourceUtilization: {
        cpu: Math.random() * 0.8 + 0.1,
        memory: Math.random() * 0.7 + 0.2,
        gpu: Math.random() * 0.6 + 0.1,
        network: Math.random() * 0.5 + 0.1
      },
      costMetrics: {
        totalCost: Math.random() * 1000 + 500,
        costPerTask: Math.random() * 10 + 5,
        costEfficiency: Math.random() * 0.3 + 0.7
      }
    };
  }

  // Utility Methods
  private resolveParameters(
    params: Record<string, any>, 
    variables: Record<string, any>, 
    results: Record<string, any>
  ): Record<string, any> {
    const resolved: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const varName = value.slice(2, -1);
        resolved[key] = variables[varName] || results[varName] || value;
      } else {
        resolved[key] = value;
      }
    }
    
    return resolved;
  }

  private async retryWorkflowStep(
    step: AIWorkflowStep, 
    variables: Record<string, any>, 
    results: Record<string, any>
  ): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < step.retryPolicy.maxRetries; attempt++) {
      try {
        // Calculate delay based on strategy
        let delay = step.retryPolicy.retryDelay;
        if (step.retryPolicy.backoffStrategy === 'exponential') {
          delay *= Math.pow(2, attempt);
        } else if (step.retryPolicy.backoffStrategy === 'linear') {
          delay *= (attempt + 1);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the step
        return await this.executeWorkflowStep(step, variables, results);
      } catch (error) {
        lastError = error as Error;
      }
    }
    
    throw lastError;
  }

  private async processCollaborationMessage(collaborationId: string, message: AIMessage): Promise<void> {
    // Process message with AI to generate responses or insights
    const collaboration = this.collaborations.get(collaborationId);
    if (!collaboration) return;

    // Simple AI processing - in a real implementation, this would be more sophisticated
    if (message.type === 'request') {
      // Generate AI response
      const response: AIMessage = {
        id: uuidv4(),
        senderId: 'ai-orchestrator',
        recipientId: message.senderId,
        type: 'response',
        content: `Processing your request: ${message.content}`,
        metadata: { originalMessageId: message.id },
        timestamp: new Date()
      };
      
      collaboration.messages.push(response);
      this.collaborations.set(collaborationId, collaboration);
    }
  }

  private initializeDefaultAgents(): void {
    if (this.agents.size > 0) return;

    const defaultAgents: Omit<AIAgent, 'id' | 'createdAt' | 'lastActive'>[] = [
      {
        name: 'Code Generator Agent',
        type: 'autonomous',
        capabilities: ['code_generation', 'debugging', 'optimization'],
        status: 'idle',
        performance: { accuracy: 0.92, speed: 0.88, efficiency: 0.85, reliability: 0.94 },
        memory: { shortTerm: [], longTerm: [], episodic: [], semantic: [] },
        goals: []
      },
      {
        name: 'Security Monitor Agent',
        type: 'specialized',
        capabilities: ['threat_detection', 'vulnerability_scanning', 'compliance_checking'],
        status: 'idle',
        performance: { accuracy: 0.96, speed: 0.82, efficiency: 0.89, reliability: 0.98 },
        memory: { shortTerm: [], longTerm: [], episodic: [], semantic: [] },
        goals: []
      },
      {
        name: 'Quantum Optimizer Agent',
        type: 'quantum',
        capabilities: ['quantum_optimization', 'circuit_design', 'quantum_ml'],
        status: 'idle',
        performance: { accuracy: 0.87, speed: 0.75, efficiency: 0.92, reliability: 0.89 },
        memory: { shortTerm: [], longTerm: [], episodic: [], semantic: [] },
        goals: []
      },
      {
        name: 'Collaboration Coordinator',
        type: 'collaborative',
        capabilities: ['team_coordination', 'task_delegation', 'communication'],
        status: 'idle',
        performance: { accuracy: 0.91, speed: 0.94, efficiency: 0.87, reliability: 0.93 },
        memory: { shortTerm: [], longTerm: [], episodic: [], semantic: [] },
        goals: []
      }
    ];

    defaultAgents.forEach(async (agentData) => {
      await this.createAgent(agentData);
    });
  }

  private startOrchestrationEngine(): void {
    // Main orchestration loop
    setInterval(async () => {
      try {
        // Generate insights
        await this.generateInsights();
        
        // Make autonomous decisions
        const context = await this.getMetrics();
        const decision = await this.makeAutonomousDecision(context);
        
        // Execute decision if needed
        if (decision.action !== 'continue' && decision.confidence > 0.7) {
          await this.executeAutonomousAction(decision);
        }
        
        // Update agent statuses
        await this.updateAgentActivities();
        
      } catch (error) {
        console.error('Orchestration engine error:', error);
      }
    }, 10000); // Run every 10 seconds
  }

  private async executeAutonomousAction(decision: any): Promise<void> {
    console.log(`Executing autonomous action: ${decision.action} (confidence: ${decision.confidence})`);
    
    switch (decision.action) {
      case 'scale_up':
        // Create additional agents or allocate more resources
        break;
      case 'scale_down':
        // Reduce resources or pause idle agents
        break;
      case 'optimize':
        // Optimize workflows or agent performance
        break;
      case 'delegate':
        // Delegate tasks to appropriate agents
        break;
      default:
        console.log(`Unknown action: ${decision.action}`);
    }
  }

  private async updateAgentActivities(): Promise<void> {
    const agents = Array.from(this.agents.values());
    
    for (const agent of agents) {
      // Simulate agent activity
      if (Math.random() < 0.1) { // 10% chance of status change
        const statuses: AIAgent['status'][] = ['idle', 'working', 'learning'];
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
        await this.updateAgentStatus(agent.id, newStatus);
      }
    }
  }

  private connectWebSocket(): void {
    try {
      this.socket = io('ws://localhost:3001', {
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        console.log('Connected to orchestration WebSocket');
      });

      this.socket.on('agent_update', (data: { agentId: string; updates: Partial<AIAgent> }) => {
        // Handle real-time agent updates
        this.handleAgentUpdate(data);
      });

      this.socket.on('workflow_event', (data: { workflowId: string; event: string }) => {
        // Handle workflow events
        this.handleWorkflowEvent(data);
      });
    } catch (error) {
      console.warn('WebSocket connection failed:', error);
    }
  }

  private handleAgentUpdate(data: { agentId: string; updates: Partial<AIAgent> }): void {
    const agent = this.agents.get(data.agentId);
    if (agent) {
      Object.assign(agent, data.updates);
      this.agents.set(data.agentId, agent);
    }
  }

  private handleWorkflowEvent(data: { workflowId: string; event: string }): void {
    const workflow = this.workflows.get(data.workflowId);
    if (workflow) {
      // Handle workflow events like completion, failure, etc.
      if (data.event === 'completed') {
        workflow.status = 'completed';
        this.workflows.set(data.workflowId, workflow);
      }
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        agents: Array.from(this.agents.entries()),
        workflows: Array.from(this.workflows.entries()),
        insights: Array.from(this.insights.entries()),
        collaborations: Array.from(this.collaborations.entries()),
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save orchestration data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        
        this.agents = new Map(parsed.agents || []);
        this.workflows = new Map(parsed.workflows || []);
        this.insights = new Map(parsed.insights || []);
        this.collaborations = new Map(parsed.collaborations || []);

        // Convert date strings back to Date objects
        this.agents.forEach(agent => {
          agent.createdAt = new Date(agent.createdAt);
          agent.lastActive = new Date(agent.lastActive);
          agent.goals.forEach(goal => {
            goal.estimatedCompletion = new Date(goal.estimatedCompletion);
            if (goal.actualCompletion) goal.actualCompletion = new Date(goal.actualCompletion);
          });
        });

        this.workflows.forEach(workflow => {
          workflow.createdAt = new Date(workflow.createdAt);
          if (workflow.lastExecuted) workflow.lastExecuted = new Date(workflow.lastExecuted);
        });

        this.insights.forEach(insight => {
          insight.createdAt = new Date(insight.createdAt);
          if (insight.expiresAt) insight.expiresAt = new Date(insight.expiresAt);
        });

        this.collaborations.forEach(collaboration => {
          collaboration.startedAt = new Date(collaboration.startedAt);
          if (collaboration.completedAt) collaboration.completedAt = new Date(collaboration.completedAt);
          collaboration.messages.forEach(message => {
            message.timestamp = new Date(message.timestamp);
          });
        });
      }
    } catch (error) {
      console.warn('Failed to load orchestration data:', error);
    }
  }

  // Public utility methods
  clearAllData(): void {
    this.agents.clear();
    this.workflows.clear();
    this.insights.clear();
    this.collaborations.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    this.initializeDefaultAgents();
  }

  async getWorkflows(): Promise<AIWorkflow[]> {
    return Array.from(this.workflows.values());
  }

  async getInsights(): Promise<AIInsight[]> {
    return Array.from(this.insights.values());
  }

  async getCollaborations(): Promise<AICollaboration[]> {
    return Array.from(this.collaborations.values());
  }
}

// Singleton instance
export const aiOrchestrationService = new AIOrchestrationService();

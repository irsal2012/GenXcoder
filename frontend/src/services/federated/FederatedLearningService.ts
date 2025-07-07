import { v4 as uuidv4 } from 'uuid';
import * as tf from '@tensorflow/tfjs';
import { globalCDNService } from '../cdn/GlobalCDNService';

export interface FederatedNode {
  id: string;
  name: string;
  location: {
    city: string;
    country: string;
    continent: string;
    coordinates: { lat: number; lng: number };
  };
  status: 'online' | 'offline' | 'training' | 'syncing' | 'error';
  capabilities: {
    computePower: number; // TFLOPS
    memory: number; // GB
    storage: number; // GB
    bandwidth: number; // Mbps
    gpuCount: number;
    gpuType: string;
  };
  participation: {
    totalRounds: number;
    successfulRounds: number;
    averageLatency: number;
    dataContribution: number; // MB
    modelAccuracy: number;
  };
  privacy: {
    differentialPrivacy: boolean;
    homomorphicEncryption: boolean;
    secureAggregation: boolean;
    dataLocality: boolean;
  };
  createdAt: Date;
  lastSeen: Date;
}

export interface FederatedModel {
  id: string;
  name: string;
  description: string;
  type: 'classification' | 'regression' | 'nlp' | 'computer_vision' | 'time_series' | 'reinforcement';
  architecture: {
    framework: 'tensorflow' | 'pytorch' | 'onnx';
    layers: any[];
    inputShape: number[];
    outputShape: number[];
    parameters: number;
  };
  aggregation: {
    strategy: 'fedavg' | 'fedprox' | 'scaffold' | 'fednova' | 'fedopt';
    rounds: number;
    minParticipants: number;
    participationRate: number;
    convergenceThreshold: number;
  };
  privacy: {
    differentialPrivacy: {
      enabled: boolean;
      epsilon: number;
      delta: number;
      mechanism: 'gaussian' | 'laplace';
    };
    homomorphicEncryption: {
      enabled: boolean;
      scheme: 'paillier' | 'ckks' | 'bfv';
      keySize: number;
    };
    secureAggregation: {
      enabled: boolean;
      threshold: number;
      protocol: 'shamir' | 'additive';
    };
  };
  performance: {
    globalAccuracy: number;
    convergenceRound: number;
    communicationCost: number; // MB
    trainingTime: number; // seconds
    energyConsumption: number; // kWh
  };
  training: {
    status: 'idle' | 'recruiting' | 'training' | 'aggregating' | 'completed' | 'failed';
    currentRound: number;
    participatingNodes: string[];
    roundHistory: FederatedRound[];
    globalModel: any; // Serialized model weights
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FederatedRound {
  id: string;
  modelId: string;
  roundNumber: number;
  participatingNodes: string[];
  startTime: Date;
  endTime?: Date;
  status: 'recruiting' | 'training' | 'aggregating' | 'completed' | 'failed';
  metrics: {
    averageAccuracy: number;
    communicationCost: number;
    aggregationTime: number;
    participationRate: number;
  };
  nodeUpdates: FederatedNodeUpdate[];
}

export interface FederatedNodeUpdate {
  nodeId: string;
  modelWeights: any; // Serialized weights
  trainingMetrics: {
    accuracy: number;
    loss: number;
    samples: number;
    epochs: number;
    trainingTime: number;
  };
  privacyMetrics: {
    noiseLevel: number;
    encryptionOverhead: number;
    privacyBudget: number;
  };
  uploadTime: Date;
  verified: boolean;
}

export interface FederatedDataset {
  id: string;
  name: string;
  description: string;
  type: 'tabular' | 'image' | 'text' | 'audio' | 'video' | 'time_series';
  schema: {
    features: Array<{
      name: string;
      type: 'numeric' | 'categorical' | 'text' | 'image' | 'audio';
      shape?: number[];
      nullable: boolean;
    }>;
    target: {
      name: string;
      type: 'binary' | 'multiclass' | 'regression' | 'multilabel';
      classes?: string[];
    };
  };
  distribution: {
    totalSamples: number;
    nodeDistribution: Record<string, number>;
    classBalance: Record<string, number>;
    statisticalHeterogeneity: number; // 0-1 score
  };
  privacy: {
    anonymized: boolean;
    synthetic: boolean;
    differentiallyPrivate: boolean;
    consentLevel: 'explicit' | 'implicit' | 'opt_out';
  };
  quality: {
    completeness: number; // 0-1
    consistency: number; // 0-1
    accuracy: number; // 0-1
    timeliness: number; // 0-1
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FederatedAnalytics {
  totalNodes: number;
  activeNodes: number;
  totalModels: number;
  activeTraining: number;
  globalMetrics: {
    averageAccuracy: number;
    totalCommunicationCost: number;
    energyEfficiency: number;
    privacyPreservation: number;
  };
  nodesByRegion: Record<string, number>;
  modelsByType: Record<string, number>;
  performanceTrends: Array<{
    date: Date;
    accuracy: number;
    communicationCost: number;
    participationRate: number;
  }>;
}

export class FederatedLearningService {
  private nodes: Map<string, FederatedNode> = new Map();
  private models: Map<string, FederatedModel> = new Map();
  private rounds: Map<string, FederatedRound> = new Map();
  private datasets: Map<string, FederatedDataset> = new Map();
  private readonly STORAGE_KEY = 'genxcoder-federated';

  constructor() {
    this.loadFromStorage();
    this.initializeGlobalNodes();
    this.startFederatedCoordinator();
  }

  // Node Management
  async registerNode(nodeData: Omit<FederatedNode, 'id' | 'createdAt' | 'lastSeen' | 'participation'>): Promise<FederatedNode> {
    const nodeId = uuidv4();
    const node: FederatedNode = {
      ...nodeData,
      id: nodeId,
      participation: {
        totalRounds: 0,
        successfulRounds: 0,
        averageLatency: 0,
        dataContribution: 0,
        modelAccuracy: 0
      },
      createdAt: new Date(),
      lastSeen: new Date()
    };

    this.nodes.set(nodeId, node);
    this.saveToStorage();
    return node;
  }

  async getNode(nodeId: string): Promise<FederatedNode | null> {
    return this.nodes.get(nodeId) || null;
  }

  async getAllNodes(): Promise<FederatedNode[]> {
    return Array.from(this.nodes.values());
  }

  async getAvailableNodes(): Promise<FederatedNode[]> {
    return Array.from(this.nodes.values()).filter(
      node => node.status === 'online' && 
               node.capabilities.computePower > 0 &&
               node.capabilities.bandwidth > 10 // Minimum 10 Mbps
    );
  }

  async updateNodeStatus(nodeId: string, status: FederatedNode['status']): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.status = status;
      node.lastSeen = new Date();
      this.nodes.set(nodeId, node);
      this.saveToStorage();
    }
  }

  async selectNodesForTraining(
    modelId: string, 
    requirements: {
      minNodes: number;
      maxNodes: number;
      minComputePower?: number;
      minMemory?: number;
      regions?: string[];
    }
  ): Promise<FederatedNode[]> {
    const availableNodes = await this.getAvailableNodes();
    
    let eligibleNodes = availableNodes.filter(node => {
      if (requirements.minComputePower && node.capabilities.computePower < requirements.minComputePower) {
        return false;
      }
      if (requirements.minMemory && node.capabilities.memory < requirements.minMemory) {
        return false;
      }
      if (requirements.regions && !requirements.regions.includes(node.location.continent)) {
        return false;
      }
      return true;
    });

    // Sort by participation history and compute power
    eligibleNodes.sort((a, b) => {
      const scoreA = a.participation.successfulRounds / Math.max(1, a.participation.totalRounds) * 
                    a.capabilities.computePower;
      const scoreB = b.participation.successfulRounds / Math.max(1, b.participation.totalRounds) * 
                    b.capabilities.computePower;
      return scoreB - scoreA;
    });

    // Select nodes ensuring geographic diversity
    const selectedNodes: FederatedNode[] = [];
    const regionCounts: Record<string, number> = {};

    for (const node of eligibleNodes) {
      if (selectedNodes.length >= requirements.maxNodes) break;
      
      const region = node.location.continent;
      const regionCount = regionCounts[region] || 0;
      
      // Prefer geographic diversity
      if (selectedNodes.length < requirements.minNodes || regionCount < 2) {
        selectedNodes.push(node);
        regionCounts[region] = regionCount + 1;
      }
    }

    return selectedNodes.slice(0, requirements.maxNodes);
  }

  // Model Management
  async createFederatedModel(modelData: Omit<FederatedModel, 'id' | 'createdAt' | 'updatedAt' | 'training' | 'performance'>): Promise<FederatedModel> {
    const modelId = uuidv4();
    const model: FederatedModel = {
      ...modelData,
      id: modelId,
      performance: {
        globalAccuracy: 0,
        convergenceRound: 0,
        communicationCost: 0,
        trainingTime: 0,
        energyConsumption: 0
      },
      training: {
        status: 'idle',
        currentRound: 0,
        participatingNodes: [],
        roundHistory: [],
        globalModel: null
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.models.set(modelId, model);
    this.saveToStorage();
    return model;
  }

  async getFederatedModel(modelId: string): Promise<FederatedModel | null> {
    return this.models.get(modelId) || null;
  }

  async getAllFederatedModels(): Promise<FederatedModel[]> {
    return Array.from(this.models.values());
  }

  async startFederatedTraining(modelId: string): Promise<FederatedRound> {
    const model = await this.getFederatedModel(modelId);
    if (!model) {
      throw new Error('Federated model not found');
    }

    if (model.training.status !== 'idle' && model.training.status !== 'completed') {
      throw new Error('Model is already training');
    }

    // Select nodes for training
    const selectedNodes = await this.selectNodesForTraining(modelId, {
      minNodes: model.aggregation.minParticipants,
      maxNodes: Math.ceil(model.aggregation.minParticipants / model.aggregation.participationRate),
      minComputePower: 1.0, // 1 TFLOP minimum
      minMemory: 4 // 4 GB minimum
    });

    if (selectedNodes.length < model.aggregation.minParticipants) {
      throw new Error('Insufficient nodes available for training');
    }

    // Create new training round
    const roundId = uuidv4();
    const round: FederatedRound = {
      id: roundId,
      modelId,
      roundNumber: model.training.currentRound + 1,
      participatingNodes: selectedNodes.map(node => node.id),
      startTime: new Date(),
      status: 'recruiting',
      metrics: {
        averageAccuracy: 0,
        communicationCost: 0,
        aggregationTime: 0,
        participationRate: 0
      },
      nodeUpdates: []
    };

    // Update model status
    model.training.status = 'recruiting';
    model.training.currentRound = round.roundNumber;
    model.training.participatingNodes = selectedNodes.map(node => node.id);
    model.updatedAt = new Date();

    // Update node statuses
    selectedNodes.forEach(node => {
      node.status = 'training';
      node.participation.totalRounds += 1;
      this.nodes.set(node.id, node);
    });

    this.rounds.set(roundId, round);
    this.models.set(modelId, model);
    this.saveToStorage();

    // Start training simulation
    this.simulateFederatedTraining(round, model);

    return round;
  }

  private async simulateFederatedTraining(round: FederatedRound, model: FederatedModel): Promise<void> {
    try {
      // Phase 1: Node recruitment and local training
      round.status = 'training';
      model.training.status = 'training';
      
      const trainingPromises = round.participatingNodes.map(async (nodeId) => {
        const node = this.nodes.get(nodeId);
        if (!node) return null;

        // Simulate local training
        const trainingTime = 30000 + Math.random() * 60000; // 30-90 seconds
        await new Promise(resolve => setTimeout(resolve, trainingTime));

        // Simulate training results
        const baseAccuracy = 0.7 + Math.random() * 0.2;
        const accuracy = Math.min(0.95, baseAccuracy + (round.roundNumber - 1) * 0.02);
        const loss = Math.max(0.05, 1.0 - accuracy + Math.random() * 0.1);

        const nodeUpdate: FederatedNodeUpdate = {
          nodeId,
          modelWeights: this.generateMockWeights(),
          trainingMetrics: {
            accuracy,
            loss,
            samples: 1000 + Math.floor(Math.random() * 5000),
            epochs: 5 + Math.floor(Math.random() * 10),
            trainingTime: trainingTime / 1000
          },
          privacyMetrics: {
            noiseLevel: model.privacy.differentialPrivacy.enabled ? 
                       model.privacy.differentialPrivacy.epsilon : 0,
            encryptionOverhead: model.privacy.homomorphicEncryption.enabled ? 0.2 : 0,
            privacyBudget: Math.max(0, 1.0 - round.roundNumber * 0.1)
          },
          uploadTime: new Date(),
          verified: true
        };

        // Update node participation
        node.participation.successfulRounds += 1;
        node.participation.modelAccuracy = accuracy;
        node.participation.averageLatency = (node.participation.averageLatency + trainingTime) / 2;
        node.status = 'syncing';
        this.nodes.set(nodeId, node);

        return nodeUpdate;
      });

      // Wait for all nodes to complete training
      const nodeUpdates = (await Promise.all(trainingPromises)).filter(update => update !== null) as FederatedNodeUpdate[];
      round.nodeUpdates = nodeUpdates;

      // Phase 2: Aggregation
      round.status = 'aggregating';
      model.training.status = 'aggregating';
      
      const aggregationStartTime = Date.now();
      
      // Simulate model aggregation
      await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 10000)); // 5-15 seconds
      
      const aggregationTime = (Date.now() - aggregationStartTime) / 1000;

      // Calculate round metrics
      const averageAccuracy = nodeUpdates.reduce((sum, update) => 
        sum + update.trainingMetrics.accuracy, 0) / nodeUpdates.length;
      
      const communicationCost = nodeUpdates.reduce((sum, update) => 
        sum + update.trainingMetrics.samples * 0.001, 0); // Simulate communication cost
      
      const participationRate = nodeUpdates.length / round.participatingNodes.length;

      round.metrics = {
        averageAccuracy,
        communicationCost,
        aggregationTime,
        participationRate
      };

      // Update global model
      model.training.globalModel = this.aggregateWeights(nodeUpdates);
      model.performance.globalAccuracy = averageAccuracy;
      model.performance.communicationCost += communicationCost;
      model.performance.trainingTime += aggregationTime;

      // Complete round
      round.status = 'completed';
      round.endTime = new Date();
      model.training.roundHistory.push(round);

      // Check convergence
      const convergenceThreshold = model.aggregation.convergenceThreshold;
      const hasConverged = round.roundNumber >= model.aggregation.rounds || 
                          averageAccuracy >= convergenceThreshold;

      if (hasConverged) {
        model.training.status = 'completed';
        model.performance.convergenceRound = round.roundNumber;
      } else {
        model.training.status = 'idle';
      }

      // Reset node statuses
      round.participatingNodes.forEach(nodeId => {
        const node = this.nodes.get(nodeId);
        if (node) {
          node.status = 'online';
          this.nodes.set(nodeId, node);
        }
      });

      this.rounds.set(round.id, round);
      this.models.set(model.id, model);
      this.saveToStorage();

    } catch (error) {
      round.status = 'failed';
      model.training.status = 'failed';
      
      // Reset node statuses
      round.participatingNodes.forEach(nodeId => {
        const node = this.nodes.get(nodeId);
        if (node) {
          node.status = 'online';
          this.nodes.set(nodeId, node);
        }
      });

      this.rounds.set(round.id, round);
      this.models.set(model.id, model);
      this.saveToStorage();
    }
  }

  private generateMockWeights(): any {
    // Generate mock model weights for simulation
    return {
      layers: [
        { weights: Array(100).fill(0).map(() => Math.random() - 0.5) },
        { weights: Array(50).fill(0).map(() => Math.random() - 0.5) },
        { weights: Array(10).fill(0).map(() => Math.random() - 0.5) }
      ],
      timestamp: new Date().toISOString()
    };
  }

  private aggregateWeights(nodeUpdates: FederatedNodeUpdate[]): any {
    // Simulate FedAvg aggregation
    const totalSamples = nodeUpdates.reduce((sum, update) => 
      sum + update.trainingMetrics.samples, 0);
    
    // Weighted average based on number of samples
    const aggregatedWeights = {
      layers: nodeUpdates[0].modelWeights.layers.map((layer: any, layerIndex: number) => ({
        weights: layer.weights.map((weight: number, weightIndex: number) => {
          const weightedSum = nodeUpdates.reduce((sum, update) => {
            const nodeWeight = update.modelWeights.layers[layerIndex].weights[weightIndex];
            const sampleWeight = update.trainingMetrics.samples / totalSamples;
            return sum + nodeWeight * sampleWeight;
          }, 0);
          return weightedSum;
        })
      })),
      timestamp: new Date().toISOString(),
      aggregationMethod: 'fedavg',
      participatingNodes: nodeUpdates.length
    };

    return aggregatedWeights;
  }

  // Dataset Management
  async createFederatedDataset(datasetData: Omit<FederatedDataset, 'id' | 'createdAt' | 'updatedAt'>): Promise<FederatedDataset> {
    const datasetId = uuidv4();
    const dataset: FederatedDataset = {
      ...datasetData,
      id: datasetId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.datasets.set(datasetId, dataset);
    this.saveToStorage();
    return dataset;
  }

  async getFederatedDataset(datasetId: string): Promise<FederatedDataset | null> {
    return this.datasets.get(datasetId) || null;
  }

  async getAllFederatedDatasets(): Promise<FederatedDataset[]> {
    return Array.from(this.datasets.values());
  }

  // Analytics
  async getFederatedAnalytics(): Promise<FederatedAnalytics> {
    const nodes = Array.from(this.nodes.values());
    const models = Array.from(this.models.values());
    const rounds = Array.from(this.rounds.values());

    const activeNodes = nodes.filter(node => 
      node.status === 'online' || node.status === 'training' || node.status === 'syncing'
    ).length;

    const activeTraining = models.filter(model => 
      model.training.status === 'training' || model.training.status === 'aggregating'
    ).length;

    const nodesByRegion = nodes.reduce((acc, node) => {
      const region = node.location.continent;
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const modelsByType = models.reduce((acc, model) => {
      acc[model.type] = (acc[model.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const globalMetrics = {
      averageAccuracy: models.length > 0 ? 
        models.reduce((sum, model) => sum + model.performance.globalAccuracy, 0) / models.length : 0,
      totalCommunicationCost: models.reduce((sum, model) => sum + model.performance.communicationCost, 0),
      energyEfficiency: models.length > 0 ? 
        models.reduce((sum, model) => sum + (1 / Math.max(1, model.performance.energyConsumption)), 0) / models.length : 0,
      privacyPreservation: models.filter(model => 
        model.privacy.differentialPrivacy.enabled || 
        model.privacy.homomorphicEncryption.enabled
      ).length / Math.max(1, models.length)
    };

    // Generate performance trends (last 30 days)
    const performanceTrends = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      
      return {
        date,
        accuracy: 0.7 + Math.random() * 0.2 + i * 0.005, // Improving trend
        communicationCost: 100 - i * 2 + Math.random() * 10, // Decreasing trend
        participationRate: 0.6 + Math.random() * 0.3 + i * 0.01 // Improving trend
      };
    });

    return {
      totalNodes: nodes.length,
      activeNodes,
      totalModels: models.length,
      activeTraining,
      globalMetrics,
      nodesByRegion,
      modelsByType,
      performanceTrends
    };
  }

  // Round Management
  async getRound(roundId: string): Promise<FederatedRound | null> {
    return this.rounds.get(roundId) || null;
  }

  async getRoundsByModel(modelId: string): Promise<FederatedRound[]> {
    return Array.from(this.rounds.values()).filter(round => round.modelId === modelId);
  }

  // Utility Methods
  private initializeGlobalNodes(): void {
    if (this.nodes.size > 0) return;

    const globalNodes = [
      {
        name: 'US East Research Lab',
        location: {
          city: 'Boston',
          country: 'United States',
          continent: 'North America',
          coordinates: { lat: 42.3601, lng: -71.0589 }
        },
        status: 'online' as const,
        capabilities: {
          computePower: 15.5, // TFLOPS
          memory: 64, // GB
          storage: 1000, // GB
          bandwidth: 1000, // Mbps
          gpuCount: 4,
          gpuType: 'NVIDIA A100'
        },
        privacy: {
          differentialPrivacy: true,
          homomorphicEncryption: true,
          secureAggregation: true,
          dataLocality: true
        }
      },
      {
        name: 'EU Central Computing Hub',
        location: {
          city: 'Munich',
          country: 'Germany',
          continent: 'Europe',
          coordinates: { lat: 48.1351, lng: 11.5820 }
        },
        status: 'online' as const,
        capabilities: {
          computePower: 12.8,
          memory: 48,
          storage: 800,
          bandwidth: 800,
          gpuCount: 3,
          gpuType: 'NVIDIA V100'
        },
        privacy: {
          differentialPrivacy: true,
          homomorphicEncryption: false,
          secureAggregation: true,
          dataLocality: true
        }
      },
      {
        name: 'Asia Pacific AI Center',
        location: {
          city: 'Singapore',
          country: 'Singapore',
          continent: 'Asia',
          coordinates: { lat: 1.3521, lng: 103.8198 }
        },
        status: 'online' as const,
        capabilities: {
          computePower: 18.2,
          memory: 96,
          storage: 1500,
          bandwidth: 1200,
          gpuCount: 6,
          gpuType: 'NVIDIA H100'
        },
        privacy: {
          differentialPrivacy: true,
          homomorphicEncryption: true,
          secureAggregation: true,
          dataLocality: false
        }
      },
      {
        name: 'Canada ML Research',
        location: {
          city: 'Toronto',
          country: 'Canada',
          continent: 'North America',
          coordinates: { lat: 43.6532, lng: -79.3832 }
        },
        status: 'online' as const,
        capabilities: {
          computePower: 10.5,
          memory: 32,
          storage: 600,
          bandwidth: 500,
          gpuCount: 2,
          gpuType: 'NVIDIA RTX 4090'
        },
        privacy: {
          differentialPrivacy: false,
          homomorphicEncryption: false,
          secureAggregation: true,
          dataLocality: true
        }
      },
      {
        name: 'Australia Edge Node',
        location: {
          city: 'Sydney',
          country: 'Australia',
          continent: 'Oceania',
          coordinates: { lat: -33.8688, lng: 151.2093 }
        },
        status: 'online' as const,
        capabilities: {
          computePower: 8.3,
          memory: 24,
          storage: 400,
          bandwidth: 300,
          gpuCount: 1,
          gpuType: 'NVIDIA RTX 3080'
        },
        privacy: {
          differentialPrivacy: false,
          homomorphicEncryption: false,
          secureAggregation: false,
          dataLocality: true
        }
      }
    ];

    globalNodes.forEach(async (nodeData) => {
      await this.registerNode(nodeData);
    });
  }

  private startFederatedCoordinator(): void {
    // Simulate node status updates
    setInterval(() => {
      this.nodes.forEach((node, nodeId) => {
        // Simulate occasional node disconnections
        if (Math.random() < 0.05 && node.status === 'online') {
          node.status = 'offline';
        } else if (Math.random() < 0.1 && node.status === 'offline') {
          node.status = 'online';
        }

        // Update last seen
        if (node.status !== 'offline') {
          node.lastSeen = new Date();
        }

        // Simulate capability fluctuations
        node.capabilities.bandwidth += (Math.random() - 0.5) * 100;
        node.capabilities.bandwidth = Math.max(10, node.capabilities.bandwidth);

        this.nodes.set(nodeId, node);
      });

      this.saveToStorage();
    }, 30000); // Update every 30 seconds
  }

  private saveToStorage(): void {
    try {
      const data = {
        nodes: Array.from(this.nodes.entries()),
        models: Array.from(this.models.entries()),
        rounds: Array.from(this.rounds.entries()),
        datasets: Array.from(this.datasets.entries()),
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save federated learning data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        
        this.nodes = new Map(parsed.nodes || []);
        this.models = new Map(parsed.models || []);
        this.rounds = new Map(parsed.rounds || []);
        this.datasets = new Map(parsed.datasets || []);

        // Convert date strings back to Date objects
        this.nodes.forEach(node => {
          node.createdAt = new Date(node.createdAt);
          node.lastSeen = new Date(node.lastSeen);
        });

        this.models.forEach(model => {
          model.createdAt = new Date(model.createdAt);
          model.updatedAt = new Date(model.updatedAt);
        });

        this.rounds.forEach(round => {
          round.startTime = new Date(round.startTime);
          if (round.endTime) {
            round.endTime = new Date(round.endTime);
          }
          round.nodeUpdates.forEach(update => {
            update.uploadTime = new Date(update.uploadTime);
          });
        });

        this.datasets.forEach(dataset => {
          dataset.createdAt = new Date(dataset.createdAt);
          dataset.updatedAt = new Date(dataset.updatedAt);
        });
      }
    } catch (error) {
      console.warn('Failed to load federated learning data:', error);
    }
  }

  // Public utility methods
  clearAllData(): void {
    this.nodes.clear();
    this.models.clear();
    this.rounds.clear();
    this.datasets.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    this.initializeGlobalNodes();
  }

  getNodeCount(): number {
    return this.nodes.size;
  }

  getModelCount(): number {
    return this.models.size;
  }

  getActiveTrainingCount(): number {
    return Array.from(this.models.values()).filter(
      model => model.training.status === 'training' || model.training.status === 'aggregating'
    ).length;
  }

  async getFederatedMetrics(): Promise<{
    totalNodes: number;
    activeNodes: number;
    totalModels: number;
    activeTraining: number;
    averageAccuracy: number;
    totalCommunicationCost: number;
  }> {
    const analytics = await this.getFederatedAnalytics();
    
    return {
      totalNodes: analytics.totalNodes,
      activeNodes: analytics.activeNodes,
      totalModels: analytics.totalModels,
      activeTraining: analytics.activeTraining,
      averageAccuracy: analytics.globalMetrics.averageAccuracy,
      totalCommunicationCost: analytics.globalMetrics.totalCommunicationCost
    };
  }
}

// Singleton instance
export const federatedLearningService = new FederatedLearningService();

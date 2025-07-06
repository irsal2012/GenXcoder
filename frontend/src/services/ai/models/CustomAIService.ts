import * as tf from '@tensorflow/tfjs';
import { v4 as uuidv4 } from 'uuid';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  type: 'text-generation' | 'classification' | 'sentiment' | 'custom';
  status: 'training' | 'ready' | 'error' | 'deploying';
  version: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  config: ModelConfig;
  metrics: ModelMetrics;
  deployment: ModelDeployment;
}

export interface ModelConfig {
  architecture: 'transformer' | 'lstm' | 'cnn' | 'custom';
  layers: LayerConfig[];
  hyperparameters: {
    learningRate: number;
    batchSize: number;
    epochs: number;
    optimizer: 'adam' | 'sgd' | 'rmsprop';
    lossFunction: string;
    metrics: string[];
  };
  preprocessing: {
    tokenization: 'word' | 'subword' | 'character';
    maxSequenceLength: number;
    vocabularySize: number;
    normalization: boolean;
  };
  training: {
    validationSplit: number;
    earlyStopping: boolean;
    patience: number;
    monitorMetric: string;
  };
}

export interface LayerConfig {
  type: 'dense' | 'lstm' | 'gru' | 'embedding' | 'dropout' | 'attention';
  units?: number;
  activation?: string;
  dropout?: number;
  returnSequences?: boolean;
  config?: Record<string, any>;
}

export interface ModelMetrics {
  accuracy: number;
  loss: number;
  valAccuracy: number;
  valLoss: number;
  trainingTime: number;
  inferenceTime: number;
  modelSize: number;
  parameters: number;
  history: TrainingHistory[];
}

export interface TrainingHistory {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss: number;
  valAccuracy: number;
  timestamp: Date;
}

export interface ModelDeployment {
  endpoint: string;
  status: 'active' | 'inactive' | 'scaling';
  instances: number;
  requestsPerSecond: number;
  averageLatency: number;
  errorRate: number;
  lastDeployed: Date;
  environment: 'development' | 'staging' | 'production';
}

export interface TrainingData {
  id: string;
  name: string;
  type: 'text' | 'structured' | 'mixed';
  size: number;
  samples: number;
  features: string[];
  labels: string[];
  split: {
    train: number;
    validation: number;
    test: number;
  };
  preprocessing: {
    cleaned: boolean;
    normalized: boolean;
    augmented: boolean;
  };
  createdAt: Date;
}

export interface PredictionRequest {
  modelId: string;
  input: any;
  options?: {
    temperature?: number;
    maxTokens?: number;
    topK?: number;
    topP?: number;
  };
}

export interface PredictionResponse {
  id: string;
  modelId: string;
  input: any;
  output: any;
  confidence: number;
  latency: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ModelTrainingJob {
  id: string;
  modelId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentEpoch: number;
  totalEpochs: number;
  currentLoss: number;
  currentAccuracy: number;
  estimatedTimeRemaining: number;
  startedAt: Date;
  completedAt?: Date;
  logs: TrainingLog[];
  error?: string;
}

export interface TrainingLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  data?: any;
}

export class CustomAIService {
  private models: Map<string, AIModel> = new Map();
  private trainingData: Map<string, TrainingData> = new Map();
  private trainingJobs: Map<string, ModelTrainingJob> = new Map();
  private predictions: Map<string, PredictionResponse> = new Map();
  private readonly STORAGE_KEY = 'genxcoder-custom-ai';

  constructor() {
    this.loadFromStorage();
    this.initializeTensorFlow();
  }

  // Model Management
  async createModel(
    tenantId: string,
    name: string,
    description: string,
    type: AIModel['type'],
    config: Partial<ModelConfig>
  ): Promise<AIModel> {
    const modelId = uuidv4();
    
    const model: AIModel = {
      id: modelId,
      name,
      description,
      type,
      status: 'training',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      tenantId,
      config: this.getDefaultConfig(type, config),
      metrics: this.getDefaultMetrics(),
      deployment: this.getDefaultDeployment()
    };

    this.models.set(modelId, model);
    this.saveToStorage();
    return model;
  }

  async getModel(modelId: string): Promise<AIModel | null> {
    return this.models.get(modelId) || null;
  }

  async getTenantModels(tenantId: string): Promise<AIModel[]> {
    return Array.from(this.models.values()).filter(model => model.tenantId === tenantId);
  }

  async updateModel(modelId: string, updates: Partial<AIModel>): Promise<AIModel | null> {
    const model = this.models.get(modelId);
    if (!model) return null;

    const updatedModel = {
      ...model,
      ...updates,
      updatedAt: new Date()
    };

    this.models.set(modelId, updatedModel);
    this.saveToStorage();
    return updatedModel;
  }

  async deleteModel(modelId: string): Promise<boolean> {
    const deleted = this.models.delete(modelId);
    
    // Clean up related data
    for (const [jobId, job] of this.trainingJobs.entries()) {
      if (job.modelId === modelId) {
        this.trainingJobs.delete(jobId);
      }
    }

    this.saveToStorage();
    return deleted;
  }

  // Training Data Management
  async uploadTrainingData(
    name: string,
    type: TrainingData['type'],
    data: any[],
    features: string[],
    labels: string[]
  ): Promise<TrainingData> {
    const dataId = uuidv4();
    
    const trainingData: TrainingData = {
      id: dataId,
      name,
      type,
      size: JSON.stringify(data).length,
      samples: data.length,
      features,
      labels,
      split: {
        train: 0.8,
        validation: 0.1,
        test: 0.1
      },
      preprocessing: {
        cleaned: false,
        normalized: false,
        augmented: false
      },
      createdAt: new Date()
    };

    this.trainingData.set(dataId, trainingData);
    this.saveToStorage();
    return trainingData;
  }

  async getTrainingData(dataId: string): Promise<TrainingData | null> {
    return this.trainingData.get(dataId) || null;
  }

  async getAllTrainingData(): Promise<TrainingData[]> {
    return Array.from(this.trainingData.values());
  }

  // Model Training
  async trainModel(
    modelId: string,
    trainingDataId: string,
    options?: {
      epochs?: number;
      batchSize?: number;
      learningRate?: number;
    }
  ): Promise<ModelTrainingJob> {
    const model = await this.getModel(modelId);
    const data = await this.getTrainingData(trainingDataId);
    
    if (!model || !data) {
      throw new Error('Model or training data not found');
    }

    const jobId = uuidv4();
    const job: ModelTrainingJob = {
      id: jobId,
      modelId,
      status: 'queued',
      progress: 0,
      currentEpoch: 0,
      totalEpochs: options?.epochs || model.config.hyperparameters.epochs,
      currentLoss: 0,
      currentAccuracy: 0,
      estimatedTimeRemaining: 0,
      startedAt: new Date(),
      logs: []
    };

    this.trainingJobs.set(jobId, job);
    
    // Start training asynchronously
    this.startTraining(job, model, data, options);
    
    return job;
  }

  private async startTraining(
    job: ModelTrainingJob,
    model: AIModel,
    data: TrainingData,
    options?: any
  ): Promise<void> {
    try {
      job.status = 'running';
      this.addTrainingLog(job, 'info', 'Starting model training');

      // Create TensorFlow model
      const tfModel = await this.createTensorFlowModel(model.config);
      
      // Prepare training data (mock implementation)
      const { trainX, trainY, valX, valY } = await this.prepareTrainingData(data);
      
      // Configure training
      const config = {
        epochs: options?.epochs || model.config.hyperparameters.epochs,
        batchSize: options?.batchSize || model.config.hyperparameters.batchSize,
        validationData: [valX, valY] as [tf.Tensor, tf.Tensor],
        callbacks: {
          onEpochEnd: (epoch: number, logs: any) => {
            job.currentEpoch = epoch + 1;
            job.currentLoss = logs.loss;
            job.currentAccuracy = logs.acc || logs.accuracy || 0;
            job.progress = ((epoch + 1) / job.totalEpochs) * 100;
            
            const remainingEpochs = job.totalEpochs - (epoch + 1);
            const avgTimePerEpoch = (Date.now() - job.startedAt.getTime()) / (epoch + 1);
            job.estimatedTimeRemaining = remainingEpochs * avgTimePerEpoch;

            this.addTrainingLog(job, 'info', `Epoch ${epoch + 1}/${job.totalEpochs} - Loss: ${logs.loss.toFixed(4)}, Accuracy: ${(logs.acc || logs.accuracy || 0).toFixed(4)}`);
            
            // Update model metrics
            model.metrics.history.push({
              epoch: epoch + 1,
              loss: logs.loss,
              accuracy: logs.acc || logs.accuracy || 0,
              valLoss: logs.val_loss || 0,
              valAccuracy: logs.val_acc || logs.val_accuracy || 0,
              timestamp: new Date()
            });
          }
        }
      };

      // Train the model
      await tfModel.fit(trainX, trainY, config);

      // Update model status and metrics
      model.status = 'ready';
      model.metrics.accuracy = job.currentAccuracy;
      model.metrics.loss = job.currentLoss;
      model.metrics.trainingTime = Date.now() - job.startedAt.getTime();
      model.metrics.parameters = tfModel.countParams();

      job.status = 'completed';
      job.completedAt = new Date();
      job.progress = 100;

      this.addTrainingLog(job, 'info', 'Model training completed successfully');

      // Save the trained model (in a real implementation, you'd save to a model store)
      await this.saveTrainedModel(model.id, tfModel);

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      model.status = 'error';
      
      this.addTrainingLog(job, 'error', `Training failed: ${job.error}`);
    }

    this.saveToStorage();
  }

  private async createTensorFlowModel(config: ModelConfig): Promise<tf.LayersModel> {
    const model = tf.sequential();

    for (const layerConfig of config.layers) {
      switch (layerConfig.type) {
        case 'dense':
          model.add(tf.layers.dense({
            units: layerConfig.units || 128,
            ...(layerConfig.activation && { activation: layerConfig.activation as any }),
            ...layerConfig.config
          }));
          break;
        case 'lstm':
          model.add(tf.layers.lstm({
            units: layerConfig.units || 128,
            returnSequences: layerConfig.returnSequences || false,
            ...layerConfig.config
          }));
          break;
        case 'embedding':
          model.add(tf.layers.embedding({
            inputDim: config.preprocessing.vocabularySize,
            outputDim: layerConfig.units || 128,
            inputLength: config.preprocessing.maxSequenceLength,
            ...layerConfig.config
          }));
          break;
        case 'dropout':
          model.add(tf.layers.dropout({
            rate: layerConfig.dropout || 0.2,
            ...layerConfig.config
          }));
          break;
      }
    }

    // Compile the model
    model.compile({
      optimizer: config.hyperparameters.optimizer,
      loss: config.hyperparameters.lossFunction,
      metrics: config.hyperparameters.metrics
    });

    return model;
  }

  private async prepareTrainingData(data: TrainingData): Promise<{
    trainX: tf.Tensor;
    trainY: tf.Tensor;
    valX: tf.Tensor;
    valY: tf.Tensor;
  }> {
    // Mock implementation - in reality, you'd process the actual data
    const sampleSize = 1000;
    const featureSize = 100;
    
    const trainSize = Math.floor(sampleSize * data.split.train);
    const valSize = Math.floor(sampleSize * data.split.validation);

    const trainX = tf.randomNormal([trainSize, featureSize]);
    const trainY = tf.randomUniform([trainSize, 1], 0, 2, 'int32');
    const valX = tf.randomNormal([valSize, featureSize]);
    const valY = tf.randomUniform([valSize, 1], 0, 2, 'int32');

    return { trainX, trainY, valX, valY };
  }

  private async saveTrainedModel(modelId: string, tfModel: tf.LayersModel): Promise<void> {
    // In a real implementation, you'd save to IndexedDB or send to a server
    try {
      await tfModel.save(`localstorage://model-${modelId}`);
    } catch (error) {
      console.warn('Failed to save trained model:', error);
    }
  }

  private async loadTrainedModel(modelId: string): Promise<tf.LayersModel | null> {
    try {
      return await tf.loadLayersModel(`localstorage://model-${modelId}`);
    } catch (error) {
      console.warn('Failed to load trained model:', error);
      return null;
    }
  }

  // Model Inference
  async predict(request: PredictionRequest): Promise<PredictionResponse> {
    const model = await this.getModel(request.modelId);
    if (!model || model.status !== 'ready') {
      throw new Error('Model not found or not ready');
    }

    const startTime = Date.now();
    
    try {
      // Load the trained model
      const tfModel = await this.loadTrainedModel(request.modelId);
      if (!tfModel) {
        throw new Error('Trained model not found');
      }

      // Preprocess input
      const processedInput = await this.preprocessInput(request.input, model.config);
      
      // Make prediction
      const prediction = tfModel.predict(processedInput) as tf.Tensor;
      const output = await prediction.data();
      
      // Calculate confidence (mock implementation)
      const confidence = Math.max(...Array.from(output));
      
      const response: PredictionResponse = {
        id: uuidv4(),
        modelId: request.modelId,
        input: request.input,
        output: Array.from(output),
        confidence,
        latency: Date.now() - startTime,
        timestamp: new Date()
      };

      this.predictions.set(response.id, response);
      
      // Update model metrics
      model.metrics.inferenceTime = (model.metrics.inferenceTime + response.latency) / 2;
      model.deployment.requestsPerSecond += 1;
      model.deployment.averageLatency = (model.deployment.averageLatency + response.latency) / 2;

      this.saveToStorage();
      return response;

    } catch (error) {
      throw new Error(`Prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async preprocessInput(input: any, config: ModelConfig): Promise<tf.Tensor> {
    // Mock preprocessing - in reality, you'd implement proper tokenization and normalization
    if (typeof input === 'string') {
      // Text preprocessing
      const tokens = input.toLowerCase().split(' ').slice(0, config.preprocessing.maxSequenceLength);
      const paddedTokens = [...tokens, ...Array(config.preprocessing.maxSequenceLength - tokens.length).fill(0)];
      return tf.tensor2d([paddedTokens.map((_, i) => i)]);
    } else if (Array.isArray(input)) {
      // Structured data preprocessing
      return tf.tensor2d([input]);
    } else {
      throw new Error('Unsupported input type');
    }
  }

  // Model Deployment
  async deployModel(modelId: string, environment: ModelDeployment['environment']): Promise<boolean> {
    const model = await this.getModel(modelId);
    if (!model || model.status !== 'ready') {
      return false;
    }

    model.status = 'deploying';
    model.deployment.status = 'active';
    model.deployment.environment = environment;
    model.deployment.lastDeployed = new Date();
    model.deployment.endpoint = `https://api.genxcoder.com/models/${modelId}/predict`;

    // Simulate deployment process
    await new Promise(resolve => setTimeout(resolve, 2000));

    model.status = 'ready';
    this.saveToStorage();
    return true;
  }

  async undeployModel(modelId: string): Promise<boolean> {
    const model = await this.getModel(modelId);
    if (!model) return false;

    model.deployment.status = 'inactive';
    this.saveToStorage();
    return true;
  }

  // Training Job Management
  async getTrainingJob(jobId: string): Promise<ModelTrainingJob | null> {
    return this.trainingJobs.get(jobId) || null;
  }

  async getModelTrainingJobs(modelId: string): Promise<ModelTrainingJob[]> {
    return Array.from(this.trainingJobs.values()).filter(job => job.modelId === modelId);
  }

  async cancelTrainingJob(jobId: string): Promise<boolean> {
    const job = this.trainingJobs.get(jobId);
    if (!job || job.status !== 'running') return false;

    job.status = 'cancelled';
    this.addTrainingLog(job, 'info', 'Training job cancelled by user');
    this.saveToStorage();
    return true;
  }

  private addTrainingLog(job: ModelTrainingJob, level: TrainingLog['level'], message: string, data?: any): void {
    job.logs.push({
      timestamp: new Date(),
      level,
      message,
      data
    });
  }

  // Analytics and Monitoring
  async getModelAnalytics(modelId: string): Promise<{
    predictions: number;
    averageLatency: number;
    errorRate: number;
    usage: Array<{ date: string; requests: number }>;
  }> {
    const modelPredictions = Array.from(this.predictions.values())
      .filter(p => p.modelId === modelId);

    const usage = this.calculateUsageByDate(modelPredictions);
    
    return {
      predictions: modelPredictions.length,
      averageLatency: modelPredictions.reduce((sum, p) => sum + p.latency, 0) / modelPredictions.length || 0,
      errorRate: 0, // Mock value
      usage
    };
  }

  private calculateUsageByDate(predictions: PredictionResponse[]): Array<{ date: string; requests: number }> {
    const usage = new Map<string, number>();
    
    predictions.forEach(prediction => {
      const date = prediction.timestamp.toISOString().split('T')[0];
      usage.set(date, (usage.get(date) || 0) + 1);
    });

    return Array.from(usage.entries()).map(([date, requests]) => ({ date, requests }));
  }

  // Utility Methods
  private async initializeTensorFlow(): Promise<void> {
    try {
      await tf.ready();
      console.log('TensorFlow.js initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TensorFlow.js:', error);
    }
  }

  private getDefaultConfig(type: AIModel['type'], config: Partial<ModelConfig>): ModelConfig {
    const baseConfig: ModelConfig = {
      architecture: 'transformer',
      layers: [
        { type: 'embedding', units: 128 },
        { type: 'lstm', units: 128, returnSequences: true },
        { type: 'dropout', dropout: 0.2 },
        { type: 'dense', units: 64, activation: 'relu' },
        { type: 'dense', units: 1, activation: 'sigmoid' }
      ],
      hyperparameters: {
        learningRate: 0.001,
        batchSize: 32,
        epochs: 10,
        optimizer: 'adam',
        lossFunction: 'binaryCrossentropy',
        metrics: ['accuracy']
      },
      preprocessing: {
        tokenization: 'word',
        maxSequenceLength: 100,
        vocabularySize: 10000,
        normalization: true
      },
      training: {
        validationSplit: 0.2,
        earlyStopping: true,
        patience: 3,
        monitorMetric: 'val_loss'
      }
    };

    return { ...baseConfig, ...config };
  }

  private getDefaultMetrics(): ModelMetrics {
    return {
      accuracy: 0,
      loss: 0,
      valAccuracy: 0,
      valLoss: 0,
      trainingTime: 0,
      inferenceTime: 0,
      modelSize: 0,
      parameters: 0,
      history: []
    };
  }

  private getDefaultDeployment(): ModelDeployment {
    return {
      endpoint: '',
      status: 'inactive',
      instances: 1,
      requestsPerSecond: 0,
      averageLatency: 0,
      errorRate: 0,
      lastDeployed: new Date(),
      environment: 'development'
    };
  }

  private saveToStorage(): void {
    try {
      const data = {
        models: Array.from(this.models.entries()),
        trainingData: Array.from(this.trainingData.entries()),
        trainingJobs: Array.from(this.trainingJobs.entries()),
        predictions: Array.from(this.predictions.entries()).slice(-1000), // Keep last 1000
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save custom AI data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        
        this.models = new Map(parsed.models || []);
        this.trainingData = new Map(parsed.trainingData || []);
        this.trainingJobs = new Map(parsed.trainingJobs || []);
        this.predictions = new Map(parsed.predictions || []);

        // Convert date strings back to Date objects
        this.models.forEach(model => {
          model.createdAt = new Date(model.createdAt);
          model.updatedAt = new Date(model.updatedAt);
          model.deployment.lastDeployed = new Date(model.deployment.lastDeployed);
          model.metrics.history.forEach(h => {
            h.timestamp = new Date(h.timestamp);
          });
        });

        this.trainingData.forEach(data => {
          data.createdAt = new Date(data.createdAt);
        });

        this.trainingJobs.forEach(job => {
          job.startedAt = new Date(job.startedAt);
          if (job.completedAt) {
            job.completedAt = new Date(job.completedAt);
          }
          job.logs.forEach(log => {
            log.timestamp = new Date(log.timestamp);
          });
        });

        this.predictions.forEach(prediction => {
          prediction.timestamp = new Date(prediction.timestamp);
        });
      }
    } catch (error) {
      console.warn('Failed to load custom AI data:', error);
    }
  }

  // Public utility methods
  clearAllData(): void {
    this.models.clear();
    this.trainingData.clear();
    this.trainingJobs.clear();
    this.predictions.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }

  getModelCount(): number {
    return this.models.size;
  }

  getTotalPredictions(): number {
    return this.predictions.size;
  }
}

// Singleton instance
export const customAIService = new CustomAIService();

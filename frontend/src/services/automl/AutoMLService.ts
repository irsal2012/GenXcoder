import { v4 as uuidv4 } from 'uuid';
import * as tf from '@tensorflow/tfjs';

export interface AutoMLExperiment {
  id: string;
  name: string;
  description: string;
  type: 'classification' | 'regression' | 'time_series' | 'nlp' | 'computer_vision' | 'tabular';
  dataset: {
    id: string;
    name: string;
    size: number;
    features: number;
    target: string;
    split: {
      train: number;
      validation: number;
      test: number;
    };
  };
  configuration: {
    objective: 'accuracy' | 'precision' | 'recall' | 'f1' | 'auc' | 'mse' | 'mae' | 'r2';
    timeLimit: number; // minutes
    trialLimit: number;
    earlyStoppingRounds: number;
    crossValidationFolds: number;
    ensembleSize: number;
  };
  searchSpace: {
    algorithms: string[];
    hyperparameters: Record<string, {
      type: 'categorical' | 'uniform' | 'loguniform' | 'choice' | 'randint';
      values?: any[];
      low?: number;
      high?: number;
    }>;
    preprocessing: {
      scaling: boolean;
      encoding: boolean;
      featureSelection: boolean;
      dimensionalityReduction: boolean;
    };
  };
  optimization: {
    strategy: 'random' | 'bayesian' | 'evolutionary' | 'hyperband' | 'optuna';
    parallelism: number;
    pruning: boolean;
    warmStart: boolean;
  };
  status: 'created' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    currentTrial: number;
    totalTrials: number;
    bestScore: number;
    elapsedTime: number;
    estimatedTimeRemaining: number;
  };
  results: {
    bestModel: AutoMLModel | null;
    leaderboard: AutoMLModel[];
    insights: AutoMLInsight[];
    featureImportance: Array<{ feature: string; importance: number }>;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface AutoMLModel {
  id: string;
  experimentId: string;
  trialNumber: number;
  algorithm: string;
  hyperparameters: Record<string, any>;
  preprocessing: {
    scaler?: string;
    encoder?: string;
    featureSelector?: string;
    dimensionalityReducer?: string;
  };
  performance: {
    trainScore: number;
    validationScore: number;
    testScore?: number;
    crossValidationScore: number;
    crossValidationStd: number;
  };
  metrics: Record<string, number>;
  training: {
    duration: number; // seconds
    epochs?: number;
    iterations?: number;
    convergence: boolean;
  };
  model: {
    serialized: any;
    size: number; // bytes
    complexity: number;
    interpretability: number; // 0-1 score
  };
  status: 'training' | 'completed' | 'failed' | 'pruned';
  createdAt: Date;
  completedAt?: Date;
}

export interface AutoMLInsight {
  id: string;
  type: 'data_quality' | 'feature_engineering' | 'model_selection' | 'hyperparameter' | 'performance';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  impact: number; // 0-1 score
  confidence: number; // 0-1 score
  evidence: any;
}

export interface AutoMLPipeline {
  id: string;
  name: string;
  description: string;
  stages: AutoMLStage[];
  configuration: {
    parallelExecution: boolean;
    caching: boolean;
    monitoring: boolean;
    autoRetry: boolean;
  };
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: {
    currentStage: number;
    totalStages: number;
    overallProgress: number;
  };
  results: {
    artifacts: Array<{
      name: string;
      type: string;
      path: string;
      size: number;
    }>;
    metrics: Record<string, number>;
    logs: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AutoMLStage {
  id: string;
  name: string;
  type: 'data_ingestion' | 'preprocessing' | 'feature_engineering' | 'model_training' | 'evaluation' | 'deployment';
  configuration: Record<string, any>;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  duration?: number;
  output?: any;
  error?: string;
}

export interface AutoMLTemplate {
  id: string;
  name: string;
  description: string;
  category: 'beginner' | 'intermediate' | 'advanced' | 'domain_specific';
  domain: 'general' | 'finance' | 'healthcare' | 'retail' | 'manufacturing' | 'marketing';
  configuration: Partial<AutoMLExperiment>;
  popularity: number;
  rating: number;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
}

export interface AutoMLAnalytics {
  totalExperiments: number;
  runningExperiments: number;
  completedExperiments: number;
  averageExperimentDuration: number;
  successRate: number;
  popularAlgorithms: Array<{ algorithm: string; usage: number; avgScore: number }>;
  performanceTrends: Array<{
    date: Date;
    avgScore: number;
    experimentCount: number;
    avgDuration: number;
  }>;
  resourceUtilization: {
    cpuUsage: number;
    memoryUsage: number;
    gpuUsage: number;
    storageUsage: number;
  };
}

export class AutoMLService {
  private experiments: Map<string, AutoMLExperiment> = new Map();
  private models: Map<string, AutoMLModel> = new Map();
  private pipelines: Map<string, AutoMLPipeline> = new Map();
  private templates: Map<string, AutoMLTemplate> = new Map();
  private readonly STORAGE_KEY = 'genxcoder-automl';

  constructor() {
    this.loadFromStorage();
    this.initializeTemplates();
    this.startAutoMLOrchestrator();
  }

  // Experiment Management
  async createExperiment(experimentData: Omit<AutoMLExperiment, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'progress' | 'results'>): Promise<AutoMLExperiment> {
    const experimentId = uuidv4();
    const experiment: AutoMLExperiment = {
      ...experimentData,
      id: experimentId,
      status: 'created',
      progress: {
        currentTrial: 0,
        totalTrials: experimentData.configuration.trialLimit,
        bestScore: 0,
        elapsedTime: 0,
        estimatedTimeRemaining: 0
      },
      results: {
        bestModel: null,
        leaderboard: [],
        insights: [],
        featureImportance: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.experiments.set(experimentId, experiment);
    this.saveToStorage();
    return experiment;
  }

  async getExperiment(experimentId: string): Promise<AutoMLExperiment | null> {
    return this.experiments.get(experimentId) || null;
  }

  async getAllExperiments(): Promise<AutoMLExperiment[]> {
    return Array.from(this.experiments.values());
  }

  async startExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    if (experiment.status !== 'created') {
      throw new Error('Experiment is not in created state');
    }

    experiment.status = 'running';
    experiment.updatedAt = new Date();
    this.experiments.set(experimentId, experiment);
    this.saveToStorage();

    // Start experiment execution
    this.executeExperiment(experiment);
  }

  private async executeExperiment(experiment: AutoMLExperiment): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Generate insights about the dataset
      experiment.results.insights = await this.generateDataInsights(experiment);
      
      // Execute trials
      for (let trial = 1; trial <= experiment.configuration.trialLimit; trial++) {
        if (experiment.status !== 'running') break;

        const model = await this.executeTrial(experiment, trial);
        experiment.results.leaderboard.push(model);
        
        // Update best model
        if (!experiment.results.bestModel || 
            model.performance.validationScore > experiment.results.bestModel.performance.validationScore) {
          experiment.results.bestModel = model;
          experiment.progress.bestScore = model.performance.validationScore;
        }

        // Update progress
        experiment.progress.currentTrial = trial;
        experiment.progress.elapsedTime = (Date.now() - startTime) / 1000;
        experiment.progress.estimatedTimeRemaining = 
          (experiment.progress.elapsedTime / trial) * (experiment.configuration.trialLimit - trial);

        // Sort leaderboard
        experiment.results.leaderboard.sort((a, b) => 
          b.performance.validationScore - a.performance.validationScore
        );

        // Keep only top models
        experiment.results.leaderboard = experiment.results.leaderboard.slice(0, 20);

        this.experiments.set(experiment.id, experiment);
        
        // Save progress every 5 trials
        if (trial % 5 === 0) {
          this.saveToStorage();
        }

        // Early stopping check
        if (this.shouldEarlyStop(experiment)) {
          break;
        }

        // Time limit check
        if (experiment.progress.elapsedTime > experiment.configuration.timeLimit * 60) {
          break;
        }
      }

      // Generate feature importance
      if (experiment.results.bestModel) {
        experiment.results.featureImportance = await this.calculateFeatureImportance(
          experiment, experiment.results.bestModel
        );
      }

      // Generate final insights
      experiment.results.insights.push(...await this.generateModelInsights(experiment));

      // Complete experiment
      experiment.status = 'completed';
      experiment.completedAt = new Date();
      experiment.updatedAt = new Date();

      this.experiments.set(experiment.id, experiment);
      this.saveToStorage();

    } catch (error) {
      experiment.status = 'failed';
      experiment.updatedAt = new Date();
      this.experiments.set(experiment.id, experiment);
      this.saveToStorage();
    }
  }

  private async executeTrial(experiment: AutoMLExperiment, trialNumber: number): Promise<AutoMLModel> {
    const modelId = uuidv4();
    
    // Select algorithm and hyperparameters
    const algorithm = this.selectAlgorithm(experiment);
    const hyperparameters = this.sampleHyperparameters(experiment, algorithm);
    const preprocessing = this.selectPreprocessing(experiment);

    const model: AutoMLModel = {
      id: modelId,
      experimentId: experiment.id,
      trialNumber,
      algorithm,
      hyperparameters,
      preprocessing,
      performance: {
        trainScore: 0,
        validationScore: 0,
        crossValidationScore: 0,
        crossValidationStd: 0
      },
      metrics: {},
      training: {
        duration: 0,
        convergence: false
      },
      model: {
        serialized: null,
        size: 0,
        complexity: 0,
        interpretability: 0
      },
      status: 'training',
      createdAt: new Date()
    };

    this.models.set(modelId, model);

    try {
      const trainingStartTime = Date.now();
      
      // Simulate model training
      await this.trainModel(model, experiment);
      
      model.training.duration = (Date.now() - trainingStartTime) / 1000;
      model.status = 'completed';
      model.completedAt = new Date();

    } catch (error) {
      model.status = 'failed';
    }

    this.models.set(modelId, model);
    return model;
  }

  private async trainModel(model: AutoMLModel, experiment: AutoMLExperiment): Promise<void> {
    // Simulate training time based on algorithm complexity
    const baseTime = this.getAlgorithmComplexity(model.algorithm) * 1000; // ms
    const trainingTime = baseTime + Math.random() * baseTime;
    
    await new Promise(resolve => setTimeout(resolve, trainingTime));

    // Simulate performance based on algorithm and hyperparameters
    const baseScore = this.getAlgorithmBaseScore(model.algorithm, experiment.type);
    const hyperparameterBonus = this.calculateHyperparameterBonus(model.hyperparameters);
    const noise = (Math.random() - 0.5) * 0.1; // ±5% noise

    model.performance.trainScore = Math.min(1.0, Math.max(0.0, baseScore + hyperparameterBonus + noise + 0.05));
    model.performance.validationScore = Math.min(1.0, Math.max(0.0, baseScore + hyperparameterBonus + noise));
    model.performance.crossValidationScore = model.performance.validationScore;
    model.performance.crossValidationStd = Math.random() * 0.05;

    // Generate additional metrics
    model.metrics = this.generateMetrics(model, experiment);

    // Simulate model properties
    model.model.size = Math.floor(Math.random() * 10000000) + 1000000; // 1-10MB
    model.model.complexity = Math.random();
    model.model.interpretability = this.getAlgorithmInterpretability(model.algorithm);
    model.training.convergence = Math.random() > 0.1; // 90% convergence rate
  }

  private selectAlgorithm(experiment: AutoMLExperiment): string {
    const algorithms = experiment.searchSpace.algorithms;
    return algorithms[Math.floor(Math.random() * algorithms.length)];
  }

  private sampleHyperparameters(experiment: AutoMLExperiment, algorithm: string): Record<string, any> {
    const hyperparameters: Record<string, any> = {};
    const searchSpace = experiment.searchSpace.hyperparameters;

    for (const [param, config] of Object.entries(searchSpace)) {
      switch (config.type) {
        case 'categorical':
        case 'choice':
          hyperparameters[param] = config.values![Math.floor(Math.random() * config.values!.length)];
          break;
        case 'uniform':
          hyperparameters[param] = config.low! + Math.random() * (config.high! - config.low!);
          break;
        case 'loguniform':
          const logLow = Math.log(config.low!);
          const logHigh = Math.log(config.high!);
          hyperparameters[param] = Math.exp(logLow + Math.random() * (logHigh - logLow));
          break;
        case 'randint':
          hyperparameters[param] = Math.floor(config.low! + Math.random() * (config.high! - config.low!));
          break;
      }
    }

    return hyperparameters;
  }

  private selectPreprocessing(experiment: AutoMLExperiment): AutoMLModel['preprocessing'] {
    const preprocessing: AutoMLModel['preprocessing'] = {};
    const config = experiment.searchSpace.preprocessing;

    if (config.scaling && Math.random() > 0.3) {
      preprocessing.scaler = ['StandardScaler', 'MinMaxScaler', 'RobustScaler'][Math.floor(Math.random() * 3)];
    }

    if (config.encoding && Math.random() > 0.3) {
      preprocessing.encoder = ['OneHotEncoder', 'LabelEncoder', 'TargetEncoder'][Math.floor(Math.random() * 3)];
    }

    if (config.featureSelection && Math.random() > 0.5) {
      preprocessing.featureSelector = ['SelectKBest', 'RFE', 'LASSO'][Math.floor(Math.random() * 3)];
    }

    if (config.dimensionalityReduction && Math.random() > 0.7) {
      preprocessing.dimensionalityReducer = ['PCA', 'LDA', 'UMAP'][Math.floor(Math.random() * 3)];
    }

    return preprocessing;
  }

  private getAlgorithmComplexity(algorithm: string): number {
    const complexities: Record<string, number> = {
      'LinearRegression': 1,
      'LogisticRegression': 1,
      'DecisionTree': 2,
      'RandomForest': 4,
      'GradientBoosting': 6,
      'XGBoost': 8,
      'LightGBM': 6,
      'SVM': 5,
      'NeuralNetwork': 10,
      'DeepLearning': 15
    };
    return complexities[algorithm] || 5;
  }

  private getAlgorithmBaseScore(algorithm: string, experimentType: string): number {
    const scores: Record<string, Record<string, number>> = {
      'classification': {
        'LogisticRegression': 0.75,
        'RandomForest': 0.82,
        'GradientBoosting': 0.85,
        'XGBoost': 0.87,
        'LightGBM': 0.86,
        'SVM': 0.80,
        'NeuralNetwork': 0.84,
        'DeepLearning': 0.88
      },
      'regression': {
        'LinearRegression': 0.70,
        'RandomForest': 0.78,
        'GradientBoosting': 0.82,
        'XGBoost': 0.84,
        'LightGBM': 0.83,
        'SVM': 0.76,
        'NeuralNetwork': 0.80,
        'DeepLearning': 0.85
      }
    };
    return scores[experimentType]?.[algorithm] || 0.75;
  }

  private getAlgorithmInterpretability(algorithm: string): number {
    const interpretability: Record<string, number> = {
      'LinearRegression': 0.95,
      'LogisticRegression': 0.90,
      'DecisionTree': 0.85,
      'RandomForest': 0.60,
      'GradientBoosting': 0.50,
      'XGBoost': 0.45,
      'LightGBM': 0.50,
      'SVM': 0.40,
      'NeuralNetwork': 0.20,
      'DeepLearning': 0.10
    };
    return interpretability[algorithm] || 0.50;
  }

  private calculateHyperparameterBonus(hyperparameters: Record<string, any>): number {
    // Simulate hyperparameter optimization effect
    return (Math.random() - 0.5) * 0.1; // ±5% effect
  }

  private generateMetrics(model: AutoMLModel, experiment: AutoMLExperiment): Record<string, number> {
    const metrics: Record<string, number> = {};
    const score = model.performance.validationScore;

    if (experiment.type === 'classification') {
      metrics.accuracy = score;
      metrics.precision = score + (Math.random() - 0.5) * 0.05;
      metrics.recall = score + (Math.random() - 0.5) * 0.05;
      metrics.f1_score = 2 * (metrics.precision * metrics.recall) / (metrics.precision + metrics.recall);
      metrics.auc = score + (Math.random() - 0.5) * 0.03;
    } else if (experiment.type === 'regression') {
      metrics.r2_score = score;
      metrics.mse = (1 - score) * 100;
      metrics.mae = Math.sqrt(metrics.mse) * 0.8;
      metrics.rmse = Math.sqrt(metrics.mse);
    }

    return metrics;
  }

  private shouldEarlyStop(experiment: AutoMLExperiment): boolean {
    if (experiment.progress.currentTrial < experiment.configuration.earlyStoppingRounds) {
      return false;
    }

    const recentModels = experiment.results.leaderboard
      .slice(-experiment.configuration.earlyStoppingRounds)
      .sort((a, b) => b.performance.validationScore - a.performance.validationScore);

    const bestRecentScore = recentModels[0]?.performance.validationScore || 0;
    const currentBestScore = experiment.progress.bestScore;

    // Stop if no improvement in recent trials
    return bestRecentScore <= currentBestScore;
  }

  private async generateDataInsights(experiment: AutoMLExperiment): Promise<AutoMLInsight[]> {
    const insights: AutoMLInsight[] = [];

    // Simulate data quality insights
    insights.push({
      id: uuidv4(),
      type: 'data_quality',
      severity: 'info',
      title: 'Dataset Size Analysis',
      description: `Dataset contains ${experiment.dataset.size.toLocaleString()} samples with ${experiment.dataset.features} features.`,
      recommendation: experiment.dataset.size < 1000 ? 
        'Consider collecting more data for better model performance.' :
        'Dataset size is adequate for training robust models.',
      impact: experiment.dataset.size < 1000 ? 0.8 : 0.3,
      confidence: 0.9,
      evidence: { sampleCount: experiment.dataset.size, featureCount: experiment.dataset.features }
    });

    // Feature engineering insight
    if (experiment.dataset.features > 100) {
      insights.push({
        id: uuidv4(),
        type: 'feature_engineering',
        severity: 'warning',
        title: 'High Dimensionality Detected',
        description: 'Dataset has a large number of features which may lead to overfitting.',
        recommendation: 'Consider enabling feature selection or dimensionality reduction.',
        impact: 0.6,
        confidence: 0.8,
        evidence: { featureCount: experiment.dataset.features }
      });
    }

    return insights;
  }

  private async generateModelInsights(experiment: AutoMLExperiment): Promise<AutoMLInsight[]> {
    const insights: AutoMLInsight[] = [];

    if (experiment.results.bestModel) {
      const bestModel = experiment.results.bestModel;
      
      // Performance insight
      insights.push({
        id: uuidv4(),
        type: 'performance',
        severity: bestModel.performance.validationScore > 0.9 ? 'info' : 'warning',
        title: 'Model Performance Analysis',
        description: `Best model achieved ${(bestModel.performance.validationScore * 100).toFixed(1)}% validation score using ${bestModel.algorithm}.`,
        recommendation: bestModel.performance.validationScore > 0.9 ? 
          'Excellent performance achieved. Consider deploying this model.' :
          'Performance could be improved. Try increasing trial limit or adjusting search space.',
        impact: 0.9,
        confidence: 0.95,
        evidence: { 
          algorithm: bestModel.algorithm,
          score: bestModel.performance.validationScore,
          trials: experiment.progress.currentTrial
        }
      });

      // Interpretability insight
      if (bestModel.model.interpretability < 0.5) {
        insights.push({
          id: uuidv4(),
          type: 'model_selection',
          severity: 'info',
          title: 'Model Interpretability',
          description: 'Selected model has low interpretability. Consider simpler models for better explainability.',
          recommendation: 'If interpretability is important, consider using Decision Trees or Linear models.',
          impact: 0.4,
          confidence: 0.7,
          evidence: { 
            interpretability: bestModel.model.interpretability,
            algorithm: bestModel.algorithm
          }
        });
      }
    }

    return insights;
  }

  private async calculateFeatureImportance(experiment: AutoMLExperiment, model: AutoMLModel): Promise<Array<{ feature: string; importance: number }>> {
    // Simulate feature importance calculation
    const features = Array.from({ length: experiment.dataset.features }, (_, i) => `feature_${i + 1}`);
    
    return features.map(feature => ({
      feature,
      importance: Math.random()
    })).sort((a, b) => b.importance - a.importance).slice(0, 20);
  }

  // Pipeline Management
  async createPipeline(pipelineData: Omit<AutoMLPipeline, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'progress' | 'results'>): Promise<AutoMLPipeline> {
    const pipelineId = uuidv4();
    const pipeline: AutoMLPipeline = {
      ...pipelineData,
      id: pipelineId,
      status: 'idle',
      progress: {
        currentStage: 0,
        totalStages: pipelineData.stages.length,
        overallProgress: 0
      },
      results: {
        artifacts: [],
        metrics: {},
        logs: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.pipelines.set(pipelineId, pipeline);
    this.saveToStorage();
    return pipeline;
  }

  async executePipeline(pipelineId: string): Promise<void> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    pipeline.status = 'running';
    pipeline.updatedAt = new Date();
    this.pipelines.set(pipelineId, pipeline);

    try {
      for (let i = 0; i < pipeline.stages.length; i++) {
        const stage = pipeline.stages[i];
        
        pipeline.progress.currentStage = i + 1;
        pipeline.progress.overallProgress = ((i + 1) / pipeline.stages.length) * 100;
        
        await this.executeStage(stage, pipeline);
        
        this.pipelines.set(pipelineId, pipeline);
      }

      pipeline.status = 'completed';
    } catch (error) {
      pipeline.status = 'failed';
    }

    pipeline.updatedAt = new Date();
    this.pipelines.set(pipelineId, pipeline);
    this.saveToStorage();
  }

  private async executeStage(stage: AutoMLStage, pipeline: AutoMLPipeline): Promise<void> {
    stage.status = 'running';
    const startTime = Date.now();

    try {
      // Simulate stage execution
      const executionTime = Math.random() * 5000 + 1000; // 1-6 seconds
      await new Promise(resolve => setTimeout(resolve, executionTime));

      stage.status = 'completed';
      stage.duration = (Date.now() - startTime) / 1000;
      stage.output = { success: true, timestamp: new Date() };

      pipeline.results.logs.push(`Stage ${stage.name} completed successfully in ${stage.duration.toFixed(2)}s`);

    } catch (error) {
      stage.status = 'failed';
      stage.error = error instanceof Error ? error.message : 'Unknown error';
      pipeline.results.logs.push(`Stage ${stage.name} failed: ${stage.error}`);
      throw error;
    }
  }

  // Template Management
  async getTemplates(): Promise<AutoMLTemplate[]> {
    return Array.from(this.templates.values());
  }

  async getTemplate(templateId: string): Promise<AutoMLTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async createExperimentFromTemplate(templateId: string, customization: Partial<AutoMLExperiment>): Promise<AutoMLExperiment> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Merge template configuration with customization
    const experimentData = {
      ...template.configuration,
      ...customization,
      name: customization.name || `${template.name} Experiment`,
      description: customization.description || template.description
    } as Omit<AutoMLExperiment, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'progress' | 'results'>;

    // Update template usage
    template.usageCount += 1;
    this.templates.set(templateId, template);

    return this.createExperiment(experimentData);
  }

  // Analytics
  async getAutoMLAnalytics(): Promise<AutoMLAnalytics> {
    const experiments = Array.from(this.experiments.values());
    const models = Array.from(this.models.values());

    const runningExperiments = experiments.filter(exp => exp.status === 'running').length;
    const completedExperiments = experiments.filter(exp => exp.status === 'completed').length;

    const completedExperimentDurations = experiments
      .filter(exp => exp.status === 'completed' && exp.completedAt)
      .map(exp => (exp.completedAt!.getTime() - exp.createdAt.getTime()) / 1000);

    const averageExperimentDuration = completedExperimentDurations.length > 0 ?
      completedExperimentDurations.reduce((sum, duration) => sum + duration, 0) / completedExperimentDurations.length : 0;

    const successRate = experiments.length > 0 ? completedExperiments / experiments.length : 0;

    // Algorithm popularity
    const algorithmStats = models.reduce((acc, model) => {
      if (!acc[model.algorithm]) {
        acc[model.algorithm] = { usage: 0, totalScore: 0 };
      }
      acc[model.algorithm].usage += 1;
      acc[model.algorithm].totalScore += model.performance.validationScore;
      return acc;
    }, {} as Record<string, { usage: number; totalScore: number }>);

    const popularAlgorithms = Object.entries(algorithmStats)
      .map(([algorithm, stats]) => ({
        algorithm,
        usage: stats.usage,
        avgScore: stats.totalScore / stats.usage
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);

    // Performance trends (last 30 days)
    const performanceTrends = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      
      return {
        date,
        avgScore: 0.75 + Math.random() * 0.15 + i * 0.003, // Improving trend
        experimentCount: Math.floor(Math.random() * 10) + 1,
        avgDuration: 300 + Math.random() * 600 // 5-15 minutes
      };
    });

    return {
      totalExperiments: experiments.length,
      runningExperiments,
      completedExperiments,
      averageExperimentDuration,
      successRate,
      popularAlgorithms,
      performanceTrends,
      resourceUtilization: {
        cpuUsage: 0.6 + Math.random() * 0.3,
        memoryUsage: 0.5 + Math.random() * 0.4,
        gpuUsage: 0.7 + Math.random() * 0.2,
        storageUsage: 0.4 + Math.random() * 0.3
      }
    };
  }

  // Utility Methods
  private initializeTemplates(): void {
    if (this.templates.size > 0) return;

    const templates: Omit<AutoMLTemplate, 'id'>[] = [
      {
        name: 'Binary Classification Starter',
        description: 'Quick setup for binary classification problems',
        category: 'beginner',
        domain: 'general',
        configuration: {
          type: 'classification',
          configuration: {
            objective: 'accuracy',
            timeLimit: 30,
            trialLimit: 50,
            earlyStoppingRounds: 10,
            crossValidationFolds: 5,
            ensembleSize: 3
          },
          searchSpace: {
            algorithms: ['LogisticRegression', 'RandomForest', 'XGBoost'],
            hyperparameters: {
              'n_estimators': { type: 'randint', low: 50, high: 200 },
              'max_depth': { type: 'randint', low: 3, high: 10 },
              'learning_rate': { type: 'loguniform', low: 0.01, high: 0.3 }
            },
            preprocessing: {
              scaling: true,
              encoding: true,
              featureSelection: false,
              dimensionalityReduction: false
            }
          },
          optimization: {
            strategy: 'random',
            parallelism: 2,
            pruning: false,
            warmStart: false
          }
        },
        popularity: 0.9,
        rating: 4.5,
        usageCount: 150,
        createdBy: 'AutoML Team',
        createdAt: new Date('2024-01-01')
      },
      {
        name: 'Advanced Regression',
        description: 'Comprehensive regression analysis with advanced algorithms',
        category: 'advanced',
        domain: 'general',
        configuration: {
          type: 'regression',
          configuration: {
            objective: 'r2',
            timeLimit: 120,
            trialLimit: 200,
            earlyStoppingRounds: 20,
            crossValidationFolds: 10,
            ensembleSize: 5
          },
          searchSpace: {
            algorithms: ['LinearRegression', 'RandomForest', 'GradientBoosting', 'XGBoost', 'LightGBM', 'NeuralNetwork'],
            hyperparameters: {
              'n_estimators': { type: 'randint', low: 100, high: 1000 },
              'max_depth': { type: 'randint', low: 3, high: 15 },
              'learning_rate': { type: 'loguniform', low: 0.001, high: 0.3 },
              'subsample': { type: 'uniform', low: 0.6, high: 1.0 }
            },
            preprocessing: {
              scaling: true,
              encoding: true,
              featureSelection: true,
              dimensionalityReduction: true
            }
          },
          optimization: {
            strategy: 'bayesian',
            parallelism: 4,
            pruning: true,
            warmStart: true
          }
        },
        popularity: 0.7,
        rating: 4.8,
        usageCount: 89,
        createdBy: 'AutoML Team',
        createdAt: new Date('2024-01-15')
      },
      {
        name: 'Financial Prediction',
        description: 'Specialized template for financial time series and risk modeling',
        category: 'domain_specific',
        domain: 'finance',
        configuration: {
          type: 'time_series',
          configuration: {
            objective: 'mae',
            timeLimit: 90,
            trialLimit: 100,
            earlyStoppingRounds: 15,
            crossValidationFolds: 5,
            ensembleSize: 4
          },
          searchSpace: {
            algorithms: ['RandomForest', 'GradientBoosting', 'XGBoost', 'LightGBM'],
            hyperparameters: {
              'n_estimators': { type: 'randint', low: 100, high: 500 },
              'max_depth': { type: 'randint', low: 4, high: 12 },
              'learning_rate': { type: 'loguniform', low: 0.01, high: 0.2 }
            },
            preprocessing: {
              scaling: true,
              encoding: false,
              featureSelection: true,
              dimensionalityReduction: false
            }
          },
          optimization: {
            strategy: 'bayesian',
            parallelism: 3,
            pruning: true,
            warmStart: true
          }
        },
        popularity: 0.6,
        rating: 4.3,
        usageCount: 45,
        createdBy: 'Finance Team',
        createdAt: new Date('2024-02-01')
      }
    ];

    templates.forEach(template => {
      const id = uuidv4();
      this.templates.set(id, { ...template, id });
    });
  }

  private startAutoMLOrchestrator(): void {
    // Monitor running experiments
    setInterval(() => {
      this.experiments.forEach((experiment, id) => {
        if (experiment.status === 'running') {
          // Update progress simulation
          experiment.progress.elapsedTime += 30; // 30 seconds
          experiment.updatedAt = new Date();
          this.experiments.set(id, experiment);
        }
      });
    }, 30000); // Update every 30 seconds
  }

  private saveToStorage(): void {
    try {
      const data = {
        experiments: Array.from(this.experiments.entries()),
        models: Array.from(this.models.entries()),
        pipelines: Array.from(this.pipelines.entries()),
        templates: Array.from(this.templates.entries()),
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save AutoML data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        
        this.experiments = new Map(parsed.experiments || []);
        this.models = new Map(parsed.models || []);
        this.pipelines = new Map(parsed.pipelines || []);
        this.templates = new Map(parsed.templates || []);

        // Convert date strings back to Date objects
        this.experiments.forEach(experiment => {
          experiment.createdAt = new Date(experiment.createdAt);
          experiment.updatedAt = new Date(experiment.updatedAt);
          if (experiment.completedAt) {
            experiment.completedAt = new Date(experiment.completedAt);
          }
        });

        this.models.forEach(model => {
          model.createdAt = new Date(model.createdAt);
          if (model.completedAt) {
            model.completedAt = new Date(model.completedAt);
          }
        });

        this.pipelines.forEach(pipeline => {
          pipeline.createdAt = new Date(pipeline.createdAt);
          pipeline.updatedAt = new Date(pipeline.updatedAt);
        });

        this.templates.forEach(template => {
          template.createdAt = new Date(template.createdAt);
        });
      }
    } catch (error) {
      console.warn('Failed to load AutoML data:', error);
    }
  }

  // Public utility methods
  clearAllData(): void {
    this.experiments.clear();
    this.models.clear();
    this.pipelines.clear();
    this.templates.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    this.initializeTemplates();
  }

  getExperimentCount(): number {
    return this.experiments.size;
  }

  getModelCount(): number {
    return this.models.size;
  }

  getRunningExperimentCount(): number {
    return Array.from(this.experiments.values()).filter(
      exp => exp.status === 'running'
    ).length;
  }

  async getAutoMLMetrics(): Promise<{
    totalExperiments: number;
    runningExperiments: number;
    completedExperiments: number;
    successRate: number;
    averageDuration: number;
  }> {
    const analytics = await this.getAutoMLAnalytics();
    
    return {
      totalExperiments: analytics.totalExperiments,
      runningExperiments: analytics.runningExperiments,
      completedExperiments: analytics.completedExperiments,
      successRate: analytics.successRate,
      averageDuration: analytics.averageExperimentDuration
    };
  }
}

// Singleton instance
export const autoMLService = new AutoMLService();

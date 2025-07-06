import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Plus,
  Play,
  Pause,
  Settings,
  TrendingUp,
  Database,
  Zap,
  Users,
  Globe,
  Shield,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Activity
} from 'lucide-react';
import { customAIService, AIModel, ModelTrainingJob, TrainingData } from '../services/ai/models/CustomAIService';
import { tenantService } from '../services/tenant/TenantService';

export const GlobalAIModels: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [trainingJobs, setTrainingJobs] = useState<ModelTrainingJob[]>([]);
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [activeTab, setActiveTab] = useState<'models' | 'training' | 'data' | 'analytics'>('models');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentTenant = tenantService.getCurrentTenant();
      if (currentTenant) {
        const tenantModels = await customAIService.getTenantModels(currentTenant.id);
        setModels(tenantModels);
        
        // Load training jobs for all models
        const allJobs: ModelTrainingJob[] = [];
        for (const model of tenantModels) {
          const jobs = await customAIService.getModelTrainingJobs(model.id);
          allJobs.push(...jobs);
        }
        setTrainingJobs(allJobs);
        
        const allData = await customAIService.getAllTrainingData();
        setTrainingData(allData);
      }
    } catch (error) {
      console.error('Failed to load AI models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateModel = async (formData: any) => {
    try {
      const currentTenant = tenantService.getCurrentTenant();
      if (!currentTenant) return;

      await customAIService.createModel(
        currentTenant.id,
        formData.name,
        formData.description,
        formData.type,
        formData.config
      );
      
      setShowCreateModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to create model:', error);
    }
  };

  const handleTrainModel = async (modelId: string, trainingDataId: string, options: any) => {
    try {
      await customAIService.trainModel(modelId, trainingDataId, options);
      setShowTrainingModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to start training:', error);
    }
  };

  const handleDeployModel = async (modelId: string, environment: 'development' | 'staging' | 'production') => {
    try {
      await customAIService.deployModel(modelId, environment);
      loadData();
    } catch (error) {
      console.error('Failed to deploy model:', error);
    }
  };

  const getStatusColor = (status: AIModel['status']) => {
    switch (status) {
      case 'ready': return 'text-green-600 bg-green-50';
      case 'training': return 'text-blue-600 bg-blue-50';
      case 'deploying': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: AIModel['status']) => {
    switch (status) {
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'training': return <Clock className="w-4 h-4" />;
      case 'deploying': return <Upload className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const renderModelsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AI Models</h2>
          <p className="text-gray-600">Manage your custom AI models and deployments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Model</span>
        </button>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{model.name}</h3>
                  <p className="text-sm text-gray-600">{model.type}</p>
                </div>
              </div>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(model.status)}`}>
                {getStatusIcon(model.status)}
                <span>{model.status}</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{model.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{model.metrics.accuracy.toFixed(1)}%</p>
                <p className="text-xs text-gray-600">Accuracy</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{model.metrics.parameters}</p>
                <p className="text-xs text-gray-600">Parameters</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedModel(model)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowTrainingModal(true)}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Train Model"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button
                  className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              
              {model.status === 'ready' && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleDeployModel(model.id, 'production')}
                    className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs rounded-lg transition-colors"
                  >
                    Deploy
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {models.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Models</h3>
            <p className="text-gray-600 mb-4">Create your first custom AI model to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Model
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderTrainingTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Training Jobs</h2>
          <p className="text-gray-600">Monitor and manage model training processes</p>
        </div>
      </div>

      <div className="space-y-4">
        {trainingJobs.map((job) => {
          const model = models.find(m => m.id === job.modelId);
          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{model?.name || 'Unknown Model'}</h3>
                    <p className="text-sm text-gray-600">Training Job #{job.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  job.status === 'completed' ? 'bg-green-100 text-green-700' :
                  job.status === 'running' ? 'bg-blue-100 text-blue-700' :
                  job.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {job.status}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">{job.progress.toFixed(1)}%</p>
                  <p className="text-xs text-gray-600">Progress</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">{job.currentEpoch}/{job.totalEpochs}</p>
                  <p className="text-xs text-gray-600">Epochs</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">{job.currentLoss.toFixed(4)}</p>
                  <p className="text-xs text-gray-600">Loss</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">{(job.currentAccuracy * 100).toFixed(1)}%</p>
                  <p className="text-xs text-gray-600">Accuracy</p>
                </div>
              </div>

              {job.status === 'running' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Training Progress</span>
                    <span>{Math.round(job.estimatedTimeRemaining / 1000 / 60)} min remaining</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Started: {job.startedAt.toLocaleDateString()} {job.startedAt.toLocaleTimeString()}
                </div>
                {job.status === 'running' && (
                  <button
                    onClick={() => customAIService.cancelTrainingJob(job.id)}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}

        {trainingJobs.length === 0 && (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Training Jobs</h3>
            <p className="text-gray-600">Start training a model to see jobs here</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Training Data</h2>
          <p className="text-gray-600">Manage datasets for model training</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
          <Upload className="w-4 h-4" />
          <span>Upload Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainingData.map((data) => (
          <motion.div
            key={data.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Database className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{data.name}</h3>
                  <p className="text-sm text-gray-600">{data.type}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{data.samples.toLocaleString()}</p>
                <p className="text-xs text-gray-600">Samples</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{(data.size / 1024 / 1024).toFixed(1)}MB</p>
                <p className="text-xs text-gray-600">Size</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {data.createdAt.toLocaleDateString()}
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {trainingData.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Training Data</h3>
            <p className="text-gray-600 mb-4">Upload datasets to train your models</p>
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              Upload Data
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">AI Analytics</h2>
        <p className="text-gray-600">Performance metrics and usage analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Models</p>
              <p className="text-2xl font-bold text-gray-900">{models.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Models</p>
              <p className="text-2xl font-bold text-gray-900">
                {models.filter(m => m.status === 'ready').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Training Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{trainingJobs.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Predictions</p>
              <p className="text-2xl font-bold text-gray-900">
                {customAIService.getTotalPredictions()}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Model Performance</h3>
        <div className="space-y-4">
          {models.map((model) => (
            <div key={model.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{model.name}</h4>
                  <p className="text-sm text-gray-600">{model.type}</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{model.metrics.accuracy.toFixed(1)}%</p>
                  <p className="text-xs text-gray-600">Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{model.metrics.inferenceTime.toFixed(0)}ms</p>
                  <p className="text-xs text-gray-600">Latency</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{model.deployment.requestsPerSecond}</p>
                  <p className="text-xs text-gray-600">RPS</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Global AI Models</h1>
                <p className="text-gray-600">Advanced AI model management and training platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600">TensorFlow.js Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { id: 'models', label: 'Models', icon: Brain },
              { id: 'training', label: 'Training', icon: Activity },
              { id: 'data', label: 'Data', icon: Database },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-blue-600'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'models' && renderModelsTab()}
        {activeTab === 'training' && renderTrainingTab()}
        {activeTab === 'data' && renderDataTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>

      {/* Model Details Modal */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Model Details</h2>
              <button
                onClick={() => setSelectedModel(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">{selectedModel.name}</h3>
                <p className="text-gray-600">{selectedModel.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium text-gray-900">{selectedModel.type}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium text-gray-900">{selectedModel.status}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Accuracy</p>
                  <p className="font-medium text-gray-900">{selectedModel.metrics.accuracy.toFixed(2)}%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Parameters</p>
                  <p className="font-medium text-gray-900">{selectedModel.metrics.parameters.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalAIModels;

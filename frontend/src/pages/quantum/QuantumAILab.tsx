import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Atom,
  Zap,
  Brain,
  Network,
  Play,
  TrendingUp,
  Activity,
  Cpu,
  Globe,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { quantumAIService, QuantumModel, QuantumBackend } from '../../services/quantum/QuantumAIService';

export const QuantumAILab: React.FC = () => {
  const [quantumModels, setQuantumModels] = useState<QuantumModel[]>([]);
  const [backends, setBackends] = useState<QuantumBackend[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'circuits' | 'models' | 'backends' | 'jobs'>('overview');
  const [selectedModel, setSelectedModel] = useState<QuantumModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [modelsData, backendsData, metricsData] = await Promise.all([
        quantumAIService.getAllQuantumModels(),
        quantumAIService.getAvailableBackends(),
        quantumAIService.getQuantumMetrics()
      ]);
      
      setQuantumModels(modelsData);
      setBackends(backendsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load quantum data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuantumModel = async () => {
    try {
      // Create a sample quantum circuit
      const circuit = await quantumAIService.createCircuit({
        name: 'Quantum Neural Network Circuit',
        description: 'A parameterized quantum circuit for machine learning',
        qubits: 4,
        depth: 6,
        gates: [],
        measurements: [
          { qubit: 0, basis: 'computational' },
          { qubit: 1, basis: 'computational' }
        ]
      });

      // Add gates to circuit
      await quantumAIService.addGateToCircuit(circuit.id, {
        type: 'H',
        qubits: [0],
        position: { x: 0, y: 0 }
      });
      
      await quantumAIService.addGateToCircuit(circuit.id, {
        type: 'CNOT',
        qubits: [0, 1],
        position: { x: 1, y: 0 }
      });
      
      await quantumAIService.addGateToCircuit(circuit.id, {
        type: 'RY',
        qubits: [1],
        parameters: [Math.PI / 4],
        position: { x: 2, y: 1 }
      });

      // Create quantum model
      const model = await quantumAIService.createQuantumModel({
        name: `QNN Model ${Date.now()}`,
        description: 'Quantum Neural Network for classification',
        type: 'QNN',
        circuit,
        classicalLayers: null,
        parameters: {
          learningRate: 0.01,
          iterations: 100,
          optimizer: 'SPSA',
          shots: 1024
        },
        performance: {
          accuracy: 0,
          quantumAdvantage: 0,
          coherenceTime: 0,
          fidelity: 0
        }
      });

      setQuantumModels(prev => [...prev, model]);
    } catch (error) {
      console.error('Failed to create quantum model:', error);
    }
  };

  const handleTrainModel = async (modelId: string) => {
    try {
      await quantumAIService.trainQuantumModel(modelId, []);
      
      // Refresh models to show updated training status
      const updatedModels = await quantumAIService.getAllQuantumModels();
      setQuantumModels(updatedModels);
    } catch (error) {
      console.error('Failed to start training:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'training': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'running': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'training':
      case 'running':
        return <Activity className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'offline':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-2xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Quantum Models</p>
              <p className="text-3xl font-bold">{metrics?.totalModels || 0}</p>
            </div>
            <Atom className="w-8 h-8 text-purple-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 rounded-2xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Quantum Circuits</p>
              <p className="text-3xl font-bold">{metrics?.totalCircuits || 0}</p>
            </div>
            <Network className="w-8 h-8 text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-2xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Active Jobs</p>
              <p className="text-3xl font-bold">{metrics?.activeJobs || 0}</p>
            </div>
            <Activity className="w-8 h-8 text-green-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-orange-500 to-red-600 p-6 rounded-2xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Quantum Advantage</p>
              <p className="text-3xl font-bold">{(metrics?.averageQuantumAdvantage * 100 || 0).toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-200" />
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleCreateQuantumModel}
            className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Create Quantum Model</p>
              <p className="text-sm text-gray-600">Build a new quantum ML model</p>
            </div>
          </button>

          <button className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Network className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Design Circuit</p>
              <p className="text-sm text-gray-600">Create quantum circuits</p>
            </div>
          </button>

          <button className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Run Simulation</p>
              <p className="text-sm text-gray-600">Execute quantum algorithms</p>
            </div>
          </button>
        </div>
      </div>

      {/* Available Backends */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Quantum Backends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {backends.map((backend) => (
            <div key={backend.id} className="p-4 border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{backend.name}</h4>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(backend.status)}`}>
                  {getStatusIcon(backend.status)}
                  <span>{backend.status}</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Qubits:</span>
                  <span className="font-medium">{backend.qubits}</span>
                </div>
                <div className="flex justify-between">
                  <span>Queue:</span>
                  <span className="font-medium">{backend.queueLength}</span>
                </div>
                <div className="flex justify-between">
                  <span>Availability:</span>
                  <span className="font-medium">{backend.availability.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderModels = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Quantum Models</h3>
        <button
          onClick={handleCreateQuantumModel}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Brain className="w-4 h-4" />
          <span>Create Model</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {quantumModels.map((model) => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">{model.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{model.description}</p>
              </div>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(model.training.status)}`}>
                {getStatusIcon(model.training.status)}
                <span>{model.training.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-bold text-gray-900">{model.type}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Qubits</p>
                <p className="font-bold text-gray-900">{model.circuit.qubits}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Accuracy</p>
                <p className="font-bold text-gray-900">{(model.performance.accuracy * 100).toFixed(1)}%</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Fidelity</p>
                <p className="font-bold text-gray-900">{(model.performance.fidelity * 100).toFixed(1)}%</p>
              </div>
            </div>

            {model.training.status === 'training' && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Training Progress</span>
                  <span>{model.training.progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${model.training.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedModel(model)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Info className="w-4 h-4" />
                <span>Details</span>
              </button>
              
              {model.training.status === 'idle' && (
                <button
                  onClick={() => handleTrainModel(model.id)}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Train</span>
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {quantumModels.length === 0 && (
        <div className="text-center py-12">
          <Atom className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Quantum Models</h3>
          <p className="text-gray-600 mb-4">Create your first quantum machine learning model</p>
          <button
            onClick={handleCreateQuantumModel}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors mx-auto"
          >
            <Brain className="w-5 h-5" />
            <span>Create Quantum Model</span>
          </button>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Quantum AI Lab...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Atom className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quantum AI Lab</h1>
                <p className="text-gray-600">Quantum-enhanced machine learning platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Cpu className="w-4 h-4" />
                  <span>{backends.filter(b => b.status === 'online').length} Online</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4" />
                  <span>{metrics?.activeJobs || 0} Active Jobs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: Globe },
            { id: 'models', label: 'Models', icon: Brain },
            { id: 'circuits', label: 'Circuits', icon: Network },
            { id: 'backends', label: 'Backends', icon: Cpu },
            { id: 'jobs', label: 'Jobs', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                selectedTab === tab.id
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'models' && renderModels()}
        {selectedTab === 'backends' && (
          <div className="text-center py-12">
            <Cpu className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quantum Backends</h3>
            <p className="text-gray-600">Backend management interface coming soon</p>
          </div>
        )}
        {selectedTab === 'circuits' && (
          <div className="text-center py-12">
            <Network className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Circuit Designer</h3>
            <p className="text-gray-600">Visual quantum circuit designer coming soon</p>
          </div>
        )}
        {selectedTab === 'jobs' && (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Job Queue</h3>
            <p className="text-gray-600">Quantum job management interface coming soon</p>
          </div>
        )}
      </div>

      {/* Model Details Modal */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Quantum Model Details</h2>
                <button
                  onClick={() => setSelectedModel(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedModel.name}</h3>
                  <p className="text-gray-600">{selectedModel.description}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Model Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium">{selectedModel.type}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Qubits</p>
                      <p className="font-medium">{selectedModel.circuit.qubits}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Circuit Depth</p>
                      <p className="font-medium">{selectedModel.circuit.depth}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Optimizer</p>
                      <p className="font-medium">{selectedModel.parameters.optimizer}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Accuracy</p>
                      <p className="text-xl font-bold text-gray-900">{(selectedModel.performance.accuracy * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Fidelity</p>
                      <p className="text-xl font-bold text-gray-900">{(selectedModel.performance.fidelity * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

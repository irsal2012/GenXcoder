import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Cpu,
  Zap,
  Activity,
  Users,
  Settings,
  Play,
  Pause,
  Square,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  MessageSquare,
  Workflow,
  Eye,
  Plus,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { aiOrchestrationService, AIAgent, AIWorkflow, AIInsight, AIMetrics } from '../../services/orchestration/AIOrchestrationService';

export const AIOrchestrationDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'agents' | 'workflows' | 'insights' | 'collaborations'>('overview');
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [workflows, setWorkflows] = useState<AIWorkflow[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [agentsData, workflowsData, insightsData, metricsData] = await Promise.all([
        aiOrchestrationService.getAgents(),
        aiOrchestrationService.getWorkflows(),
        aiOrchestrationService.getInsights(),
        aiOrchestrationService.getMetrics()
      ]);
      
      setAgents(agentsData);
      setWorkflows(workflowsData);
      setInsights(insightsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load orchestration data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'text-gray-600 bg-gray-100';
      case 'working': return 'text-blue-600 bg-blue-100';
      case 'learning': return 'text-purple-600 bg-purple-100';
      case 'collaborating': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'autonomous': return <Brain className="w-5 h-5" />;
      case 'collaborative': return <Users className="w-5 h-5" />;
      case 'specialized': return <Target className="w-5 h-5" />;
      case 'quantum': return <Zap className="w-5 h-5" />;
      case 'federated': return <Activity className="w-5 h-5" />;
      default: return <Cpu className="w-5 h-5" />;
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.capabilities.some(cap => cap.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || agent.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 rounded-2xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Agents</p>
              <p className="text-3xl font-bold">{metrics?.totalAgents || 0}</p>
            </div>
            <Brain className="w-8 h-8 text-blue-200" />
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-blue-100 text-sm">{metrics?.activeAgents || 0} active</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-2xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Success Rate</p>
              <p className="text-3xl font-bold">{((metrics?.successRate || 0) * 100).toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-200 mr-1" />
            <span className="text-green-100 text-sm">+2.3% from last week</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-2xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">System Load</p>
              <p className="text-3xl font-bold">{((metrics?.systemLoad || 0) * 100).toFixed(0)}%</p>
            </div>
            <Cpu className="w-8 h-8 text-purple-200" />
          </div>
          <div className="mt-4 flex items-center">
            <Activity className="w-4 h-4 text-purple-200 mr-1" />
            <span className="text-purple-100 text-sm">{metrics?.runningWorkflows || 0} workflows running</span>
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
              <p className="text-orange-100">Response Time</p>
              <p className="text-3xl font-bold">{(metrics?.averageResponseTime || 0).toFixed(0)}ms</p>
            </div>
            <Clock className="w-8 h-8 text-orange-200" />
          </div>
          <div className="mt-4 flex items-center">
            <TrendingDown className="w-4 h-4 text-orange-200 mr-1" />
            <span className="text-orange-100 text-sm">-15ms improvement</span>
          </div>
        </motion.div>
      </div>

      {/* Resource Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Utilization</h3>
          <div className="space-y-4">
            {[
              { name: 'CPU', value: (metrics?.resourceUtilization.cpu || 0) * 100, color: 'bg-blue-500' },
              { name: 'Memory', value: (metrics?.resourceUtilization.memory || 0) * 100, color: 'bg-green-500' },
              { name: 'GPU', value: (metrics?.resourceUtilization.gpu || 0) * 100, color: 'bg-purple-500' },
              { name: 'Network', value: (metrics?.resourceUtilization.network || 0) * 100, color: 'bg-orange-500' }
            ].map((resource) => (
              <div key={resource.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{resource.name}</span>
                  <span className="text-gray-600">{resource.value.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${resource.color}`}
                    style={{ width: `${resource.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Insights</h3>
          <div className="space-y-3">
            {insights.slice(0, 4).map((insight) => (
              <div key={insight.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-xl">
                <div className={`p-2 rounded-lg ${
                  insight.impact === 'critical' ? 'bg-red-100 text-red-600' :
                  insight.impact === 'high' ? 'bg-orange-100 text-orange-600' :
                  insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{insight.title}</p>
                  <p className="text-gray-600 text-xs mt-1">{insight.description}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className="text-xs text-gray-500">
                      {(insight.confidence * 100).toFixed(0)}% confidence
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {new Date(insight.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Agents Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Agents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.filter(agent => agent.status !== 'idle').map((agent) => (
            <div key={agent.id} className="p-4 border border-gray-200 rounded-xl">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  {getAgentTypeIcon(agent.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{agent.name}</p>
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(agent.status)}`}>
                    {getStatusIcon(agent.status)}
                    <span>{agent.status}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Accuracy</span>
                  <span className="font-medium">{(agent.performance.accuracy * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="h-1 rounded-full bg-green-500"
                    style={{ width: `${agent.performance.accuracy * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAgents = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">AI Agents</h3>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="idle">Idle</option>
            <option value="working">Working</option>
            <option value="learning">Learning</option>
            <option value="collaborating">Collaborating</option>
            <option value="error">Error</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            <span>Create Agent</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                  {getAgentTypeIcon(agent.type)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{agent.name}</h4>
                  <p className="text-sm text-gray-600 capitalize">{agent.type} Agent</p>
                </div>
              </div>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(agent.status)}`}>
                {getStatusIcon(agent.status)}
                <span>{agent.status}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Capabilities</p>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.slice(0, 3).map((capability) => (
                    <span key={capability} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg">
                      {capability.replace('_', ' ')}
                    </span>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg">
                      +{agent.capabilities.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Performance Metrics</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Accuracy', value: agent.performance.accuracy, color: 'bg-green-500' },
                    { name: 'Speed', value: agent.performance.speed, color: 'bg-blue-500' },
                    { name: 'Efficiency', value: agent.performance.efficiency, color: 'bg-purple-500' },
                    { name: 'Reliability', value: agent.performance.reliability, color: 'bg-orange-500' }
                  ].map((metric) => (
                    <div key={metric.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">{metric.name}</span>
                        <span className="font-medium">{(metric.value * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${metric.color}`}
                          style={{ width: `${metric.value * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                  <Settings className="w-4 h-4" />
                  <span>Configure</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderWorkflows = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">AI Workflows</h3>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          <span>Create Workflow</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workflows.map((workflow) => (
          <motion.div
            key={workflow.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">{workflow.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
              </div>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(workflow.status)}`}>
                {getStatusIcon(workflow.status)}
                <span>{workflow.status}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Steps</p>
                  <p className="font-bold text-gray-900">{workflow.steps.length}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-bold text-gray-900 capitalize">{workflow.type}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="font-bold text-gray-900">{(workflow.metrics.successRate * 100).toFixed(0)}%</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Avg Time</p>
                  <p className="font-bold text-gray-900">{workflow.metrics.executionTime}ms</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                  <Play className="w-4 h-4" />
                  <span>Execute</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                  <Settings className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Orchestration Dashboard...</p>
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
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Orchestration Dashboard</h1>
                <p className="text-gray-600">Manage and monitor your AI agents and workflows</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={loadData}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4" />
                  <span>{metrics?.activeAgents || 0} Active</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Workflow className="w-4 h-4" />
                  <span>{metrics?.runningWorkflows || 0} Running</span>
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
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'agents', label: 'Agents', icon: Brain },
            { id: 'workflows', label: 'Workflows', icon: Workflow },
            { id: 'insights', label: 'Insights', icon: TrendingUp },
            { id: 'collaborations', label: 'Collaborations', icon: MessageSquare }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                selectedTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
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
        {selectedTab === 'agents' && renderAgents()}
        {selectedTab === 'workflows' && renderWorkflows()}
        {selectedTab === 'insights' && (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI Insights</h3>
            <p className="text-gray-600">Advanced insights and recommendations coming soon</p>
          </div>
        )}
        {selectedTab === 'collaborations' && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Agent Collaborations</h3>
            <p className="text-gray-600">Multi-agent collaboration interface coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

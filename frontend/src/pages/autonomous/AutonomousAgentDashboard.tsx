import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Zap, 
  Users, 
  TrendingUp, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  Eye,
  GitBranch,
  Target,
  Award,
  Activity,
  Cpu,
  Network,
  BookOpen,
  Lightbulb,
  Shield,
  Rocket,
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import AutonomousAgentService, { 
  AutonomousAgent, 
  AgentCollaboration, 
  SelfImprovementMetrics,
  AgentGoal 
} from '../../services/autonomous/AutonomousAgentService';

const AutonomousAgentDashboard: React.FC = () => {
  const [agentService] = useState(() => new AutonomousAgentService());
  const [agents, setAgents] = useState<AutonomousAgent[]>([]);
  const [collaborations, setCollaborations] = useState<AgentCollaboration[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AutonomousAgent | null>(null);
  const [metrics, setMetrics] = useState<SelfImprovementMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'collaborations' | 'evolution' | 'insights'>('overview');
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [newAgentConfig, setNewAgentConfig] = useState({
    name: '',
    type: 'code_generator' as AutonomousAgent['type'],
    capabilities: [] as string[],
    autonomyLevel: 'supervised' as AutonomousAgent['autonomyLevel']
  });

  useEffect(() => {
    // Initialize with some demo agents
    initializeDemoAgents();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      updateDashboard();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const initializeDemoAgents = async () => {
    try {
      // Create demo agents
      const codeAgent = await agentService.createAgent({
        name: 'CodeMaster AI',
        type: 'code_generator',
        capabilities: ['javascript', 'typescript', 'react', 'node.js'],
        autonomyLevel: 'semi_autonomous'
      });

      const optimizerAgent = await agentService.createAgent({
        name: 'OptiMax',
        type: 'optimizer',
        capabilities: ['performance_optimization', 'code_analysis', 'refactoring'],
        autonomyLevel: 'fully_autonomous'
      });

      const testerAgent = await agentService.createAgent({
        name: 'TestGuardian',
        type: 'tester',
        capabilities: ['unit_testing', 'integration_testing', 'e2e_testing'],
        autonomyLevel: 'supervised'
      });

      // Simulate some activity
      codeAgent.performance.tasksCompleted = 45;
      codeAgent.performance.successRate = 0.92;
      codeAgent.performance.autonomyScore = 0.85;

      optimizerAgent.performance.tasksCompleted = 32;
      optimizerAgent.performance.successRate = 0.88;
      optimizerAgent.performance.autonomyScore = 0.91;

      testerAgent.performance.tasksCompleted = 28;
      testerAgent.performance.successRate = 0.95;
      testerAgent.performance.autonomyScore = 0.78;

      updateDashboard();
    } catch (error) {
      console.error('Error initializing demo agents:', error);
    }
  };

  const updateDashboard = () => {
    const allAgents = agentService.getAllAgents();
    const activeCollaborations = agentService.getActiveCollaborations();
    
    setAgents(allAgents);
    setCollaborations(activeCollaborations);

    if (selectedAgent) {
      const updatedAgent = allAgents.find(a => a.id === selectedAgent.id);
      if (updatedAgent) {
        setSelectedAgent(updatedAgent);
        const agentMetrics = agentService.getAgentMetrics(updatedAgent.id);
        setMetrics(agentMetrics);
      }
    }
  };

  const handleCreateAgent = async () => {
    try {
      await agentService.createAgent(newAgentConfig);
      setIsCreatingAgent(false);
      setNewAgentConfig({
        name: '',
        type: 'code_generator',
        capabilities: [],
        autonomyLevel: 'supervised'
      });
      updateDashboard();
    } catch (error) {
      console.error('Error creating agent:', error);
    }
  };

  const handleTriggerImprovement = async (agentId: string) => {
    try {
      await agentService.triggerSelfImprovement(agentId);
      updateDashboard();
    } catch (error) {
      console.error('Error triggering improvement:', error);
    }
  };

  const handleEnableLearning = async (agentId: string) => {
    try {
      await agentService.enableContinuousLearning(agentId);
      updateDashboard();
    } catch (error) {
      console.error('Error enabling learning:', error);
    }
  };

  const handleCreateCollaboration = async () => {
    if (agents.length >= 2) {
      try {
        const agentIds = agents.slice(0, 2).map(a => a.id);
        await agentService.createCollaboration(
          agentIds,
          'Collaborative code generation and optimization',
          'peer_review'
        );
        updateDashboard();
      } catch (error) {
        console.error('Error creating collaboration:', error);
      }
    }
  };

  const getStatusColor = (status: AutonomousAgent['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'learning': return 'text-blue-600 bg-blue-100';
      case 'improving': return 'text-purple-600 bg-purple-100';
      case 'evolving': return 'text-orange-600 bg-orange-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAutonomyLevelColor = (level: AutonomousAgent['autonomyLevel']) => {
    switch (level) {
      case 'self_governing': return 'text-purple-600 bg-purple-100';
      case 'fully_autonomous': return 'text-green-600 bg-green-100';
      case 'semi_autonomous': return 'text-blue-600 bg-blue-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Agents</p>
              <p className="text-2xl font-bold text-gray-900">{agents.filter(a => a.status === 'active').length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Learning Agents</p>
              <p className="text-2xl font-bold text-gray-900">{agents.filter(a => a.status === 'learning').length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collaborations</p>
              <p className="text-2xl font-bold text-gray-900">{collaborations.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Autonomy Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {agents.length > 0 ? 
                  Math.round((agents.reduce((sum, a) => sum + a.performance.autonomyScore, 0) / agents.length) * 100) : 0}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">Self-Improvement Engine</span>
            </div>
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Active</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Learning Orchestrator</span>
            </div>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Active</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-purple-800">Evolution Engine</span>
            </div>
            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">Active</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {agents.slice(0, 5).map((agent, index) => (
            <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg mr-3 ${getStatusColor(agent.status)}`}>
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                  <p className="text-xs text-gray-500">
                    {agent.performance.tasksCompleted} tasks completed • {Math.round(agent.performance.successRate * 100)}% success rate
                  </p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(agent.status)}`}>
                {agent.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAgents = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Autonomous Agents</h2>
        <button
          onClick={() => setIsCreatingAgent(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg mr-3 ${getStatusColor(agent.status)}`}>
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{agent.type.replace('_', ' ')}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${getAutonomyLevelColor(agent.autonomyLevel)}`}>
                {agent.autonomyLevel.replace('_', ' ')}
              </span>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="text-sm font-medium">{Math.round(agent.performance.successRate * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${agent.performance.successRate * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Autonomy Score</span>
                <span className="text-sm font-medium">{Math.round(agent.performance.autonomyScore * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${agent.performance.autonomyScore * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{agent.performance.tasksCompleted}</p>
                <p className="text-xs text-gray-500">Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{agent.selfImprovementHistory.length}</p>
                <p className="text-xs text-gray-500">Improvements</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleTriggerImprovement(agent.id)}
                className="flex-1 bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 text-sm flex items-center justify-center"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Improve
              </button>
              <button
                onClick={() => handleEnableLearning(agent.id)}
                className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 text-sm flex items-center justify-center"
              >
                <BookOpen className="h-4 w-4 mr-1" />
                Learn
              </button>
              <button
                onClick={() => setSelectedAgent(agent)}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 text-sm"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Agent Modal */}
      {isCreatingAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Agent</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newAgentConfig.name}
                  onChange={(e) => setNewAgentConfig({...newAgentConfig, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter agent name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newAgentConfig.type}
                  onChange={(e) => setNewAgentConfig({...newAgentConfig, type: e.target.value as AutonomousAgent['type']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="code_generator">Code Generator</option>
                  <option value="optimizer">Optimizer</option>
                  <option value="tester">Tester</option>
                  <option value="deployer">Deployer</option>
                  <option value="monitor">Monitor</option>
                  <option value="researcher">Researcher</option>
                  <option value="architect">Architect</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autonomy Level</label>
                <select
                  value={newAgentConfig.autonomyLevel}
                  onChange={(e) => setNewAgentConfig({...newAgentConfig, autonomyLevel: e.target.value as AutonomousAgent['autonomyLevel']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="supervised">Supervised</option>
                  <option value="semi_autonomous">Semi Autonomous</option>
                  <option value="fully_autonomous">Fully Autonomous</option>
                  <option value="self_governing">Self Governing</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setIsCreatingAgent(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAgent}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Create Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCollaborations = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Agent Collaborations</h2>
        <button
          onClick={handleCreateCollaboration}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
          disabled={agents.length < 2}
        >
          <Users className="h-4 w-4 mr-2" />
          Create Collaboration
        </button>
      </div>

      {collaborations.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Collaborations</h3>
          <p className="text-gray-500 mb-4">Create collaborations between agents to enhance their capabilities.</p>
          <button
            onClick={handleCreateCollaboration}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            disabled={agents.length < 2}
          >
            Create First Collaboration
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {collaborations.map((collab) => (
            <div key={collab.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Collaboration</h3>
                  <p className="text-sm text-gray-500 capitalize">{collab.strategy.replace('_', ' ')}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  collab.status === 'active' ? 'text-green-600 bg-green-100' :
                  collab.status === 'completed' ? 'text-blue-600 bg-blue-100' :
                  'text-gray-600 bg-gray-100'
                }`}>
                  {collab.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">{collab.objective}</p>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Participants:</p>
                {collab.participants.map((participantId) => {
                  const agent = agents.find(a => a.id === participantId);
                  return agent ? (
                    <div key={participantId} className="flex items-center text-sm text-gray-600">
                      <Brain className="h-4 w-4 mr-2" />
                      {agent.name}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg mr-4">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Autonomous AI Agents</h1>
                <p className="text-gray-500">Self-improving and collaborative AI systems</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                System Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-8 border-b border-gray-200 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'agents', label: 'Agents', icon: Brain },
            { id: 'collaborations', label: 'Collaborations', icon: Users },
            { id: 'evolution', label: 'Evolution', icon: GitBranch },
            { id: 'insights', label: 'Insights', icon: Lightbulb }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'agents' && renderAgents()}
        {activeTab === 'collaborations' && renderCollaborations()}
        {activeTab === 'evolution' && (
          <div className="text-center py-12">
            <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Evolution Engine</h3>
            <p className="text-gray-500">Agent evolution features coming soon...</p>
          </div>
        )}
        {activeTab === 'insights' && (
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI Insights</h3>
            <p className="text-gray-500">Advanced analytics and insights coming soon...</p>
          </div>
        )}
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedAgent.name}</h3>
                <p className="text-gray-500 capitalize">{selectedAgent.type.replace('_', ' ')}</p>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Performance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tasks Completed</span>
                    <span className="font-medium">{selectedAgent.performance.tasksCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate</span>
                    <span className="font-medium">{Math.round(selectedAgent.performance.successRate * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Autonomy Score</span>
                    <span className="font-medium">{Math.round(selectedAgent.performance.autonomyScore * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Learning Progress</span>
                    <span className="font-medium">{Math.round(selectedAgent.performance.learningProgress * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.capabilities.map((capability, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>

              {/* Goals */}
              <div className="space-y-4 col-span-2">
                <h4 className="text-lg font-semibold text-gray-900">Current Goals</h4>
                {selectedAgent.goals.length === 0 ? (
                  <p className="text-gray-500">No active goals</p>
                ) : (
                  <div className="space-y-3">
                    {selectedAgent.goals.slice(0, 3).map((goal) => (
                      <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{goal.description}</h5>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            goal.status === 'completed' ? 'text-green-600 bg-green-100' :
                            goal.status === 'in_progress' ? 'text-blue-600 bg-blue-100' :
                            goal.status === 'failed' ? 'text-red-600 bg-red-100' :
                            'text-gray-600 bg-gray-100'
                          }`}>
                            {goal.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-500">{goal.progress}% complete</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Improvement History */}
              <div className="space-y-4 col-span-2">
                <h4 className="text-lg font-semibold text-gray-900">Recent Improvements</h4>
                {selectedAgent.selfImprovementHistory.length === 0 ? (
                  <p className="text-gray-500">No improvements recorded</p>
                ) : (
                  <div className="space-y-3">
                    {selectedAgent.selfImprovementHistory.slice(-3).map((improvement) => (
                      <div key={improvement.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{improvement.description}</h5>
                          <span className="text-xs text-gray-500">
                            {new Date(improvement.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 capitalize">
                          Type: {improvement.type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-600">
                          Method: {improvement.improvementMethod.replace('_', ' ')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutonomousAgentDashboard;

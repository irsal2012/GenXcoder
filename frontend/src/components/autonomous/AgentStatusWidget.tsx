import React, { useState, useEffect } from 'react';
import { Brain, Activity, Users, TrendingUp } from 'lucide-react';
import AutonomousAgentService from '../../services/autonomous/AutonomousAgentService';

const AgentStatusWidget: React.FC = () => {
  const [agentService] = useState(() => new AutonomousAgentService());
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    learningAgents: 0,
    collaborations: 0,
    avgAutonomy: 0
  });

  useEffect(() => {
    const updateStats = () => {
      const agents = agentService.getAllAgents();
      const collaborations = agentService.getActiveCollaborations();
      
      const activeAgents = agents.filter(a => a.status === 'active').length;
      const learningAgents = agents.filter(a => a.status === 'learning').length;
      const avgAutonomy = agents.length > 0 
        ? Math.round((agents.reduce((sum, a) => sum + a.performance.autonomyScore, 0) / agents.length) * 100)
        : 0;

      setStats({
        totalAgents: agents.length,
        activeAgents,
        learningAgents,
        collaborations: collaborations.length,
        avgAutonomy
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [agentService]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
          <Brain className="h-4 w-4 mr-2 text-purple-600" />
          Autonomous Agents
        </h3>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600 flex items-center">
            <Activity className="h-3 w-3 mr-1" />
            Active
          </span>
          <span className="font-medium text-green-600">{stats.activeAgents}</span>
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600 flex items-center">
            <Brain className="h-3 w-3 mr-1" />
            Learning
          </span>
          <span className="font-medium text-blue-600">{stats.learningAgents}</span>
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600 flex items-center">
            <Users className="h-3 w-3 mr-1" />
            Collaborating
          </span>
          <span className="font-medium text-purple-600">{stats.collaborations}</span>
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600 flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            Avg Autonomy
          </span>
          <span className="font-medium text-orange-600">{stats.avgAutonomy}%</span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <a 
          href="/autonomous" 
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          View Dashboard →
        </a>
      </div>
    </div>
  );
};

export default AgentStatusWidget;

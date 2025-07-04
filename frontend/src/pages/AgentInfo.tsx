import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import apiClient from '@/services/api';
import { AgentsInfo } from '@/types/api';

const AgentInfo: React.FC = () => {
  const { data: agentsInfo, isLoading, error } = useQuery<AgentsInfo>({
    queryKey: ['agents-info'],
    queryFn: () => apiClient.getAgentsInfo(),
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600 mr-3" />
        <span className="text-lg text-gray-600 dark:text-gray-400">Loading agent information...</span>
      </div>
    );
  }

  if (error || !agentsInfo) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center text-red-600 dark:text-red-400">
          <AlertCircle className="h-6 w-6 mr-2" />
          <span>Failed to load agent information</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          🤖 Agent Information
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Learn about our specialized AI agents and the multi-agent pipeline process.
        </p>
      </div>

      {/* Pipeline Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Pipeline Overview
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The multi-agent framework follows these steps to transform your ideas into complete applications:
        </p>
        
        <div className="space-y-3">
          {agentsInfo.pipeline_steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {index + 1}
                </span>
              </div>
              <div className="ml-3">
                <span className="text-gray-900 dark:text-white font-medium">{step}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Agents */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Available Agents
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Currently loaded and ready to work:
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {agentsInfo.available_agents.map((agent, index) => (
            <div key={index} className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                {agent}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Descriptions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Agent Descriptions
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Each agent is specialized for specific tasks in the development pipeline:
        </p>
        
        <div className="space-y-6">
          {agentsInfo.agents_info.map((agent, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {agent.name}
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {agent.description}
                  </p>
                  
                  {agent.capabilities && agent.capabilities.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Capabilities:
                      </h4>
                      <ul className="space-y-1">
                        {agent.capabilities.map((capability, capIndex) => (
                          <li key={capIndex} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {capability}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          How It Works
        </h2>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-400">
            Our multi-agent system works collaboratively to transform your requirements into a complete application:
          </p>
          
          <div className="mt-4 space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mt-1">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">1</span>
              </div>
              <div className="ml-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Requirements Analysis</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The Requirement Analyst agent processes your input and creates detailed technical specifications.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mt-1">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">2</span>
              </div>
              <div className="ml-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Code Generation</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The Python Coder agent writes clean, efficient code based on the requirements.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mt-1">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">3</span>
              </div>
              <div className="ml-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Quality Assurance</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The Code Reviewer agent analyzes the code for best practices, security, and optimization opportunities.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mt-1">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">4</span>
              </div>
              <div className="ml-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Documentation & Testing</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Specialized agents create comprehensive documentation and generate thorough test cases.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mt-1">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">5</span>
              </div>
              <div className="ml-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Deployment & UI</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The final agents create deployment configurations and build a user-friendly Streamlit interface.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentInfo;

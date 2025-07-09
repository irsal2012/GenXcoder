import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProjectSidebar } from '@/components/sidebar/ProjectSidebar';
import apiClient from '@/services/api';
import { PipelineStatus, GenerateCodeRequest, GenerationResponse, ProjectResult } from '@/types/api';
import { 
  Sparkles, 
  Rocket, 
  BarChart3, 
  Globe, 
  MessageSquare,
  Loader2,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Brain,
  Zap,
  Clock,
  Star
} from 'lucide-react';

// Enhanced Code Generator with sidebar
const EnhancedCodeGenerator: React.FC = () => {
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch pipeline status periodically
  useEffect(() => {
    const fetchPipelineStatus = async () => {
      try {
        const status = await apiClient.getPipelineStatus();
        setPipelineStatus(status);
      } catch (err) {
        console.error('Error fetching pipeline status:', err);
      }
    };

    fetchPipelineStatus();
    const interval = setInterval(fetchPipelineStatus, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please provide a project description');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setShowResults(false);
    setCurrentProjectId(null);

    try {
      const request: GenerateCodeRequest = {
        user_input: description.trim(),
        project_name: projectName.trim() || undefined
      };

      const response: GenerationResponse = await apiClient.generateCode(request);
      setCurrentProjectId(response.project_id);
      
      // Start polling for progress
      pollProgress(response.project_id);
    } catch (err) {
      setIsGenerating(false);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const pollProgress = async (projectId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const progress = await apiClient.getProjectProgress(projectId);
        
        if (progress.is_completed || progress.has_failures || attempts >= maxAttempts) {
          setIsGenerating(false);
          if (progress.is_completed) {
            setShowResults(true);
          } else if (progress.has_failures) {
            setError('Project generation failed');
          } else {
            setError('Project generation timed out');
          }
          return;
        }

        // Continue polling
        setTimeout(poll, 5000);
        attempts++;
      } catch (err) {
        console.error('Error polling progress:', err);
        setTimeout(poll, 5000);
        attempts++;
      }
    };

    poll();
  };

  const handleExampleClick = (exampleDescription: string) => {
    setDescription(exampleDescription);
  };

  const examples = [
    {
      title: 'Data Analysis Tool',
      description: 'CSV analysis with beautiful visualizations',
      icon: BarChart3,
      color: 'blue',
      prompt: 'Create a data analysis tool that reads CSV files, performs statistical analysis, generates interactive visualizations, and exports comprehensive reports in PDF format.'
    },
    {
      title: 'Web API',
      description: 'REST API with authentication & security',
      icon: Globe,
      color: 'green',
      prompt: 'Build a REST API for a task management system with JWT authentication, CRUD operations for tasks, real-time notifications, and comprehensive API documentation.'
    },
    {
      title: 'AI Chatbot',
      description: 'Intelligent conversation bot',
      icon: MessageSquare,
      color: 'purple',
      prompt: 'Create an intelligent chatbot that can answer questions about a knowledge base, with conversation history, context awareness, and natural language processing.'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Project Sidebar */}
      <ProjectSidebar
        pipelineStatus={pipelineStatus}
        isGenerating={isGenerating}
        projectName={projectName}
        description={description}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Your Application</h1>
              <p className="text-gray-600 mt-1">Transform your ideas into production-ready code</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Ready to generate</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8 space-y-8">
            
            {/* Hero Section */}
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Build Amazing Apps with AI
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                Describe your vision and watch our AI agents collaborate to create 
                production-ready applications with clean code, tests, and documentation.
              </p>
              
              {/* Interface Toggle */}
              <div className="flex items-center justify-center space-x-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex items-center space-x-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">
                    Smart Form
                  </button>
                  <button 
                    onClick={() => window.location.href = '/chat'}
                    className="px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat Interface</span>
                    <div className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                      NEW
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Start Examples */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-semibold text-gray-900">Quick Start Examples</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {examples.map((example) => {
                  const Icon = example.icon;
                  const colorClasses = {
                    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
                    green: 'bg-green-50 text-green-600 hover:bg-green-100',
                    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                  };
                  
                  return (
                    <button
                      key={example.title}
                      onClick={() => handleExampleClick(example.prompt)}
                      className="group p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left"
                    >
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 transition-colors ${colorClasses[example.color as keyof typeof colorClasses]}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{example.title}</h4>
                      <p className="text-sm text-gray-600 mb-4">{example.description}</p>
                      <div className="flex items-center text-xs text-blue-600 font-medium">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Click to use this example
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Project Input */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <Brain className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">AI-Powered Project Builder</h3>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  NEW
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Project Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Project Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you want to build... Our AI will analyze your requirements and suggest improvements!"
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    rows={4}
                    disabled={isGenerating}
                  />
                </div>
                
                {/* Project Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="my-awesome-project"
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={isGenerating}
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <XCircle className="w-5 h-5 text-red-600 mr-3" />
                      <div className="text-red-800 text-sm">{error}</div>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !description.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 text-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating Your App...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      <span>Generate Application</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results */}
            {showResults && currentProjectId && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Generation Complete!</h3>
                </div>
                <div className="text-center text-gray-600">
                  <p>Your project has been generated successfully.</p>
                  <p className="text-sm mt-2">Project ID: {currentProjectId}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SimpleChat: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            💬 Conversational Generator
          </h1>
          <p className="text-gray-600 mb-6">
            Chat with AI to build your applications naturally.
          </p>
          <div className="text-center text-gray-500">
            Chat interface coming soon...
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/generator" replace />} />
      <Route path="/generator" element={<EnhancedCodeGenerator />} />
      <Route path="/chat" element={<SimpleChat />} />
      <Route path="*" element={<Navigate to="/generator" replace />} />
    </Routes>
  );
}

export default App;

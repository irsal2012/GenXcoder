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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
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
        <div className="relative bg-gradient-to-r from-white via-blue-50/50 to-purple-50/50 border-b border-white/50 px-8 py-6 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">Create Your Application</h1>
              <p className="text-gray-700 mt-2 font-medium">Transform your ideas into production-ready code</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-200/50">
                <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-700">Ready to generate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8 space-y-8">
            
            {/* Hero Section */}
            <div className="relative text-center py-16 overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl"></div>
              <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-20 blur-xl"></div>
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 blur-xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full opacity-10 blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl mb-8 shadow-2xl transform hover:scale-110 transition-transform duration-300">
                  <Rocket className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                  Build Amazing Apps with AI
                </h2>
                <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-10 leading-relaxed">
                  Describe your vision and watch our AI agents collaborate to create 
                  production-ready applications with clean code, tests, and documentation.
                </p>
                
                {/* Interface Toggle */}
                <div className="flex items-center justify-center space-x-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-3 flex items-center space-x-3">
                    <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                      Smart Form
                    </button>
                    <button 
                      onClick={() => window.location.href = '/chat'}
                      className="px-6 py-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-2xl text-sm font-semibold transition-all duration-200 flex items-center space-x-2 group"
                    >
                      <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Chat Interface</span>
                      <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-md">
                        NEW
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Start Examples */}
            <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-3xl shadow-xl border border-white/50 p-8 backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-3xl"></div>
              
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Quick Start Examples</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {examples.map((example, index) => {
                  const Icon = example.icon;
                  const gradients = {
                    blue: 'from-blue-500 to-cyan-500',
                    green: 'from-green-500 to-emerald-500',
                    purple: 'from-purple-500 to-pink-500'
                  };
                  const hoverGradients = {
                    blue: 'hover:from-blue-600 hover:to-cyan-600',
                    green: 'hover:from-green-600 hover:to-emerald-600',
                    purple: 'hover:from-purple-600 hover:to-pink-600'
                  };
                  
                  return (
                    <button
                      key={example.title}
                      onClick={() => handleExampleClick(example.prompt)}
                      className="group relative p-8 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 hover:border-white/80 hover:shadow-2xl transition-all duration-300 text-left transform hover:scale-105 hover:-translate-y-1"
                      style={{
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative z-10">
                        <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${gradients[example.color as keyof typeof gradients]} ${hoverGradients[example.color as keyof typeof hoverGradients]} rounded-2xl mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-3 text-lg group-hover:text-purple-700 transition-colors">{example.title}</h4>
                        <p className="text-gray-600 mb-6 leading-relaxed">{example.description}</p>
                        <div className="flex items-center text-sm font-semibold">
                          <div className="flex items-center text-purple-600 group-hover:text-pink-600 transition-colors">
                            <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                            Click to use this example
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Project Input */}
            <div className="relative bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/30 rounded-3xl shadow-xl border border-white/50 p-8 backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-t-3xl"></div>
              
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AI-Powered Project Builder</h3>
                <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold rounded-full shadow-md">
                  NEW
                </div>
              </div>
              
              <div className="space-y-8">
                {/* Project Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <span>Project Description</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what you want to build... Our AI will analyze your requirements and suggest improvements!"
                      className="w-full p-6 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white/80 backdrop-blur-sm shadow-inner transition-all duration-200 hover:border-blue-300"
                      rows={5}
                      disabled={isGenerating}
                    />
                    <div className="absolute bottom-4 right-4 flex items-center space-x-2 text-xs text-gray-500">
                      <Star className="w-3 h-3" />
                      <span>AI Enhanced</span>
                    </div>
                  </div>
                </div>
                
                {/* Project Name Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>Project Name</span>
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="my-awesome-project"
                    className="w-full p-6 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white/80 backdrop-blur-sm shadow-inner transition-all duration-200 hover:border-indigo-300"
                    disabled={isGenerating}
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl mr-4">
                        <XCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-red-800 font-medium">{error}</div>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !description.trim()}
                  className="group relative w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-6 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-3 text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Generating Your App...</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl animate-pulse"></div>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-6 h-6 group-hover:animate-bounce" />
                      <span>Generate Application</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results */}
            {showResults && currentProjectId && (
              <div className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl shadow-2xl border border-green-200/50 p-8 backdrop-blur-sm animate-in slide-in-from-bottom duration-500">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-t-3xl"></div>
                <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-20 blur-xl"></div>
                
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Generation Complete!</h3>
                </div>
                <div className="text-center">
                  <p className="text-lg text-gray-700 font-medium mb-4">Your project has been generated successfully.</p>
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/80 rounded-full shadow-md">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-mono text-gray-600">Project ID: {currentProjectId}</span>
                  </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 rounded-3xl shadow-2xl border border-white/50 p-12 backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-t-3xl"></div>
          <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 blur-xl"></div>
          
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-lg">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-6">
              Conversational Generator
            </h1>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Chat with AI to build your applications naturally.
            </p>
            <div className="inline-flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl border border-purple-200/50">
              <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
              <span className="text-purple-700 font-semibold">Chat interface coming soon...</span>
            </div>
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

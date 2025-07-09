import React, { useState, useEffect } from 'react';
import { ProjectSidebar } from '../components/sidebar/ProjectSidebar';
import ProgressTracker from '../components/progress/ProgressTracker';
import ResultsDisplay from '../components/results/ResultsDisplay';
import SmartRequirementInput from '../components/ai/SmartRequirementInput';
import apiClient from '../services/api';
import { PipelineStatus, GenerateCodeRequest, GenerationResponse, ProjectResult } from '../types/api';
import { ClassificationResult } from '../ai/IntentClassifier';
import { projectTemplateService, ProjectTemplate } from '../services/ai/ProjectTemplates';
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

export const CodeGenerator: React.FC = () => {
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // AI-powered features
  const [analysisResult, setAnalysisResult] = useState<ClassificationResult | null>(null);
  const [recommendedTemplates, setRecommendedTemplates] = useState<ProjectTemplate[]>([]);
  const [showAIInsights, setShowAIInsights] = useState(false);

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
    } catch (err: any) {
      setIsGenerating(false);
      
      // Handle specific error types
      if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        setError('Unable to connect to the AI service. Please ensure all services are running and try again.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('The initial request is taking longer than expected. This is normal for complex projects. The generation will continue in the background.');
        // Don't stop the generation process, just show a warning
        setIsGenerating(false);
        // Try to get a project ID from the error response if available
        if (err.response?.data?.execution_id) {
          setCurrentProjectId(err.response.data.execution_id);
        }
      } else if (err.response?.status === 500) {
        setError('Internal server error. Please check the service logs and try again.');
      } else if (err.response?.status === 400) {
        setError('Invalid request. Please check your input and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleProgressComplete = (result: ProjectResult) => {
    setIsGenerating(false);
    setShowResults(true);
  };

  const handleExampleClick = (exampleDescription: string) => {
    setDescription(exampleDescription);
  };

  // AI-powered handlers
  const handleRequirementsParsed = (result: ClassificationResult) => {
    setAnalysisResult(result);
    setShowAIInsights(true);
    
    // Generate recommended templates based on analysis
    const templates = projectTemplateService.getRecommendedTemplates(result.intent);
    setRecommendedTemplates(templates);
    
    // Auto-generate project name if not provided
    if (!projectName && result.intent.projectType) {
      const generatedName = generateProjectName(result.intent);
      setProjectName(generatedName);
    }
  };

  const generateProjectName = (intent: any) => {
    const typeNames = {
      calculator: 'smart-calculator',
      todo: 'task-manager',
      api: 'rest-api',
      data_analysis: 'data-analyzer',
      web_app: 'web-application',
      game: 'game-app',
      gui_app: 'desktop-app',
      utility: 'utility-tool'
    };
    
    const baseName = typeNames[intent.projectType as keyof typeof typeNames] || 'my-project';
    const complexity = intent.complexity !== 'simple' ? `-${intent.complexity}` : '';
    return `${baseName}${complexity}`;
  };

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setDescription(template.requirements);
    setProjectName(template.id);
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

            {/* AI-Powered Project Input */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <Brain className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">AI-Powered Project Builder</h3>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  NEW
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Smart Requirement Input */}
                <SmartRequirementInput
                  onRequirementsParsed={handleRequirementsParsed}
                  onInputChange={setDescription}
                  placeholder="Describe what you want to build... Our AI will analyze your requirements and suggest improvements!"
                  initialValue={description}
                />
                
                {/* Project Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Project Name {projectName && '(AI Generated)'}
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="my-awesome-project"
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={isGenerating}
                  />
                  {analysisResult && (
                    <p className="text-xs text-gray-500 mt-2">
                      💡 AI suggested this name based on your project type and complexity
                    </p>
                  )}
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

            {/* AI Insights & Recommendations */}
            {showAIInsights && analysisResult && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <Zap className="w-6 h-6 text-yellow-600" />
                  <h3 className="text-xl font-semibold text-gray-900">AI Insights & Recommendations</h3>
                </div>

                {/* Recommended Templates */}
                {recommendedTemplates.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center space-x-2 mb-4">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <h4 className="font-semibold text-gray-800">Recommended Templates</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendedTemplates.slice(0, 4).map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-gray-900 group-hover:text-blue-700">
                              {template.name}
                            </h5>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{template.estimatedTime}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {template.features.slice(0, 3).map((feature, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                              >
                                {feature.replace('_', ' ')}
                              </span>
                            ))}
                            {template.features.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{template.features.length - 3} more
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Project Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-blue-900">Project Type</span>
                    </div>
                    <p className="text-blue-800 capitalize">
                      {analysisResult.intent.projectType.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {Math.round(analysisResult.intent.confidence * 100)}% confidence
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-medium text-green-900">Complexity</span>
                    </div>
                    <p className="text-green-800 capitalize">{analysisResult.intent.complexity}</p>
                    <p className="text-xs text-green-600 mt-1">
                      Estimated development time
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-medium text-purple-900">Features</span>
                    </div>
                    <p className="text-purple-800">
                      {analysisResult.intent.features.length} detected
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      AI-identified capabilities
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Tracker */}
            {currentProjectId && isGenerating && !showResults && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <ProgressTracker 
                  projectId={currentProjectId} 
                  onComplete={handleProgressComplete}
                />
              </div>
            )}

            {/* Results */}
            {showResults && currentProjectId && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <ResultsDisplay projectId={currentProjectId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

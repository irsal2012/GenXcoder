import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
  Play, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Database,
  Globe,
  MessageSquare,
  Sparkles,
  Zap,
  Rocket,
  Brain,
  Code2,
  Wand2,
  Star,
  TrendingUp,
  Shield,
  Clock
} from 'lucide-react';
import apiClient from '@/services/api';
import ProgressTracker from '@/components/progress/ProgressTracker';
import ResultsDisplay from '@/components/results/ResultsDisplay';
import { GenerateCodeRequest } from '@/types/api';

interface FormData {
  userInput: string;
  projectName: string;
}

const CodeGenerator: React.FC = () => {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>();
  const userInput = watch('userInput');

  // Pipeline status query
  const { data: pipelineStatus } = useQuery({
    queryKey: ['pipeline-status'],
    queryFn: () => apiClient.getPipelineStatus(),
    refetchInterval: 30000,
  });

  // Input validation query
  const { data: validation } = useQuery({
    queryKey: ['validation', userInput],
    queryFn: () => apiClient.validateInput(userInput),
    enabled: !!userInput && userInput.length > 10,
    staleTime: 5000,
  });

  // Generation mutation
  const generateMutation = useMutation({
    mutationFn: (data: GenerateCodeRequest) => apiClient.generateCode(data),
    onSuccess: (response) => {
      setCurrentProjectId(response.project_id);
      setShowResults(false);
    },
    onError: (error) => {
      console.error('Generation failed:', error);
    },
  });

  const onSubmit = (data: FormData) => {
    generateMutation.mutate({
      user_input: data.userInput,
      project_name: data.projectName || undefined,
    });
  };

  const handleExampleClick = (example: string) => {
    setValue('userInput', example);
  };

  const examples = [
    {
      title: 'Data Analysis Tool',
      description: 'CSV analysis with beautiful visualizations',
      icon: BarChart3,
      gradient: 'from-blue-500 to-cyan-500',
      prompt: 'Create a data analysis tool that reads CSV files, performs statistical analysis, generates interactive visualizations, and exports comprehensive reports in PDF format.',
    },
    {
      title: 'Web API',
      description: 'REST API with authentication & security',
      icon: Globe,
      gradient: 'from-green-500 to-emerald-500',
      prompt: 'Build a REST API for a task management system with JWT authentication, CRUD operations for tasks, real-time notifications, and comprehensive API documentation.',
    },
    {
      title: 'AI Chatbot',
      description: 'Intelligent conversation bot',
      icon: MessageSquare,
      gradient: 'from-purple-500 to-pink-500',
      prompt: 'Create an intelligent chatbot that can answer questions about a knowledge base, with conversation history, context awareness, and natural language processing.',
    },
  ];

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered',
      description: 'Advanced AI agents work together',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Generate code in minutes',
    },
    {
      icon: Shield,
      title: 'Production Ready',
      description: 'Clean, tested, documented code',
    },
    {
      icon: Code2,
      title: 'Best Practices',
      description: 'Following industry standards',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="card p-8 md:p-12 text-center relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl"></div>
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Rocket className="h-16 w-16 text-blue-500 animate-float" />
                <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Transform Ideas into
              <span className="gradient-text block">Amazing Applications</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Harness the power of our AI-powered multi-agent system to create complete Python applications 
              from simple descriptions. No coding experience required.
            </p>
            
            {/* Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="text-center p-4 bg-white/50 rounded-2xl backdrop-blur-sm">
                    <Icon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
                    <p className="text-xs text-gray-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Status */}
      {pipelineStatus && (
        <div className="card p-6 hover:shadow-glass-hover transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900">Pipeline Status</h2>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Real-time monitoring</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {pipelineStatus.current_progress.total_steps}
              </div>
              <div className="text-sm text-blue-700 font-medium">Total Steps</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {pipelineStatus.current_progress.completed_steps}
              </div>
              <div className="text-sm text-green-700 font-medium">Completed</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {pipelineStatus.current_progress.failed_steps}
              </div>
              <div className="text-sm text-red-700 font-medium">Failed</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {pipelineStatus.current_progress.progress_percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-purple-700 font-medium">Progress</div>
            </div>
          </div>
          
          {pipelineStatus.current_progress.total_steps > 0 && (
            <div className="relative">
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="progress-bar h-3 transition-all duration-500 ease-out"
                  style={{ width: `${pipelineStatus.current_progress.progress_percentage}%` }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-white drop-shadow-sm">
                  {pipelineStatus.current_progress.progress_percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Examples */}
      <div className="card p-6 hover:shadow-glass-hover transition-all duration-300">
        <div className="flex items-center space-x-3 mb-6">
          <Wand2 className="h-6 w-6 text-purple-500" />
          <h2 className="text-xl font-bold text-gray-900">Quick Start Examples</h2>
          <Star className="h-5 w-5 text-yellow-500 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {examples.map((example, index) => {
            const Icon = example.icon;
            return (
              <button
                key={example.title}
                onClick={() => handleExampleClick(example.prompt)}
                className="example-card p-6 text-left group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${example.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${example.gradient} text-white mr-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 group-hover:text-white transition-colors duration-300">
                        {example.title}
                      </h3>
                      <p className="text-sm text-gray-600 group-hover:text-white/80 transition-colors duration-300">
                        {example.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 group-hover:text-white/70 transition-colors duration-300">
                    <Sparkles className="h-4 w-4 mr-1" />
                    <span>Click to use this example</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generation Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="card p-8 hover:shadow-glass-hover transition-all duration-300">
        <div className="flex items-center space-x-3 mb-6">
          <Code2 className="h-6 w-6 text-green-500" />
          <h2 className="text-xl font-bold text-gray-900">Describe Your Project</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="userInput" className="block text-sm font-semibold text-gray-700 mb-3">
              What would you like to build? ✨
            </label>
            <textarea
              {...register('userInput', { 
                required: 'Please describe what you want to build',
                minLength: { value: 10, message: 'Please provide more details (at least 10 characters)' }
              })}
              rows={6}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm resize-none"
              placeholder="Example: Create a web scraper that extracts product information from e-commerce websites, stores the data in a database, and provides a REST API to query the results with real-time analytics dashboard."
            />
            {errors.userInput && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <XCircle className="h-4 w-4 mr-1" />
                {errors.userInput.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="projectName" className="block text-sm font-semibold text-gray-700 mb-3">
              Project Name (optional) 🏷️
            </label>
            <input
              {...register('projectName')}
              type="text"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
              placeholder="my-awesome-project"
            />
          </div>

          {/* Validation feedback */}
          {validation && (
            <div className="space-y-4">
              {validation.warnings && validation.warnings.length > 0 && (
                <div className="notification notification-warning p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-800 mb-2">
                        💡 Suggestions for better results:
                      </p>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {validation.warnings.map((warning, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {validation.suggestions && validation.suggestions.length > 0 && (
                <div className="notification notification-info p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-800 mb-2">
                        ✨ Enhancement suggestions:
                      </p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {validation.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={generateMutation.isPending}
            className="w-full btn-primary flex items-center justify-center px-8 py-4 text-lg font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="animate-spin h-6 w-6 mr-3" />
                <span>Starting Generation...</span>
                <div className="ml-3 flex space-x-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </>
            ) : (
              <>
                <Rocket className="h-6 w-6 mr-3 group-hover:animate-bounce" />
                <span>Generate Application</span>
                <Sparkles className="h-5 w-5 ml-3 group-hover:animate-pulse" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {generateMutation.error && (
        <div className="notification notification-error p-6 animate-slide-down">
          <div className="flex items-start space-x-4">
            <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Generation Failed
              </h3>
              <div className="text-sm text-red-700 bg-red-50 p-3 rounded-xl">
                {generateMutation.error instanceof Error 
                  ? generateMutation.error.message 
                  : 'An unexpected error occurred. Please try again.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Tracker */}
      {currentProjectId && !showResults && (
        <div className="animate-slide-up">
          <ProgressTracker
            projectId={currentProjectId}
            onComplete={(result) => {
              setShowResults(true);
            }}
          />
        </div>
      )}

      {/* Results Display */}
      {showResults && currentProjectId && (
        <div className="animate-slide-up">
          <ResultsDisplay projectId={currentProjectId} />
        </div>
      )}
    </div>
  );
};

export default CodeGenerator;

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
  MessageSquare
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
      description: 'CSV analysis with visualizations',
      icon: BarChart3,
      prompt: 'Create a data analysis tool that reads CSV files, performs statistical analysis, generates visualizations, and exports reports in PDF format.',
    },
    {
      title: 'Web API',
      description: 'REST API with authentication',
      icon: Globe,
      prompt: 'Build a REST API for a task management system with user authentication, CRUD operations for tasks, and email notifications.',
    },
    {
      title: 'Chatbot',
      description: 'AI-powered conversation bot',
      icon: MessageSquare,
      prompt: 'Create an intelligent chatbot that can answer questions about a knowledge base, with conversation history and context awareness.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          🚀 Generate Your Application
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Transform your ideas into complete Python applications using our AI-powered multi-agent system.
        </p>
      </div>

      {/* Pipeline Status */}
      {pipelineStatus && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Pipeline Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {pipelineStatus.current_progress.total_steps}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Steps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {pipelineStatus.current_progress.completed_steps}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {pipelineStatus.current_progress.failed_steps}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {pipelineStatus.current_progress.progress_percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
            </div>
          </div>
          
          {pipelineStatus.current_progress.total_steps > 0 && (
            <div className="mt-4">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${pipelineStatus.current_progress.progress_percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Examples */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Examples
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {examples.map((example) => {
            const Icon = example.icon;
            return (
              <button
                key={example.title}
                onClick={() => handleExampleClick(example.prompt)}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-center mb-2">
                  <Icon className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {example.title}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {example.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generation Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Describe Your Project
        </h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="userInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What would you like to build?
            </label>
            <textarea
              {...register('userInput', { 
                required: 'Please describe what you want to build',
                minLength: { value: 10, message: 'Please provide more details (at least 10 characters)' }
              })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Example: Create a web scraper that extracts product information from e-commerce websites, stores the data in a database, and provides a REST API to query the results."
            />
            {errors.userInput && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.userInput.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Name (optional)
            </label>
            <input
              {...register('projectName')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="my-awesome-project"
            />
          </div>

          {/* Validation feedback */}
          {validation && (
            <div className="space-y-2">
              {validation.warnings && validation.warnings.length > 0 && (
                <div className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Suggestions for better results:
                    </p>
                    <ul className="mt-1 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                      {validation.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {validation.suggestions && validation.suggestions.length > 0 && (
                <div className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      💡 Suggestions:
                    </p>
                    <ul className="mt-1 text-sm text-blue-700 dark:text-blue-300 list-disc list-inside">
                      {validation.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={generateMutation.isPending}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Starting Generation...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                🚀 Generate Application
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {generateMutation.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Generation Failed
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {generateMutation.error instanceof Error 
                  ? generateMutation.error.message 
                  : 'An unexpected error occurred'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Tracker */}
      {currentProjectId && !showResults && (
        <ProgressTracker
          projectId={currentProjectId}
          onComplete={(result) => {
            setShowResults(true);
          }}
        />
      )}

      {/* Results Display */}
      {showResults && currentProjectId && (
        <ResultsDisplay projectId={currentProjectId} />
      )}
    </div>
  );
};

export default CodeGenerator;

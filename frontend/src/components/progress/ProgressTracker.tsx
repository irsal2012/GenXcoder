import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Clock, 
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Brain,
  Code,
  FileText,
  TestTube,
  Rocket,
  Palette,
  Activity,
  Timer
} from 'lucide-react';
import apiClient from '@/services/api';
import { ProjectProgress, ProjectResult } from '@/types/api';

interface ProgressTrackerProps {
  projectId: string;
  onComplete: (result: ProjectResult) => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ projectId, onComplete }) => {
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [uiGenerationDetected, setUiGenerationDetected] = useState(false);
  const [lastProgressPercentage, setLastProgressPercentage] = useState(0);

  const stepConfig = [
    {
      name: 'Requirements Analysis',
      icon: Brain,
      color: 'blue',
      description: 'Understanding your requirements',
    },
    {
      name: 'Code Generation',
      icon: Code,
      color: 'green',
      description: 'Writing your application code',
    },
    {
      name: 'Code Review',
      icon: CheckCircle,
      color: 'purple',
      description: 'Reviewing and optimizing code',
    },
    {
      name: 'Documentation',
      icon: FileText,
      color: 'orange',
      description: 'Creating comprehensive docs',
    },
    {
      name: 'Test Generation',
      icon: TestTube,
      color: 'pink',
      description: 'Writing automated tests',
    },
    {
      name: 'Deployment Config',
      icon: Rocket,
      color: 'red',
      description: 'Setting up deployment',
    },
    {
      name: 'UI Generation',
      icon: Palette,
      color: 'indigo',
      description: 'Designing user interface',
    },
  ];

  // Progress polling query
  const { 
    data: progress, 
    error: progressError,
    refetch: refetchProgress 
  } = useQuery<ProjectProgress>({
    queryKey: ['project-progress', projectId],
    queryFn: () => {
      const extendedTimeout = uiGenerationDetected || lastProgressPercentage > 85;
      return apiClient.getProjectProgress(projectId, extendedTimeout);
    },
    refetchInterval: (query) => {
      if (query.state.data?.is_completed) return false;
      if (uiGenerationDetected) return 3000;
      return 1000;
    },
    retry: (failureCount, error) => {
      const maxRetries = uiGenerationDetected ? 10 : 5;
      return failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Completion check query (fallback)
  const { data: completionStatus } = useQuery({
    queryKey: ['project-completion', projectId],
    queryFn: () => apiClient.checkProjectCompletionFallback(projectId),
    enabled: !!progressError || (progress?.is_completed === false && pollCount > 30),
    refetchInterval: 5000,
  });

  const handleCancel = async () => {
    try {
      await apiClient.cancelProject(projectId);
    } catch (error) {
      console.error('Failed to cancel project:', error);
    }
  };

  useEffect(() => {
    if (progress) {
      setPollCount(prev => prev + 1);
      
      if (progress.progress_percentage > lastProgressPercentage) {
        setLastProgressPercentage(progress.progress_percentage);
      }

      if (progress.progress_percentage > 85 || 
          progress.current_step_info?.agent_name === 'ui_designer' ||
          progress.current_step_info?.description?.toLowerCase().includes('ui')) {
        if (!uiGenerationDetected) {
          setUiGenerationDetected(true);
        }
      }

      if (progress.is_completed) {
        apiClient.getProjectResult(projectId)
          .then(result => {
            onComplete(result);
          })
          .catch(error => {
            console.error('Failed to get project result:', error);
          });
      }
    }
  }, [progress, projectId, onComplete, lastProgressPercentage, uiGenerationDetected]);

  useEffect(() => {
    if (completionStatus?.is_completed && completionStatus.result) {
      onComplete(completionStatus.result);
    }
  }, [completionStatus, onComplete]);

  if (!progress && !progressError) {
    return (
      <div className="card p-8 text-center animate-pulse">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-pulse" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Initializing Generation</h3>
        <p className="text-gray-600">Setting up your AI agents...</p>
      </div>
    );
  }

  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' = 'bg') => {
    const colorMap = {
      blue: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
      green: { bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' },
      purple: { bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500' },
      orange: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500' },
      pink: { bg: 'bg-pink-500', text: 'text-pink-500', border: 'border-pink-500' },
      red: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
      indigo: { bg: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-500' },
    };
    return colorMap[color as keyof typeof colorMap]?.[variant] || colorMap.blue[variant];
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header Card */}
      <div className="card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Activity className="h-8 w-8 text-blue-500 animate-pulse" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Generation in Progress</h2>
                <p className="text-gray-600">Your AI agents are working hard</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-all duration-200 flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>

          {/* Status Message */}
          <div className="mb-6">
            {progress?.is_completed ? (
              <div className="flex items-center p-4 bg-green-50 rounded-2xl border border-green-200">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                <div>
                  <div className="font-semibold text-green-800">Generation Completed!</div>
                  <div className="text-sm text-green-600">Your application is ready</div>
                </div>
              </div>
            ) : progress?.has_failures ? (
              <div className="flex items-center p-4 bg-red-50 rounded-2xl border border-red-200">
                <XCircle className="h-6 w-6 text-red-500 mr-3" />
                <div>
                  <div className="font-semibold text-red-800">Generation Failed</div>
                  <div className="text-sm text-red-600">Please check the error details below</div>
                </div>
              </div>
            ) : progress?.is_running ? (
              <div className="flex items-center p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <Loader2 className="animate-spin h-6 w-6 text-blue-500 mr-3" />
                <div className="flex-1">
                  <div className="font-semibold text-blue-800">
                    {progress.current_step_info ? (
                      uiGenerationDetected ? (
                        `Creating your interface: ${progress.current_step_info.description}`
                      ) : (
                        progress.current_step_info.description
                      )
                    ) : (
                      uiGenerationDetected 
                        ? 'Designing your user interface...'
                        : 'Processing your request...'
                    )}
                  </div>
                  <div className="text-sm text-blue-600">
                    {progress.current_step_info?.agent_name && (
                      <span className="inline-flex items-center space-x-1">
                        <Brain className="h-3 w-3" />
                        <span>Agent: {progress.current_step_info.agent_name}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {progress.progress_percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-blue-500">Complete</div>
                </div>
              </div>
            ) : progressError ? (
              <div className="flex items-center p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3" />
                <div>
                  <div className="font-semibold text-yellow-800">Connection Issues</div>
                  <div className="text-sm text-yellow-600">Checking for completion...</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <Clock className="h-6 w-6 text-gray-500 mr-3" />
                <div>
                  <div className="font-semibold text-gray-800">Initializing</div>
                  <div className="text-sm text-gray-600">Setting up your project...</div>
                </div>
              </div>
            )}
          </div>

          {/* Overall Progress Bar */}
          {progress && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {progress.progress_percentage.toFixed(1)}% Complete
                  </span>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="progress-bar h-4 transition-all duration-500 ease-out relative"
                    style={{ width: `${progress.progress_percentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white drop-shadow-sm">
                    {progress.progress_percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Zap className="h-6 w-6 text-purple-500" />
          <h3 className="text-xl font-bold text-gray-900">Pipeline Steps</h3>
        </div>
        
        <div className="space-y-4">
          {stepConfig.map((stepConfig, index) => {
            const step = progress?.steps?.[index];
            const status = step?.status || 'pending';
            const stepProgress = step?.progress_percentage || 0;
            const Icon = stepConfig.icon;
            
            let statusIcon;
            let statusColor;
            let bgClass;
            let borderClass;
            
            switch (status) {
              case 'completed':
                statusIcon = <CheckCircle className="h-5 w-5 text-green-500" />;
                statusColor = 'text-green-700';
                bgClass = 'bg-green-50';
                borderClass = 'border-green-200';
                break;
              case 'running':
                statusIcon = <Loader2 className="animate-spin h-5 w-5 text-blue-500" />;
                statusColor = 'text-blue-700';
                bgClass = 'bg-blue-50';
                borderClass = 'border-blue-200';
                break;
              case 'failed':
                statusIcon = <XCircle className="h-5 w-5 text-red-500" />;
                statusColor = 'text-red-700';
                bgClass = 'bg-red-50';
                borderClass = 'border-red-200';
                break;
              default:
                statusIcon = <Clock className="h-5 w-5 text-gray-400" />;
                statusColor = 'text-gray-600';
                bgClass = 'bg-gray-50';
                borderClass = 'border-gray-200';
            }
            
            return (
              <div key={index} className={`p-4 rounded-2xl border-2 ${bgClass} ${borderClass} transition-all duration-300`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-xl ${getColorClasses(stepConfig.color)} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-semibold ${statusColor}`}>
                          {index + 1}. {stepConfig.name}
                        </span>
                        {statusIcon}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{stepConfig.description}</p>
                    </div>
                  </div>
                  {status === 'running' && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {stepProgress.toFixed(0)}%
                      </div>
                      <div className="text-xs text-blue-500">Progress</div>
                    </div>
                  )}
                </div>
                
                {status === 'running' && stepProgress > 0 && (
                  <div className="mt-3">
                    <div className="bg-white/50 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getColorClasses(stepConfig.color)}`}
                        style={{ width: `${stepProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Special message for UI generation */}
                {index === 6 && status === 'running' && (
                  <div className="mt-3 p-3 bg-indigo-100 rounded-xl border border-indigo-200">
                    <div className="flex items-center space-x-2 text-indigo-700">
                      <Palette className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        AI is crafting your beautiful user interface - this may take a moment...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Debug Information */}
      <div className="card p-4">
        <button
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 rounded-xl transition-colors duration-200"
        >
          <span className="text-sm font-medium text-gray-700">Debug Information</span>
          {showDebugInfo ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        
        {showDebugInfo && (
          <div className="mt-4 p-4 bg-gray-900 rounded-xl overflow-hidden">
            <pre className="text-xs text-green-400 overflow-auto font-mono">
              {JSON.stringify({
                progress_percentage: progress?.progress_percentage,
                is_running: progress?.is_running,
                is_completed: progress?.is_completed,
                has_failures: progress?.has_failures,
                completed_steps: progress?.completed_steps,
                total_steps: progress?.total_steps,
                poll_count: pollCount,
                ui_generation_detected: uiGenerationDetected,
                last_progress_percentage: lastProgressPercentage,
                current_step: progress?.current_step_info?.name,
                error: progressError?.message,
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Error logs */}
      {progress?.logs && progress.logs.some(log => log.level === 'ERROR') && (
        <div className="notification notification-error p-6">
          <div className="flex items-start space-x-3">
            <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-red-800 mb-3">Error Details</h4>
              <div className="space-y-2">
                {progress.logs
                  .filter(log => log.level === 'ERROR')
                  .slice(-3)
                  .map((log, index) => (
                    <div key={index} className="p-3 bg-red-100 rounded-xl">
                      <div className="text-sm text-red-700 font-mono">
                        {log.message}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;

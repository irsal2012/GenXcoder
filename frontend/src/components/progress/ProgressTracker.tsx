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
  ChevronUp
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

  const stepNames = [
    'Requirements Analysis',
    'Code Generation',
    'Code Review',
    'Documentation',
    'Test Generation',
    'Deployment Config',
    'UI Generation',
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
      // Adaptive polling interval
      if (query.state.data?.is_completed) return false; // Stop polling when completed
      if (uiGenerationDetected) return 3000; // Slower polling during UI generation
      return 1000; // Normal polling
    },
    retry: (failureCount, error) => {
      // More retries during UI generation
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

  // Cancel project mutation
  const handleCancel = async () => {
    try {
      await apiClient.cancelProject(projectId);
    } catch (error) {
      console.error('Failed to cancel project:', error);
    }
  };

  // Effect to track polling and detect UI generation
  useEffect(() => {
    if (progress) {
      setPollCount(prev => prev + 1);
      
      // Update progress percentage tracking
      if (progress.progress_percentage > lastProgressPercentage) {
        setLastProgressPercentage(progress.progress_percentage);
      }

      // Detect UI generation phase
      if (progress.progress_percentage > 85 || 
          progress.current_step_info?.agent_name === 'ui_designer' ||
          progress.current_step_info?.description?.toLowerCase().includes('ui')) {
        if (!uiGenerationDetected) {
          setUiGenerationDetected(true);
        }
      }

      // Check for completion
      if (progress.is_completed) {
        // Fetch final result
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

  // Handle completion status from fallback
  useEffect(() => {
    if (completionStatus?.is_completed && completionStatus.result) {
      onComplete(completionStatus.result);
    }
  }, [completionStatus, onComplete]);

  if (!progress && !progressError) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="animate-spin h-6 w-6 text-blue-600 mr-2" />
          <span className="text-gray-600 dark:text-gray-400">
            🔍 Checking project status...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          🚀 Generation in Progress
        </h2>
        <button
          onClick={handleCancel}
          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
        >
          <X className="h-4 w-4 inline mr-1" />
          Cancel
        </button>
      </div>

      {/* Status Message */}
      <div className="mb-4">
        {progress?.is_completed ? (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">✅ Generation Completed Successfully!</span>
          </div>
        ) : progress?.has_failures ? (
          <div className="flex items-center text-red-600 dark:text-red-400">
            <XCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">❌ Generation Failed</span>
          </div>
        ) : progress?.is_running ? (
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            <span className="font-medium">
              {progress.current_step_info ? (
                uiGenerationDetected ? (
                  `🎨 ${progress.current_step_info.description} - AI is generating your interface...`
                ) : (
                  `🔄 ${progress.current_step_info.description}${
                    progress.current_step_info.agent_name 
                      ? ` (Agent: ${progress.current_step_info.agent_name})` 
                      : ''
                  }`
                )
              ) : (
                uiGenerationDetected 
                  ? `🎨 UI Generation in Progress... (${progress.progress_percentage.toFixed(1)}% complete)`
                  : `🔄 Processing... (${progress.progress_percentage.toFixed(1)}% complete)`
              )}
            </span>
          </div>
        ) : progressError ? (
          <div className="flex items-center text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span className="font-medium">
              ⚠️ Connection issues - checking for completion...
            </span>
          </div>
        ) : (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Clock className="h-5 w-5 mr-2" />
            <span className="font-medium">⏳ Initializing...</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {progress && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Overall Progress</span>
            <span>{progress.progress_percentage.toFixed(1)}%</span>
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress.progress_percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Pipeline Steps */}
      <div className="space-y-3">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          📋 Pipeline Steps
        </h3>
        
        {stepNames.map((stepName, index) => {
          const step = progress?.steps?.[index];
          const status = step?.status || 'pending';
          const stepProgress = step?.progress_percentage || 0;
          
          let icon;
          let textColor;
          let bgColor;
          
          switch (status) {
            case 'completed':
              icon = <CheckCircle className="h-5 w-5 text-green-500" />;
              textColor = 'text-green-700 dark:text-green-400';
              bgColor = 'bg-green-50 dark:bg-green-900/20';
              break;
            case 'running':
              icon = <Loader2 className="animate-spin h-5 w-5 text-blue-500" />;
              textColor = 'text-blue-700 dark:text-blue-400';
              bgColor = 'bg-blue-50 dark:bg-blue-900/20';
              break;
            case 'failed':
              icon = <XCircle className="h-5 w-5 text-red-500" />;
              textColor = 'text-red-700 dark:text-red-400';
              bgColor = 'bg-red-50 dark:bg-red-900/20';
              break;
            default:
              icon = <Clock className="h-5 w-5 text-gray-400" />;
              textColor = 'text-gray-600 dark:text-gray-400';
              bgColor = 'bg-gray-50 dark:bg-gray-800';
          }
          
          return (
            <div key={index} className={`p-3 rounded-lg ${bgColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {icon}
                  <span className={`ml-3 font-medium ${textColor}`}>
                    {index + 1}. {stepName}
                  </span>
                </div>
                {status === 'running' && (
                  <span className="text-sm text-gray-500">
                    {stepProgress.toFixed(0)}%
                  </span>
                )}
              </div>
              
              {status === 'running' && stepProgress > 0 && (
                <div className="mt-2 ml-8">
                  <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                    <div
                      className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${stepProgress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Special message for UI generation */}
              {index === 6 && status === 'running' && (
                <div className="mt-2 ml-8 text-sm text-blue-600 dark:text-blue-400">
                  🎨 AI is creating your user interface - this may take a moment...
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Debug Information */}
      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          {showDebugInfo ? (
            <ChevronUp className="h-4 w-4 mr-1" />
          ) : (
            <ChevronDown className="h-4 w-4 mr-1" />
          )}
          Debug Information
        </button>
        
        {showDebugInfo && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
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
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Error Details:
          </h4>
          {progress.logs
            .filter(log => log.level === 'ERROR')
            .slice(-3) // Show last 3 errors
            .map((log, index) => (
              <div key={index} className="text-sm text-red-700 dark:text-red-300">
                {log.message}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;

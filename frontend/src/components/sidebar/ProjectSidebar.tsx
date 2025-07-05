import React from 'react';
import { PipelineStatus } from '../../types/api';
import { 
  FileText, 
  Eye, 
  Brain, 
  Upload, 
  Zap, 
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';

interface ProjectSidebarProps {
  pipelineStatus: PipelineStatus | null;
  isGenerating: boolean;
  projectName: string;
  description: string;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ 
  pipelineStatus, 
  isGenerating, 
  projectName,
  description 
}) => {
  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto flex flex-col">
      {/* Project Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700 truncate">
            {projectName || 'untitled-project'}
          </span>
        </div>
        
        {description && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              {description.length > 150 ? `${description.substring(0, 150)}...` : description}
            </p>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center space-x-2 text-sm">
          {isGenerating ? (
            <>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-orange-600 font-medium">Thinking</span>
            </>
          ) : pipelineStatus && pipelineStatus.current_progress.completed_steps === pipelineStatus.current_progress.total_steps ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-600 font-medium">Completed</span>
            </>
          ) : pipelineStatus && pipelineStatus.current_progress.failed_steps > 0 ? (
            <>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-600 font-medium">Failed</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-gray-500 font-medium">Ready</span>
            </>
          )}
        </div>
      </div>

      {/* Pipeline Progress */}
      {pipelineStatus && (
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Pipeline Progress</h3>
            <span className="text-xs text-gray-500">
              {pipelineStatus.current_progress.completed_steps}/{pipelineStatus.current_progress.total_steps}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span>{pipelineStatus.current_progress.progress_percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${pipelineStatus.current_progress.progress_percentage}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {pipelineStatus.current_progress.completed_steps}
                </div>
                <div className="text-xs text-gray-500">Done</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">
                  {pipelineStatus.current_progress.total_steps - pipelineStatus.current_progress.completed_steps - pipelineStatus.current_progress.failed_steps}
                </div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">
                  {pipelineStatus.current_progress.failed_steps}
                </div>
                <div className="text-xs text-gray-500">Failed</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="flex-1 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Features</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Upload files as reference</div>
              <div className="text-xs text-gray-500">Add context to your project</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Instantly preview changes</div>
              <div className="text-xs text-gray-500">See results in real-time</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">AI-powered suggestions</div>
              <div className="text-xs text-gray-500">Smart code recommendations</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Lightning fast generation</div>
              <div className="text-xs text-gray-500">Optimized for speed</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Complete documentation</div>
              <div className="text-xs text-gray-500">Auto-generated docs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="p-6 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Agent (Beta) costs adapt to task complexity</span>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            Read more
          </button>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

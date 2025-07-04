import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  History, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  TrendingUp
} from 'lucide-react';
import apiClient from '@/services/api';
import { ProjectHistory as ProjectHistoryType, ProjectStatistics } from '@/types/api';

const ProjectHistory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSuccess, setFilterSuccess] = useState<boolean | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Fetch project statistics
  const { data: statistics } = useQuery<ProjectStatistics>({
    queryKey: ['project-statistics'],
    queryFn: () => apiClient.getProjectStatistics(),
    retry: 2,
  });

  // Fetch project history
  const { data: history, isLoading, error, refetch } = useQuery<ProjectHistoryType>({
    queryKey: ['project-history', filterSuccess],
    queryFn: () => apiClient.getProjectHistory(50, 0, filterSuccess),
    retry: 2,
  });

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const filteredProjects = history?.projects?.filter(project => {
    if (!searchQuery) return true;
    return (
      project.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.user_input.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600 mr-3" />
        <span className="text-lg text-gray-600 dark:text-gray-400">Loading project history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center text-red-600 dark:text-red-400">
          <AlertCircle className="h-6 w-6 mr-2" />
          <span>Failed to load project history</span>
        </div>
      </div>
    );
  }

  if (!history?.projects || history.projects.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📚 Project History
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View and manage your generated projects.
          </p>
        </div>

        {/* Empty State */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No projects generated yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start by creating your first application using the Code Generator.
          </p>
          <button
            onClick={() => window.location.href = '/generator'}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Create Your First Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          📚 Project History
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          View and manage your generated projects.
        </p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Summary Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.total_projects}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {statistics.successful_projects}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {statistics.failed_projects}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {statistics.success_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterSuccess === undefined ? 'all' : filterSuccess ? 'success' : 'failed'}
              onChange={(e) => {
                const value = e.target.value;
                setFilterSuccess(
                  value === 'all' ? undefined : value === 'success'
                );
              }}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Projects</option>
              <option value="success">Successful Only</option>
              <option value="failed">Failed Only</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Project List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Projects ({filteredProjects.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredProjects.map((project, index) => (
            <div key={project.project_id || index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                      {project.project_name}
                    </h3>
                    {project.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {project.user_input.length > 200 
                      ? `${project.user_input.substring(0, 200)}...` 
                      : project.user_input}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(project.timestamp)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {project.execution_time.toFixed(1)}s
                    </div>
                    {project.success && (
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Completed
                      </div>
                    )}
                  </div>

                  {!project.success && project.error && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Error: {project.error}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {project.success && (
                    <button
                      onClick={() => setSelectedProject(project.project_id)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const projectData = {
                        project_id: project.project_id,
                        project_name: project.project_name,
                        timestamp: project.timestamp,
                        success: project.success,
                        execution_time: project.execution_time,
                        user_input: project.user_input,
                        error: project.error,
                      };
                      const blob = new Blob([JSON.stringify(projectData, null, 2)], { 
                        type: 'application/json' 
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${project.project_name}_metadata.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Project Details
              </h3>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {/* This would show the ResultsDisplay component */}
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  Project details would be displayed here using the ResultsDisplay component.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Project ID: {selectedProject}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHistory;

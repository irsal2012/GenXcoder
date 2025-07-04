import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Download, 
  Code, 
  FileText, 
  TestTube, 
  Rocket, 
  Palette, 
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import apiClient from '@/services/api';
import { ProjectResult } from '@/types/api';

interface ResultsDisplayProps {
  projectId: string;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState('requirements');
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // Fetch project result
  const { data: result, isLoading, error } = useQuery<ProjectResult>({
    queryKey: ['project-result', projectId],
    queryFn: () => apiClient.getProjectResult(projectId),
    retry: 3,
    retryDelay: 1000,
  });

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <Clock className="animate-spin h-6 w-6 text-blue-600 mr-2" />
          <span className="text-gray-600 dark:text-gray-400">
            Loading results...
          </span>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center text-red-600 dark:text-red-400">
          <AlertCircle className="h-6 w-6 mr-2" />
          <span>Failed to load project results</span>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'requirements',
      name: 'Requirements',
      icon: FileText,
      content: result.requirements,
      available: !!result.requirements,
    },
    {
      id: 'code',
      name: 'Code',
      icon: Code,
      content: result.code?.final_code,
      available: !!result.code?.final_code,
      filename: `${result.project_name || 'project'}_main.py`,
    },
    {
      id: 'documentation',
      name: 'Documentation',
      icon: FileText,
      content: result.documentation?.readme,
      available: !!result.documentation?.readme,
      filename: `${result.project_name || 'project'}_README.md`,
      language: 'markdown',
    },
    {
      id: 'tests',
      name: 'Tests',
      icon: TestTube,
      content: result.tests?.test_code,
      available: !!result.tests?.test_code,
      filename: `${result.project_name || 'project'}_test_main.py`,
    },
    {
      id: 'deployment',
      name: 'Deployment',
      icon: Rocket,
      content: result.deployment?.deployment_configs,
      available: !!result.deployment?.deployment_configs,
      filename: `${result.project_name || 'project'}_deployment.md`,
      language: 'markdown',
    },
    {
      id: 'ui',
      name: 'UI',
      icon: Palette,
      content: result.ui?.streamlit_app,
      available: !!result.ui?.streamlit_app,
      filename: `${result.project_name || 'project'}_streamlit_app.py`,
    },
  ];

  const availableTabs = tabs.filter(tab => tab.available);
  const currentTab = availableTabs.find(tab => tab.id === activeTab) || availableTabs[0];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Success Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center text-green-600 dark:text-green-400 mb-4">
          <CheckCircle className="h-6 w-6 mr-2" />
          <h2 className="text-xl font-semibold">🎉 Your application has been generated successfully!</h2>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {result.project_name || 'Unknown'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Project Name</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {result.pipeline_metadata?.execution_time_seconds?.toFixed(1) || result.execution_time?.toFixed(1) || 'N/A'}s
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Generation Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {result.progress?.progress_percentage?.toFixed(0) || '100'}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completion</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {currentTab && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentTab.name}
              </h3>
              <div className="flex space-x-2">
                {currentTab.content && (
                  <>
                    <button
                      onClick={() => copyToClipboard(currentTab.content || '', currentTab.id)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {copiedStates[currentTab.id] ? 'Copied!' : 'Copy'}
                    </button>
                    {currentTab.filename && (
                      <button
                        onClick={() => downloadFile(currentTab.content || '', currentTab.filename)}
                        className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {currentTab.content ? (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-auto">
                {currentTab.id === 'requirements' ? (
                  <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {JSON.stringify(currentTab.content, null, 2)}
                  </pre>
                ) : currentTab.language === 'markdown' ? (
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {currentTab.content}
                    </pre>
                  </div>
                ) : (
                  <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
                    <code>{currentTab.content}</code>
                  </pre>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No {currentTab.name.toLowerCase()} available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Download All */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-6">
        <button
          onClick={() => {
            const allResults = {
              project_name: result.project_name,
              timestamp: result.timestamp,
              user_input: result.user_input,
              requirements: result.requirements,
              code: result.code,
              documentation: result.documentation,
              tests: result.tests,
              deployment: result.deployment,
              ui: result.ui,
              metadata: result.pipeline_metadata,
            };
            downloadFile(
              JSON.stringify(allResults, null, 2),
              `${result.project_name || 'project'}_complete_results.json`,
              'application/json'
            );
          }}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          <Download className="h-4 w-4 mr-2" />
          📥 Download Complete Results (JSON)
        </button>
      </div>
    </div>
  );
};

export default ResultsDisplay;

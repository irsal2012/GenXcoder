import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Code, 
  Settings,
  Maximize2,
  Minimize2,
  Split,
  Eye,
  EyeOff
} from 'lucide-react';
import { ConversationInterface } from '../components/chat';
import TeamCollaboration from '../components/collaboration/TeamCollaboration';
import ProgressTracker from '../components/progress/ProgressTracker';
import ResultsDisplay from '../components/results/ResultsDisplay';
import { collaborationService, CollaborationSession } from '../services/collaboration/CollaborationService';
import apiClient from '../services/api';
import { GenerateCodeRequest, GenerationResponse } from '../types/api';

export const CollaborativeWorkspace: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<CollaborationSession | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Layout state
  const [layout, setLayout] = useState<'split' | 'chat-focus' | 'collab-focus'>('split');
  const [showCollaboration, setShowCollaboration] = useState(true);
  
  // Mock project ID for demo
  const projectId = 'collaborative-project-1';

  useEffect(() => {
    // Initialize user for collaboration
    const initializeUser = () => {
      const currentUser = collaborationService.getCurrentUser();
      if (!currentUser) {
        const mockUser = collaborationService.createMockUser(
          'Demo User',
          'demo@genxcoder.com'
        );
        collaborationService.setCurrentUser(mockUser);
      }
    };

    initializeUser();
  }, []);

  const handleReadyForGeneration = async (finalContext: any) => {
    if (!finalContext.projectType || !finalContext.requirements) {
      setError('Missing required project information');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const request: GenerateCodeRequest = {
        user_input: finalContext.requirements,
        project_name: finalContext.projectName || `${finalContext.projectType}-collaborative-app`
      };

      const response: GenerationResponse = await apiClient.generateCode(request);
      setCurrentProjectId(response.project_id);

      // Notify collaboration session about the generation
      if (currentSession) {
        collaborationService.sendMessage(
          `🚀 Started generating: ${finalContext.projectName || 'New Project'}`,
          'system'
        );
      }
    } catch (err) {
      setIsGenerating(false);
      setError(err instanceof Error ? err.message : 'An error occurred during generation');
    }
  };

  const handleGenerationComplete = () => {
    setIsGenerating(false);
    setShowResults(true);

    // Notify collaboration session about completion
    if (currentSession) {
      collaborationService.sendMessage(
        '✅ Code generation completed! Check out the results.',
        'system'
      );
    }
  };

  const handleSessionChange = (session: CollaborationSession | null) => {
    setCurrentSession(session);
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case 'chat-focus':
        return 'grid-cols-1 lg:grid-cols-4';
      case 'collab-focus':
        return 'grid-cols-1 lg:grid-cols-4';
      case 'split':
      default:
        return 'grid-cols-1 lg:grid-cols-2';
    }
  };

  const getChatClasses = () => {
    switch (layout) {
      case 'chat-focus':
        return 'lg:col-span-3';
      case 'collab-focus':
        return 'lg:col-span-1';
      case 'split':
      default:
        return 'lg:col-span-1';
    }
  };

  const getCollabClasses = () => {
    switch (layout) {
      case 'chat-focus':
        return 'lg:col-span-1';
      case 'collab-focus':
        return 'lg:col-span-3';
      case 'split':
      default:
        return 'lg:col-span-1';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Collaborative Workspace</h1>
                  <p className="text-sm text-gray-600">
                    {currentSession 
                      ? `Session: ${currentSession.name} • ${currentSession.participants.length} participants`
                      : 'Build together with your team in real-time'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Layout Controls */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLayout('chat-focus')}
                  className={`p-2 rounded-md transition-colors ${
                    layout === 'chat-focus' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                  title="Focus on Chat"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setLayout('split')}
                  className={`p-2 rounded-md transition-colors ${
                    layout === 'split' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                  title="Split View"
                >
                  <Split className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setLayout('collab-focus')}
                  className={`p-2 rounded-md transition-colors ${
                    layout === 'collab-focus' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                  title="Focus on Collaboration"
                >
                  <Users className="h-4 w-4" />
                </button>
              </div>

              {/* Toggle Collaboration Panel */}
              <button
                onClick={() => setShowCollaboration(!showCollaboration)}
                className={`p-2 rounded-lg transition-colors ${
                  showCollaboration 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={showCollaboration ? 'Hide Collaboration' : 'Show Collaboration'}
              >
                {showCollaboration ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>

              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className={`grid gap-6 h-[calc(100vh-140px)] ${getLayoutClasses()}`}>
          
          {/* AI Chat Interface */}
          <div className={getChatClasses()}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="h-full"
            >
              {!showResults ? (
                <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Code className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">AI Code Generator</h2>
                    </div>
                    {layout === 'chat-focus' && (
                      <button
                        onClick={() => setLayout('split')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Minimize2 className="h-4 w-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                  
                  <div className="h-[calc(100%-80px)]">
                    <ConversationInterface
                      onReadyForGeneration={handleReadyForGeneration}
                      className="h-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Generated Application</h2>
                    <button
                      onClick={() => {
                        setShowResults(false);
                        setCurrentProjectId(null);
                        setIsGenerating(false);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Start New Project</span>
                    </button>
                  </div>
                  
                  {currentProjectId && (
                    <ResultsDisplay projectId={currentProjectId} />
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Team Collaboration */}
          {showCollaboration && (
            <div className={getCollabClasses()}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="h-full"
              >
                <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-purple-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Team Collaboration</h2>
                    </div>
                    {layout === 'collab-focus' && (
                      <button
                        onClick={() => setLayout('split')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Minimize2 className="h-4 w-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                  
                  <div className="h-[calc(100%-80px)]">
                    <TeamCollaboration
                      projectId={projectId}
                      onSessionChange={handleSessionChange}
                      className="h-full"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Generation Progress Overlay */}
        {isGenerating && currentProjectId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-96 z-20"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Code className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Generating Code</h3>
            </div>
            
            <ProgressTracker 
              projectId={currentProjectId}
              onComplete={handleGenerationComplete}
            />
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-6 bg-red-50 border border-red-200 rounded-2xl p-6 w-96 z-20"
          >
            <h3 className="font-semibold text-red-900 mb-2">Error</h3>
            <p className="text-red-700 text-sm mb-4">{error}</p>
            <button
              onClick={() => setError(null)}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CollaborativeWorkspace;

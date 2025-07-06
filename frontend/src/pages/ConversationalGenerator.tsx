import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Sparkles, 
  ArrowLeft, 
  Settings,
  Rocket,
  Brain,
  Zap
} from 'lucide-react';
import { 
  startConversation, 
  selectCurrentPhase, 
  selectContext,
  selectIsReadyForGeneration,
  setPhase
} from '../store/conversationSlice';
import { ConversationInterface } from '../components/chat';
import ProgressTracker from '../components/progress/ProgressTracker';
import ResultsDisplay from '../components/results/ResultsDisplay';
import apiClient from '../services/api';
import { GenerateCodeRequest, GenerationResponse } from '../types/api';

export const ConversationalGenerator: React.FC = () => {
  const dispatch = useDispatch();
  const currentPhase = useSelector(selectCurrentPhase);
  const context = useSelector(selectContext);
  const isReadyForGeneration = useSelector(selectIsReadyForGeneration);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize conversation on mount
  useEffect(() => {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    dispatch(startConversation({ conversationId }));
  }, [dispatch]);

  const handleReadyForGeneration = async (finalContext: any) => {
    if (!finalContext.projectType || !finalContext.requirements) {
      setError('Missing required project information');
      return;
    }

    setIsGenerating(true);
    setError(null);
    dispatch(setPhase('generating'));

    try {
      const request: GenerateCodeRequest = {
        user_input: finalContext.requirements,
        project_name: finalContext.projectName || `${finalContext.projectType}-app`
      };

      const response: GenerationResponse = await apiClient.generateCode(request);
      setCurrentProjectId(response.project_id);
    } catch (err) {
      setIsGenerating(false);
      setError(err instanceof Error ? err.message : 'An error occurred during generation');
      dispatch(setPhase('ready'));
    }
  };

  const handleGenerationComplete = () => {
    setIsGenerating(false);
    setShowResults(true);
  };

  const handleStartOver = () => {
    setIsGenerating(false);
    setCurrentProjectId(null);
    setShowResults(false);
    setError(null);
    
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    dispatch(startConversation({ conversationId }));
  };

  const getPhaseDescription = () => {
    const descriptions = {
      greeting: "Let's start by understanding what you want to build",
      gathering: "I'm learning about your project requirements",
      clarifying: "Let me ask a few questions to get the details right",
      refining: "We're fine-tuning your project specifications",
      ready: "Perfect! I have everything needed to generate your application",
      generating: "Creating your application with AI-powered development"
    };
    
    return descriptions[currentPhase] || descriptions.greeting;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Conversational Generator</h1>
                  <p className="text-sm text-gray-600">{getPhaseDescription()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Context Summary */}
              {context.projectType && (
                <div className="hidden md:flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-600">
                      {context.projectType.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {context.complexity && (
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-purple-500" />
                      <span className="text-gray-600 capitalize">
                        {context.complexity}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">
                      {Math.round(context.confidence * 100)}% ready
                    </span>
                  </div>
                </div>
              )}

              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="h-full"
            >
              {!showResults ? (
                <ConversationInterface
                  onReadyForGeneration={handleReadyForGeneration}
                  className="h-full"
                />
              ) : (
                <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Generated Application</h2>
                    <button
                      onClick={handleStartOver}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Start New Chat</span>
                    </button>
                  </div>
                  
                  {currentProjectId && (
                    <ResultsDisplay projectId={currentProjectId} />
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Project Context Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Brain className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Project Context</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Project Type
                  </label>
                  <p className="text-sm text-gray-900 capitalize">
                    {context.projectType?.replace('_', ' ') || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Complexity
                  </label>
                  <p className="text-sm text-gray-900 capitalize">
                    {context.complexity || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Features ({context.features.length})
                  </label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {context.features.length > 0 ? (
                      context.features.slice(0, 3).map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {feature.replace('_', ' ')}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">None specified</span>
                    )}
                    {context.features.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{context.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Confidence
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${context.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(context.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Generation Progress */}
            {isGenerating && currentProjectId && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Rocket className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Generation Progress</h3>
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-6"
              >
                <h3 className="font-semibold text-red-900 mb-2">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-colors"
                >
                  Dismiss
                </button>
              </motion.div>
            )}

            {/* Tips Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Tips</h3>
              </div>
              
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <p>Be specific about your requirements for better results</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                  <p>Use the quick replies to speed up the conversation</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <p>Ask for clarification if you need to change anything</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationalGenerator;

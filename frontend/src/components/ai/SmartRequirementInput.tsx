import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { intentClassifier, ProjectIntent, ClassificationResult } from '../../ai/IntentClassifier';
import { Lightbulb, Zap, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface SmartRequirementInputProps {
  onRequirementsParsed: (result: ClassificationResult) => void;
  onInputChange: (value: string) => void;
  placeholder?: string;
  initialValue?: string;
}

interface Suggestion {
  text: string;
  type: 'template' | 'enhancement' | 'clarification';
  confidence?: number;
}

export const SmartRequirementInput: React.FC<SmartRequirementInputProps> = ({
  onRequirementsParsed,
  onInputChange,
  placeholder = "Describe what you want to build...",
  initialValue = ""
}) => {
  const [input, setInput] = useState(initialValue);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ClassificationResult | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Template suggestions for common project types
  const templateSuggestions: Suggestion[] = [
    {
      text: "Create a calculator with basic arithmetic operations and error handling",
      type: 'template'
    },
    {
      text: "Build a todo list application with categories and due dates",
      type: 'template'
    },
    {
      text: "Develop a REST API for managing user accounts with authentication",
      type: 'template'
    },
    {
      text: "Make a data analysis tool that processes CSV files and creates visualizations",
      type: 'template'
    },
    {
      text: "Create a simple web application with user registration and login",
      type: 'template'
    },
    {
      text: "Build a desktop GUI application for file management",
      type: 'template'
    }
  ];

  // Debounced analysis function
  const analyzeInput = useCallback(async (inputText: string) => {
    if (inputText.trim().length < 3) {
      setAnalysisResult(null);
      setShowAnalysis(false);
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const result = await intentClassifier.classifyIntent(inputText);
      setAnalysisResult(result);
      setShowAnalysis(true);
      onRequirementsParsed(result);
      
      // Generate enhancement suggestions based on analysis
      generateEnhancementSuggestions(result.intent);
      
    } catch (error) {
      console.error('Error analyzing input:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [onRequirementsParsed]);

  // Handle input changes with debouncing
  const handleInputChange = (value: string) => {
    setInput(value);
    onInputChange(value);

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for analysis
    const timer = setTimeout(() => {
      analyzeInput(value);
    }, 800); // 800ms debounce

    setDebounceTimer(timer);
  };

  // Generate enhancement suggestions based on project intent
  const generateEnhancementSuggestions = (intent: ProjectIntent) => {
    const enhancements: Suggestion[] = [];

    // Add complexity-based suggestions
    if (intent.complexity === 'simple') {
      enhancements.push({
        text: `Add ${intent.projectType === 'calculator' ? 'memory functions and history' : 
               intent.projectType === 'todo' ? 'categories and priority levels' :
               intent.projectType === 'api' ? 'authentication and validation' :
               'advanced features and error handling'}`,
        type: 'enhancement'
      });
    }

    // Add missing feature suggestions
    if (!intent.features.includes('testing')) {
      enhancements.push({
        text: "Include comprehensive testing with unit and integration tests",
        type: 'enhancement'
      });
    }

    if (!intent.features.includes('database') && ['todo', 'api'].includes(intent.projectType)) {
      enhancements.push({
        text: "Add database integration for data persistence",
        type: 'enhancement'
      });
    }

    // Add clarification suggestions if needed
    if (intent.needsClarification) {
      enhancements.push({
        text: "Could you specify the user interface type (web, desktop, or command-line)?",
        type: 'clarification'
      });
      
      enhancements.push({
        text: "What specific features are most important to you?",
        type: 'clarification'
      });
    }

    setSuggestions(enhancements);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.type === 'template') {
      setInput(suggestion.text);
      onInputChange(suggestion.text);
      analyzeInput(suggestion.text);
    } else if (suggestion.type === 'enhancement') {
      const enhancedInput = input + (input.endsWith('.') ? ' ' : '. ') + suggestion.text;
      setInput(enhancedInput);
      onInputChange(enhancedInput);
      analyzeInput(enhancedInput);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircle;
    if (confidence >= 0.6) return AlertCircle;
    return AlertCircle;
  };

  return (
    <div className="space-y-4">
      {/* Main Input Area */}
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[120px] p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none text-gray-800 placeholder-gray-400"
          style={{ fontSize: '16px' }} // Prevent zoom on iOS
        />
        
        {/* Analysis Indicator */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-4 right-4 flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full"
            >
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-600">Analyzing...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Template Suggestions (shown when input is empty) */}
      <AnimatePresence>
        {input.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 text-gray-600">
              <Lightbulb className="h-4 w-4" />
              <span className="text-sm font-medium">Try these examples:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {templateSuggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors duration-200 text-sm text-gray-700 hover:text-blue-700 border border-transparent hover:border-blue-200"
                >
                  {suggestion.text}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Results */}
      <AnimatePresence>
        {showAnalysis && analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-gray-200 rounded-xl p-4 space-y-4"
          >
            {/* Project Analysis Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-gray-800">AI Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                {React.createElement(getConfidenceIcon(analysisResult.intent.confidence), {
                  className: `h-4 w-4 ${getConfidenceColor(analysisResult.intent.confidence)}`
                })}
                <span className={`text-sm font-medium ${getConfidenceColor(analysisResult.intent.confidence)}`}>
                  {Math.round(analysisResult.intent.confidence * 100)}% confident
                </span>
              </div>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Project Type:</span>
                  <span className="font-medium text-gray-800 capitalize">
                    {analysisResult.intent.projectType.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Complexity:</span>
                  <span className="font-medium text-gray-800 capitalize">
                    {analysisResult.intent.complexity}
                  </span>
                </div>
              </div>
              
              {(analysisResult.intent.features.length > 0 || analysisResult.intent.techStack.length > 0) && (
                <div className="space-y-2">
                  {analysisResult.intent.features.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">Features:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysisResult.intent.features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            {feature.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysisResult.intent.techStack.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">Tech Stack:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysisResult.intent.techStack.map((tech, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reasoning */}
            {analysisResult.reasoning.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Analysis Reasoning:</span>
                <ul className="space-y-1">
                  {analysisResult.reasoning.map((reason, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhancement Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 text-gray-600">
              <Lightbulb className="h-4 w-4" />
              <span className="text-sm font-medium">Suggestions to improve your project:</span>
            </div>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full text-left p-3 rounded-lg transition-colors duration-200 text-sm border ${
                    suggestion.type === 'clarification'
                      ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-200'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <span className={`mt-1 ${
                      suggestion.type === 'clarification' ? 'text-yellow-500' : 'text-blue-500'
                    }`}>
                      {suggestion.type === 'clarification' ? '?' : '+'}
                    </span>
                    <span>{suggestion.text}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartRequirementInput;

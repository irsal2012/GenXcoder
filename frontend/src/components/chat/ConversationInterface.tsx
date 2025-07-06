import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Loader2, 
  MessageSquare, 
  Sparkles, 
  Bot,
  User,
  Clock,
  CheckCircle
} from 'lucide-react';
import { 
  addMessage, 
  setTyping, 
  updateContext,
  setPhase,
  selectMessages, 
  selectContext, 
  selectCurrentPhase, 
  selectIsTyping,
  Message
} from '../../store/conversationSlice';
import { RootState } from '../../store';
import { conversationManager, ConversationResponse } from '../../ai/conversation/ConversationManager';
import MessageBubble from './MessageBubble';
import QuickReplies from './QuickReplies';
import TypingIndicator from './TypingIndicator';

interface ConversationInterfaceProps {
  onReadyForGeneration?: (context: any) => void;
  className?: string;
}

export const ConversationInterface: React.FC<ConversationInterfaceProps> = ({
  onReadyForGeneration,
  className = ""
}) => {
  const dispatch = useDispatch();
  const messages = useSelector(selectMessages);
  const context = useSelector(selectContext);
  const currentPhase = useSelector(selectCurrentPhase);
  const isTyping = useSelector(selectIsTyping);
  
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle ready for generation
  useEffect(() => {
    if (currentPhase === 'ready' && onReadyForGeneration) {
      onReadyForGeneration(context);
    }
  }, [currentPhase, context, onReadyForGeneration]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text || isProcessing) return;

    setInputValue('');
    setIsProcessing(true);

    // Add user message
    dispatch(addMessage({
      type: 'user',
      content: text
    }));

    // Show typing indicator
    dispatch(setTyping(true));

    try {
      // Process message with AI
      const response = await conversationManager.processUserMessage(
        text,
        context,
        messages
      );

      // Simulate thinking time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Hide typing indicator
      dispatch(setTyping(false));

      // Add AI response
      dispatch(addMessage({
        type: 'ai',
        content: response.message,
        metadata: {
          quickReplies: response.quickReplies,
          suggestions: response.suggestions,
          templateId: response.templateRecommendations?.[0]?.id
        }
      }));

      // Update context and phase
      if (response.context) {
        dispatch(updateContext(response.context));
      }

      if (response.phase) {
        dispatch(setPhase(response.phase));
      }

    } catch (error) {
      console.error('Error processing message:', error);
      
      dispatch(setTyping(false));
      dispatch(addMessage({
        type: 'ai',
        content: "I'm sorry, I encountered an error processing your message. Could you please try again?"
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getPhaseInfo = () => {
    const phaseConfig = {
      greeting: { 
        icon: MessageSquare, 
        label: 'Getting Started', 
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      gathering: { 
        icon: Sparkles, 
        label: 'Understanding Requirements', 
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      clarifying: { 
        icon: MessageSquare, 
        label: 'Clarifying Details', 
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      },
      refining: { 
        icon: Sparkles, 
        label: 'Refining Project', 
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      },
      ready: { 
        icon: CheckCircle, 
        label: 'Ready to Generate', 
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      generating: { 
        icon: Loader2, 
        label: 'Generating Application', 
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      }
    };

    return phaseConfig[currentPhase as keyof typeof phaseConfig] || phaseConfig.greeting;
  };

  const phaseInfo = getPhaseInfo();
  const PhaseIcon = phaseInfo.icon;

  return (
    <div className={`flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${phaseInfo.bgColor}`}>
            <PhaseIcon className={`h-5 w-5 ${phaseInfo.color} ${currentPhase === 'generating' ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            <p className={`text-sm ${phaseInfo.color}`}>{phaseInfo.label}</p>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {['greeting', 'gathering', 'clarifying', 'ready'].map((phase, index) => (
              <div
                key={phase}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  ['greeting', 'gathering', 'clarifying', 'ready'].indexOf(currentPhase) >= index
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-2">
            {Math.round(context.confidence * 100)}% complete
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isLatest={index === messages.length - 1}
            />
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator />}

        {/* Quick Replies */}
        {!isTyping && messages.length > 0 && (
          <QuickReplies
            replies={messages[messages.length - 1]?.metadata?.quickReplies || []}
            onReplyClick={handleQuickReply}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-gray-200">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  currentPhase === 'ready' 
                    ? "Ready to generate! Type 'yes' to proceed or ask for changes..."
                    : "Type your message..."
                }
                className="w-full p-4 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                disabled={isProcessing}
              />
              
              {/* Character count for long messages */}
              {inputValue.length > 100 && (
                <div className="absolute -top-6 right-0 text-xs text-gray-400">
                  {inputValue.length}/500
                </div>
              )}
            </div>
            
            {/* Input hints */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>Press Enter to send</span>
                {currentPhase === 'ready' && (
                  <span className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Ready for generation</span>
                  </span>
                )}
              </div>
              
              {context.confidence > 0 && (
                <div className="text-xs text-gray-500">
                  Confidence: {Math.round(context.confidence * 100)}%
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isProcessing}
            className="p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl transition-colors duration-200 flex items-center justify-center"
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationInterface;

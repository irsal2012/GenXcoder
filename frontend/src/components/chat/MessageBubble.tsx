import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Clock, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../../store/conversationSlice';

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLatest = false }) => {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const bubbleVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 30
      }
    }
  };

  if (isSystem) {
    return (
      <motion.div
        variants={bubbleVariants}
        initial="hidden"
        animate="visible"
        className="flex justify-center"
      >
        <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
    >
      <div className={`flex items-end space-x-2 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
        }`}>
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Message Bubble */}
          <div className={`relative px-4 py-3 rounded-2xl max-w-full ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }`}>
            {/* Message Content */}
            <div className="text-sm leading-relaxed">
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <ReactMarkdown 
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-sm">{children}</li>,
                    code: ({ children }) => (
                      <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">
                        {children}
                      </code>
                    )
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>

            {/* Confidence indicator for AI messages */}
            {!isUser && message.metadata?.confidence && (
              <div className="flex items-center space-x-1 mt-2 pt-2 border-t border-gray-200">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs text-gray-500">
                  {Math.round(message.metadata.confidence * 100)}% confident
                </span>
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div className={`flex items-center space-x-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
            isUser ? 'flex-row-reverse' : ''
          }`}>
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-400">
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;

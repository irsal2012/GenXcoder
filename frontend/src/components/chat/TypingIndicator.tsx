import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

const TypingIndicator: React.FC = () => {
  const dotVariants = {
    initial: { y: 0 },
    animate: {
      y: [-4, 0, -4],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  const containerVariants = {
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex justify-start"
    >
      <div className="flex items-end space-x-2 max-w-[80%]">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white flex items-center justify-center">
          <Bot className="h-4 w-4" />
        </div>

        {/* Typing Bubble */}
        <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl rounded-bl-md">
          <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-600 mr-2">AI is thinking</span>
            <div className="flex space-x-1">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  variants={dotVariants}
                  initial="initial"
                  animate="animate"
                  style={{
                    animationDelay: `${index * 0.2}s`
                  }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;

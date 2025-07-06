import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

interface QuickRepliesProps {
  replies: string[];
  onReplyClick: (reply: string) => void;
}

const QuickReplies: React.FC<QuickRepliesProps> = ({ replies, onReplyClick }) => {
  if (!replies || replies.length === 0) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 30
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="flex flex-col space-y-3"
      >
        {/* Header */}
        <div className="flex items-center space-x-2 text-gray-600">
          <Zap className="h-4 w-4" />
          <span className="text-sm font-medium">Quick replies:</span>
        </div>

        {/* Reply Buttons */}
        <div className="flex flex-wrap gap-2">
          {replies.map((reply, index) => (
            <motion.button
              key={`${reply}-${index}`}
              variants={itemVariants}
              onClick={() => onReplyClick(reply)}
              className="group px-4 py-2 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl text-sm text-gray-700 hover:text-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{reply}</span>
              <div className="w-1 h-1 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </motion.button>
          ))}
        </div>

        {/* Hint */}
        <div className="text-xs text-gray-400 italic">
          Click a suggestion or type your own message
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickReplies;

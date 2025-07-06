import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProjectIntent } from '../ai/IntentClassifier';

export interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: ProjectIntent;
    confidence?: number;
    suggestions?: string[];
    quickReplies?: string[];
    templateId?: string;
    analysisResult?: any;
  };
}

export interface ProjectContext {
  projectType?: ProjectIntent['projectType'];
  complexity?: ProjectIntent['complexity'];
  features: string[];
  techStack: string[];
  requirements: string;
  projectName?: string;
  confidence: number;
  clarificationNeeded: boolean;
  missingInfo: string[];
}

export interface ConversationState {
  messages: Message[];
  context: ProjectContext;
  currentPhase: 'greeting' | 'gathering' | 'clarifying' | 'refining' | 'ready' | 'generating';
  isTyping: boolean;
  conversationId: string;
  startedAt: Date | null;
  lastActivity: Date | null;
  userPreferences: {
    preferredComplexity?: ProjectIntent['complexity'];
    favoriteProjectTypes: ProjectIntent['projectType'][];
    preferredTechStack: string[];
    communicationStyle: 'concise' | 'detailed' | 'interactive';
  };
}

const initialState: ConversationState = {
  messages: [],
  context: {
    features: [],
    techStack: [],
    requirements: '',
    confidence: 0,
    clarificationNeeded: false,
    missingInfo: []
  },
  currentPhase: 'greeting',
  isTyping: false,
  conversationId: '',
  startedAt: null,
  lastActivity: null,
  userPreferences: {
    favoriteProjectTypes: [],
    preferredTechStack: [],
    communicationStyle: 'interactive'
  }
};

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    startConversation: (state, action: PayloadAction<{ conversationId: string }>) => {
      state.conversationId = action.payload.conversationId;
      state.startedAt = new Date();
      state.lastActivity = new Date();
      state.currentPhase = 'greeting';
      state.messages = [{
        id: 'welcome',
        type: 'ai',
        content: "Hi! I'm your AI assistant. I'll help you create amazing applications. What would you like to build today?",
        timestamp: new Date(),
        metadata: {
          quickReplies: [
            "A calculator app",
            "A todo list",
            "A web API",
            "A data analysis tool",
            "Something else..."
          ]
        }
      }];
    },

    addMessage: (state, action: PayloadAction<Omit<Message, 'id' | 'timestamp'>>) => {
      const message: Message = {
        ...action.payload,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };
      
      state.messages.push(message);
      state.lastActivity = new Date();
      
      // Update context based on message content
      if (message.type === 'user') {
        state.context.requirements = message.content;
      }
      
      // Update context from AI analysis
      if (message.metadata?.intent) {
        state.context.projectType = message.metadata.intent.projectType;
        state.context.complexity = message.metadata.intent.complexity;
        state.context.features = message.metadata.intent.features;
        state.context.techStack = message.metadata.intent.techStack;
        state.context.confidence = message.metadata.intent.confidence;
        state.context.clarificationNeeded = message.metadata.intent.needsClarification;
      }
    },

    updateContext: (state, action: PayloadAction<Partial<ProjectContext>>) => {
      state.context = { ...state.context, ...action.payload };
      state.lastActivity = new Date();
    },

    setPhase: (state, action: PayloadAction<ConversationState['currentPhase']>) => {
      state.currentPhase = action.payload;
      state.lastActivity = new Date();
    },

    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },

    addClarificationQuestion: (state, action: PayloadAction<{
      question: string;
      options?: string[];
      missingInfo: string[];
    }>) => {
      const message: Message = {
        id: `clarification_${Date.now()}`,
        type: 'ai',
        content: action.payload.question,
        timestamp: new Date(),
        metadata: {
          quickReplies: action.payload.options
        }
      };
      
      state.messages.push(message);
      state.currentPhase = 'clarifying';
      state.context.missingInfo = action.payload.missingInfo;
      state.lastActivity = new Date();
    },

    updateUserPreferences: (state, action: PayloadAction<Partial<ConversationState['userPreferences']>>) => {
      state.userPreferences = { ...state.userPreferences, ...action.payload };
    },

    setProjectName: (state, action: PayloadAction<string>) => {
      state.context.projectName = action.payload;
      state.lastActivity = new Date();
    },

    markReadyForGeneration: (state) => {
      state.currentPhase = 'ready';
      state.context.clarificationNeeded = false;
      state.context.missingInfo = [];
      
      const readyMessage: Message = {
        id: `ready_${Date.now()}`,
        type: 'ai',
        content: `Perfect! I have everything I need to create your ${state.context.projectType?.replace('_', ' ')} application. Here's what I understand:\n\n` +
                `**Project Type**: ${state.context.projectType?.replace('_', ' ')}\n` +
                `**Complexity**: ${state.context.complexity}\n` +
                `**Features**: ${state.context.features.join(', ')}\n` +
                `**Tech Stack**: ${state.context.techStack.join(', ')}\n\n` +
                `Ready to generate your application?`,
        timestamp: new Date(),
        metadata: {
          quickReplies: ['Yes, generate it!', 'Let me make some changes', 'Add more features']
        }
      };
      
      state.messages.push(readyMessage);
      state.lastActivity = new Date();
    },

    resetConversation: (state) => {
      return {
        ...initialState,
        userPreferences: state.userPreferences // Preserve user preferences
      };
    },

    loadConversationHistory: (state, action: PayloadAction<ConversationState>) => {
      return action.payload;
    }
  }
});

export const {
  startConversation,
  addMessage,
  updateContext,
  setPhase,
  setTyping,
  addClarificationQuestion,
  updateUserPreferences,
  setProjectName,
  markReadyForGeneration,
  resetConversation,
  loadConversationHistory
} = conversationSlice.actions;

export default conversationSlice.reducer;

// Selectors
export const selectMessages = (state: { conversation: ConversationState }) => state.conversation.messages;
export const selectContext = (state: { conversation: ConversationState }) => state.conversation.context;
export const selectCurrentPhase = (state: { conversation: ConversationState }) => state.conversation.currentPhase;
export const selectIsTyping = (state: { conversation: ConversationState }) => state.conversation.isTyping;
export const selectUserPreferences = (state: { conversation: ConversationState }) => state.conversation.userPreferences;
export const selectIsReadyForGeneration = (state: { conversation: ConversationState }) => 
  state.conversation.currentPhase === 'ready' && 
  !state.conversation.context.clarificationNeeded &&
  state.conversation.context.confidence > 0.7;

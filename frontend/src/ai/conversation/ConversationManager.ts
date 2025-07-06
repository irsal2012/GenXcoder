import { intentClassifier, ClassificationResult } from '../IntentClassifier';
import { projectTemplateService, ProjectTemplate } from '../../services/ai/ProjectTemplates';
import { Message, ProjectContext } from '../../store/conversationSlice';

export interface ConversationResponse {
  message: string;
  quickReplies?: string[];
  suggestions?: string[];
  phase?: 'gathering' | 'clarifying' | 'refining' | 'ready';
  context?: Partial<ProjectContext>;
  templateRecommendations?: ProjectTemplate[];
}

export class ConversationManager {
  private clarificationRules = {
    project_type_unclear: {
      trigger: (context: ProjectContext) => !context.projectType || context.confidence < 0.6,
      questions: [
        "What type of application are you looking to build?",
        "Could you tell me more about the main purpose of your application?",
        "Are you building a web app, desktop app, mobile app, or something else?"
      ],
      quickReplies: ["Web Application", "Desktop App", "Mobile App", "API/Backend", "Data Tool", "Game"]
    },
    
    complexity_unclear: {
      trigger: (context: ProjectContext) => context.projectType && !context.complexity,
      questions: [
        "How complex should this application be?",
        "Are you looking for something simple to get started, or a more comprehensive solution?",
        "What's your experience level with this type of project?"
      ],
      quickReplies: ["Simple & Quick", "Intermediate Features", "Advanced & Comprehensive", "Enterprise Grade"]
    },
    
    features_missing: {
      trigger: (context: ProjectContext) => context.projectType && context.features.length === 0,
      questions: [
        "What specific features would you like to include?",
        "Are there any particular capabilities that are important to you?",
        "Should this include user authentication, data storage, or other specific features?"
      ],
      quickReplies: ["User Authentication", "Database Storage", "Real-time Updates", "API Integration", "File Upload"]
    },
    
    tech_stack_missing: {
      trigger: (context: ProjectContext) => context.projectType && context.techStack.length === 0,
      questions: [
        "Do you have any preferences for the technology stack?",
        "Are there specific programming languages or frameworks you'd like to use?",
        "Should I choose the best technologies for your project type?"
      ],
      quickReplies: ["Python", "JavaScript/Node.js", "React", "Choose for me", "No preference"]
    },
    
    ui_type_missing: {
      trigger: (context: ProjectContext) => 
        ['web_app', 'gui_app', 'game'].includes(context.projectType || '') && 
        !context.features.some(f => f.includes('ui') || f.includes('interface')),
      questions: [
        "What type of user interface would you prefer?",
        "Should this have a graphical interface or be command-line based?",
        "Are you looking for a modern web interface, desktop GUI, or something else?"
      ],
      quickReplies: ["Modern Web UI", "Desktop GUI", "Command Line", "Mobile-Friendly", "Dashboard Style"]
    }
  };

  private responseTemplates = {
    greeting: [
      "Hi! I'm your AI development assistant. I'll help you create amazing applications. What would you like to build today?",
      "Hello! I'm here to help you turn your ideas into code. What kind of application do you have in mind?",
      "Welcome! I'm excited to help you build something awesome. Tell me about your project idea!"
    ],
    
    understanding: [
      "I understand you want to create {projectType}. Let me ask a few questions to make it perfect.",
      "Great idea! A {projectType} sounds interesting. I'd like to learn more about your vision.",
      "Perfect! I can help you build an amazing {projectType}. Let's refine the details together."
    ],
    
    clarification: [
      "To make sure I build exactly what you need, I have a few questions:",
      "Let me ask some clarifying questions to ensure we're on the same page:",
      "I want to make this perfect for you. Could you help me understand:"
    ],
    
    ready: [
      "Excellent! I have everything I need to create your {projectType}. Here's what I understand:",
      "Perfect! I'm ready to build your {projectType} with these specifications:",
      "Great! I've gathered all the details for your {projectType}. Let me confirm:"
    ]
  };

  async processUserMessage(
    message: string, 
    context: ProjectContext, 
    conversationHistory: Message[]
  ): Promise<ConversationResponse> {
    
    // Analyze the user's message
    const analysisResult = await intentClassifier.classifyIntent(message);
    
    // Update context with new information
    const updatedContext = this.mergeContext(context, analysisResult);
    
    // Determine conversation phase and generate response
    if (this.needsClarification(updatedContext)) {
      return this.generateClarificationResponse(updatedContext, analysisResult);
    } else if (this.isReadyForGeneration(updatedContext)) {
      return this.generateReadyResponse(updatedContext);
    } else {
      return this.generateGatheringResponse(updatedContext, analysisResult);
    }
  }

  private mergeContext(currentContext: ProjectContext, analysisResult: ClassificationResult): ProjectContext {
    const newContext = { ...currentContext };
    
    // Update with new analysis results
    if (analysisResult.intent.projectType && analysisResult.intent.confidence > 0.6) {
      newContext.projectType = analysisResult.intent.projectType;
    }
    
    if (analysisResult.intent.complexity) {
      newContext.complexity = analysisResult.intent.complexity;
    }
    
    // Merge features (avoid duplicates)
    const newFeatures = analysisResult.intent.features.filter(
      feature => !newContext.features.includes(feature)
    );
    newContext.features = [...newContext.features, ...newFeatures];
    
    // Merge tech stack (avoid duplicates)
    const newTechStack = analysisResult.intent.techStack.filter(
      tech => !newContext.techStack.includes(tech)
    );
    newContext.techStack = [...newContext.techStack, ...newTechStack];
    
    // Update confidence and requirements
    newContext.confidence = Math.max(newContext.confidence, analysisResult.intent.confidence);
    newContext.requirements = analysisResult.intent.needsClarification ? 
      newContext.requirements : 
      newContext.requirements + ' ' + analysisResult.reasoning.join(' ');
    
    return newContext;
  }

  private needsClarification(context: ProjectContext): boolean {
    return Object.values(this.clarificationRules).some(rule => rule.trigger(context));
  }

  private isReadyForGeneration(context: ProjectContext): boolean {
    return !!(
      context.projectType &&
      context.complexity &&
      context.features.length > 0 &&
      context.confidence > 0.7 &&
      !this.needsClarification(context)
    );
  }

  private generateClarificationResponse(
    context: ProjectContext, 
    analysisResult: ClassificationResult
  ): ConversationResponse {
    
    // Find the first clarification rule that applies
    const applicableRule = Object.entries(this.clarificationRules)
      .find(([_, rule]) => rule.trigger(context));
    
    if (!applicableRule) {
      return this.generateGatheringResponse(context, analysisResult);
    }
    
    const [ruleKey, rule] = applicableRule;
    const question = this.getRandomItem(rule.questions);
    
    // Add context-specific information to the question
    let contextualQuestion = question;
    if (context.projectType) {
      contextualQuestion = `For your ${context.projectType.replace('_', ' ')} project: ${question.toLowerCase()}`;
    }
    
    return {
      message: contextualQuestion,
      quickReplies: rule.quickReplies,
      phase: 'clarifying',
      context: {
        missingInfo: [ruleKey],
        clarificationNeeded: true
      }
    };
  }

  private generateGatheringResponse(
    context: ProjectContext, 
    analysisResult: ClassificationResult
  ): ConversationResponse {
    
    let message = "";
    const suggestions: string[] = [];
    
    if (context.projectType) {
      // We have a project type, provide understanding and suggestions
      const template = this.getRandomItem(this.responseTemplates.understanding);
      message = template.replace('{projectType}', context.projectType.replace('_', ' '));
      
      // Add suggestions based on project type
      suggestions.push(...this.generateProjectSuggestions(context.projectType));
      
      // Get template recommendations
      const templateRecommendations = projectTemplateService.getRecommendedTemplates(analysisResult.intent);
      
      if (templateRecommendations.length > 0) {
        message += `\n\nI found some templates that might help:`;
        
        return {
          message,
          suggestions,
          phase: 'gathering',
          context,
          templateRecommendations: templateRecommendations.slice(0, 3)
        };
      }
    } else {
      // No clear project type yet, ask for more information
      message = "I'd love to help you build something amazing! Could you tell me more about what you have in mind? For example:";
      suggestions.push(
        "A web application for managing tasks",
        "A data analysis tool for CSV files", 
        "A REST API for user management",
        "A calculator with advanced functions",
        "A game or interactive application"
      );
    }
    
    return {
      message,
      suggestions,
      phase: 'gathering',
      context
    };
  }

  private generateReadyResponse(context: ProjectContext): ConversationResponse {
    const template = this.getRandomItem(this.responseTemplates.ready);
    let message = template.replace('{projectType}', context.projectType?.replace('_', ' ') || 'application');
    
    // Add project summary
    message += `\n\n**Project Summary:**\n`;
    message += `• **Type**: ${context.projectType?.replace('_', ' ')}\n`;
    message += `• **Complexity**: ${context.complexity}\n`;
    
    if (context.features.length > 0) {
      message += `• **Features**: ${context.features.map(f => f.replace('_', ' ')).join(', ')}\n`;
    }
    
    if (context.techStack.length > 0) {
      message += `• **Tech Stack**: ${context.techStack.join(', ')}\n`;
    }
    
    message += `\nReady to generate your application?`;
    
    return {
      message,
      quickReplies: [
        "Yes, generate it!",
        "Let me add more features",
        "Change the complexity",
        "Use a different tech stack"
      ],
      phase: 'ready',
      context: {
        ...context,
        clarificationNeeded: false
      }
    };
  }

  private generateProjectSuggestions(projectType: string): string[] {
    const suggestions: { [key: string]: string[] } = {
      calculator: [
        "Add memory functions (M+, M-, MR, MC)",
        "Include scientific functions (sin, cos, tan)",
        "Add calculation history",
        "Support for different number bases"
      ],
      todo: [
        "Add due dates and reminders",
        "Include task categories and tags",
        "Add priority levels",
        "Enable task sharing and collaboration"
      ],
      api: [
        "Include user authentication with JWT",
        "Add input validation and error handling",
        "Include API documentation",
        "Add rate limiting and security features"
      ],
      data_analysis: [
        "Support multiple file formats (CSV, Excel, JSON)",
        "Add interactive visualizations",
        "Include statistical analysis",
        "Add export functionality for reports"
      ],
      web_app: [
        "Make it responsive for mobile devices",
        "Add user authentication and profiles",
        "Include real-time features",
        "Add search and filtering capabilities"
      ],
      game: [
        "Add multiple difficulty levels",
        "Include sound effects and music",
        "Add high score tracking",
        "Include multiplayer capabilities"
      ]
    };
    
    return suggestions[projectType] || [
      "Add user authentication",
      "Include data persistence",
      "Make it responsive",
      "Add comprehensive testing"
    ];
  }

  private getRandomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  // Generate follow-up questions based on context
  generateFollowUpQuestions(context: ProjectContext): string[] {
    const questions: string[] = [];
    
    if (context.projectType && !context.complexity) {
      questions.push("How complex should this application be?");
    }
    
    if (context.projectType && context.features.length === 0) {
      questions.push("What specific features would you like to include?");
    }
    
    if (context.projectType && context.techStack.length === 0) {
      questions.push("Do you have any technology preferences?");
    }
    
    if (context.projectType === 'web_app' && !context.features.includes('responsive')) {
      questions.push("Should this be mobile-friendly?");
    }
    
    if (['api', 'web_app'].includes(context.projectType || '') && !context.features.includes('authentication')) {
      questions.push("Do you need user authentication?");
    }
    
    return questions;
  }

  // Generate project name suggestions
  generateProjectNameSuggestions(context: ProjectContext): string[] {
    if (!context.projectType) return [];
    
    const baseNames: { [key: string]: string[] } = {
      calculator: ['smart-calc', 'math-wizard', 'calculator-pro', 'quick-math'],
      todo: ['task-master', 'todo-pro', 'task-tracker', 'productivity-hub'],
      api: ['api-server', 'backend-service', 'rest-api', 'data-service'],
      data_analysis: ['data-analyzer', 'insights-tool', 'analytics-dashboard', 'data-explorer'],
      web_app: ['web-application', 'webapp', 'online-platform', 'web-service'],
      game: ['game-app', 'fun-game', 'interactive-game', 'game-project'],
      gui_app: ['desktop-app', 'gui-application', 'desktop-tool', 'app-suite'],
      utility: ['utility-tool', 'helper-app', 'automation-tool', 'productivity-tool']
    };
    
    const names = baseNames[context.projectType] || ['my-project'];
    const complexity = context.complexity;
    
    return names.map(name => {
      if (complexity && complexity !== 'simple') {
        return `${name}-${complexity}`;
      }
      return name;
    });
  }
}

export const conversationManager = new ConversationManager();

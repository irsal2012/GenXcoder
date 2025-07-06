import { ProjectIntent } from '../../../ai/IntentClassifier';
import { Message, ProjectContext } from '../../../store/conversationSlice';

export interface UserPattern {
  id: string;
  userId?: string;
  timestamp: Date;
  projectType: string;
  complexity: string;
  features: string[];
  techStack: string[];
  conversationLength: number;
  clarificationCount: number;
  successfulGeneration: boolean;
  userSatisfaction?: number; // 1-5 rating
  commonPhrases: string[];
  preferredCommunicationStyle: 'concise' | 'detailed' | 'interactive';
}

export interface UserPreferences {
  favoriteProjectTypes: string[];
  preferredComplexity: string;
  preferredTechStack: string[];
  communicationStyle: 'concise' | 'detailed' | 'interactive';
  averageConversationLength: number;
  commonFeatureRequests: string[];
  clarificationPreferences: {
    prefersQuickReplies: boolean;
    prefersDetailedExplanations: boolean;
    prefersTemplateRecommendations: boolean;
  };
  languagePreferences: {
    primaryLanguage: string;
    technicalLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    preferredTerminology: 'simple' | 'technical' | 'mixed';
  };
}

export interface LearningInsights {
  userType: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  projectPatterns: {
    mostCommonType: string;
    averageComplexity: string;
    preferredFeatures: string[];
    techStackPreferences: string[];
  };
  conversationPatterns: {
    averageLength: number;
    clarificationRate: number;
    successRate: number;
    preferredInteractionStyle: string;
  };
  recommendations: {
    suggestedTemplates: string[];
    optimizedQuestions: string[];
    personalizedGreeting: string;
    adaptedCommunicationStyle: string;
  };
}

export class LearningSystem {
  private patterns: UserPattern[] = [];
  private preferences: UserPreferences | null = null;
  private readonly STORAGE_KEY = 'genxcoder-learning-data';
  private readonly MAX_PATTERNS = 100; // Limit stored patterns

  constructor() {
    this.loadFromStorage();
  }

  // Record user interaction patterns
  recordPattern(
    messages: Message[],
    context: ProjectContext,
    successful: boolean,
    satisfaction?: number
  ): void {
    const pattern: UserPattern = {
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      projectType: context.projectType || 'unknown',
      complexity: context.complexity || 'unknown',
      features: [...context.features],
      techStack: [...context.techStack],
      conversationLength: messages.length,
      clarificationCount: this.countClarificationMessages(messages),
      successfulGeneration: successful,
      userSatisfaction: satisfaction,
      commonPhrases: this.extractCommonPhrases(messages),
      preferredCommunicationStyle: this.detectCommunicationStyle(messages)
    };

    this.patterns.push(pattern);
    
    // Limit storage size
    if (this.patterns.length > this.MAX_PATTERNS) {
      this.patterns = this.patterns.slice(-this.MAX_PATTERNS);
    }

    this.updatePreferences();
    this.saveToStorage();
  }

  // Get personalized insights for the user
  getInsights(): LearningInsights {
    if (this.patterns.length === 0) {
      return this.getDefaultInsights();
    }

    const projectPatterns = this.analyzeProjectPatterns();
    const conversationPatterns = this.analyzeConversationPatterns();
    const userType = this.determineUserType();

    return {
      userType,
      projectPatterns,
      conversationPatterns,
      recommendations: this.generateRecommendations(userType, projectPatterns, conversationPatterns)
    };
  }

  // Get current user preferences
  getPreferences(): UserPreferences {
    return this.preferences || this.getDefaultPreferences();
  }

  // Update preferences based on explicit user input
  updateExplicitPreferences(updates: Partial<UserPreferences>): void {
    this.preferences = {
      ...this.getPreferences(),
      ...updates
    };
    this.saveToStorage();
  }

  // Get personalized greeting based on user patterns
  getPersonalizedGreeting(): string {
    const insights = this.getInsights();
    const preferences = this.getPreferences();

    if (this.patterns.length === 0) {
      return "Hi! I'm your AI assistant. I'll help you create amazing applications. What would you like to build today?";
    }

    const greetings = {
      beginner: [
        `Welcome back! I see you enjoy building ${insights.projectPatterns.mostCommonType} projects. I'm here to help you create something amazing!`,
        `Hi there! Ready to build another great application? I'll guide you through every step.`,
        `Hello! I'm excited to help you bring your ideas to life. What are you thinking of building today?`
      ],
      intermediate: [
        `Welcome back! I notice you prefer ${insights.projectPatterns.averageComplexity} complexity projects. What's your next idea?`,
        `Hi! Ready to create something awesome? I have some great suggestions based on your previous projects.`,
        `Hello! I see you're getting more comfortable with development. What would you like to build today?`
      ],
      advanced: [
        `Welcome back! I see you typically work with ${insights.projectPatterns.techStackPreferences.join(', ')}. What's your next challenge?`,
        `Hi! Ready for another ${insights.projectPatterns.averageComplexity} project? I'm here to help optimize your development process.`,
        `Hello! I notice you prefer efficient conversations. Let's get straight to building something great!`
      ],
      expert: [
        `Welcome back! I see you're working on ${insights.projectPatterns.mostCommonType} projects with ${insights.projectPatterns.preferredFeatures.join(', ')}. What's next?`,
        `Hi! Ready to tackle another complex project? I'll focus on the technical details you care about.`,
        `Hello! I know you value efficiency. Let's quickly define your requirements and get building!`
      ]
    };

    const userGreetings = greetings[insights.userType];
    return userGreetings[Math.floor(Math.random() * userGreetings.length)];
  }

  // Get optimized questions based on user patterns
  getOptimizedQuestions(context: ProjectContext): string[] {
    const insights = this.getInsights();
    const preferences = this.getPreferences();

    // Customize questions based on user type and preferences
    const baseQuestions = [
      "What type of application would you like to build?",
      "How complex should this project be?",
      "What features are most important to you?",
      "Do you have any technology preferences?"
    ];

    if (insights.userType === 'beginner') {
      return [
        "What kind of app do you want to create? (I'll help you with the technical details)",
        "Should this be simple to start with, or do you want something more comprehensive?",
        "What should your app be able to do?",
        "Would you like me to recommend the best technologies for your project?"
      ];
    }

    if (insights.userType === 'expert') {
      return [
        "What's the core functionality you're implementing?",
        "What's your target architecture and scale?",
        "Which frameworks and libraries do you want to use?",
        "Any specific performance or security requirements?"
      ];
    }

    return baseQuestions;
  }

  // Get personalized template recommendations
  getPersonalizedTemplates(): string[] {
    const insights = this.getInsights();
    
    if (this.patterns.length === 0) {
      return ['basic-web-app', 'simple-api', 'calculator', 'todo-app'];
    }

    return insights.recommendations.suggestedTemplates;
  }

  // Predict user intent based on partial input
  predictIntent(partialInput: string): Partial<ProjectIntent> {
    const insights = this.getInsights();
    const commonPatterns = this.patterns.filter(p => 
      p.commonPhrases.some(phrase => 
        partialInput.toLowerCase().includes(phrase.toLowerCase())
      )
    );

    if (commonPatterns.length === 0) {
      return {};
    }

    // Find most common patterns
    const projectTypes = commonPatterns.map(p => p.projectType);
    const complexities = commonPatterns.map(p => p.complexity);
    const features = commonPatterns.flatMap(p => p.features);

    return {
      projectType: this.getMostCommon(projectTypes) as any,
      complexity: this.getMostCommon(complexities) as any,
      features: this.getTopItems(features, 3),
      confidence: Math.min(0.8, commonPatterns.length / 10)
    };
  }

  // Private helper methods
  private countClarificationMessages(messages: Message[]): number {
    return messages.filter(m => 
      m.type === 'ai' && 
      (m.content.includes('?') || m.metadata?.quickReplies)
    ).length;
  }

  private extractCommonPhrases(messages: Message[]): string[] {
    const userMessages = messages.filter(m => m.type === 'user');
    const phrases: string[] = [];

    userMessages.forEach(message => {
      const words = message.content.toLowerCase().split(/\s+/);
      
      // Extract 2-3 word phrases
      for (let i = 0; i < words.length - 1; i++) {
        if (words[i].length > 2 && words[i + 1].length > 2) {
          phrases.push(`${words[i]} ${words[i + 1]}`);
        }
      }
    });

    // Return most common phrases
    const phraseCounts = phrases.reduce((acc, phrase) => {
      acc[phrase] = (acc[phrase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(phraseCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([phrase]) => phrase);
  }

  private detectCommunicationStyle(messages: Message[]): 'concise' | 'detailed' | 'interactive' {
    const userMessages = messages.filter(m => m.type === 'user');
    const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    const questionCount = userMessages.filter(m => m.content.includes('?')).length;

    if (avgLength < 50) return 'concise';
    if (questionCount > userMessages.length * 0.3) return 'interactive';
    return 'detailed';
  }

  private analyzeProjectPatterns() {
    const projectTypes = this.patterns.map(p => p.projectType);
    const complexities = this.patterns.map(p => p.complexity);
    const allFeatures = this.patterns.flatMap(p => p.features);
    const allTechStack = this.patterns.flatMap(p => p.techStack);

    return {
      mostCommonType: this.getMostCommon(projectTypes),
      averageComplexity: this.getMostCommon(complexities),
      preferredFeatures: this.getTopItems(allFeatures, 5),
      techStackPreferences: this.getTopItems(allTechStack, 3)
    };
  }

  private analyzeConversationPatterns() {
    const avgLength = this.patterns.reduce((sum, p) => sum + p.conversationLength, 0) / this.patterns.length;
    const avgClarifications = this.patterns.reduce((sum, p) => sum + p.clarificationCount, 0) / this.patterns.length;
    const successRate = this.patterns.filter(p => p.successfulGeneration).length / this.patterns.length;
    const styles = this.patterns.map(p => p.preferredCommunicationStyle);

    return {
      averageLength: Math.round(avgLength),
      clarificationRate: Math.round(avgClarifications * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      preferredInteractionStyle: this.getMostCommon(styles)
    };
  }

  private determineUserType(): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (this.patterns.length < 3) return 'beginner';

    const avgComplexity = this.patterns.map(p => p.complexity);
    const avgClarifications = this.patterns.reduce((sum, p) => sum + p.clarificationCount, 0) / this.patterns.length;
    const successRate = this.patterns.filter(p => p.successfulGeneration).length / this.patterns.length;
    const avgConversationLength = this.patterns.reduce((sum, p) => sum + p.conversationLength, 0) / this.patterns.length;

    const complexityScore = avgComplexity.filter(c => ['advanced', 'enterprise'].includes(c)).length / avgComplexity.length;
    const efficiencyScore = 1 - (avgClarifications / 10); // Lower clarifications = higher efficiency
    const successScore = successRate;
    const conciseScore = 1 - (avgConversationLength / 20); // Shorter conversations = more concise

    const totalScore = (complexityScore + efficiencyScore + successScore + conciseScore) / 4;

    if (totalScore > 0.8) return 'expert';
    if (totalScore > 0.6) return 'advanced';
    if (totalScore > 0.4) return 'intermediate';
    return 'beginner';
  }

  private generateRecommendations(
    userType: string,
    projectPatterns: any,
    conversationPatterns: any
  ) {
    const templateMap = {
      beginner: ['simple-calculator', 'basic-todo', 'hello-world-api'],
      intermediate: ['task-manager', 'blog-api', 'data-dashboard'],
      advanced: ['microservices-api', 'real-time-chat', 'analytics-platform'],
      expert: ['distributed-system', 'ml-pipeline', 'enterprise-platform']
    };

    const questionMap = {
      beginner: [
        "What kind of app would you like to create?",
        "Should we start with something simple?",
        "What should your app be able to do?"
      ],
      expert: [
        "What's your target architecture?",
        "Which frameworks do you prefer?",
        "Any specific performance requirements?"
      ]
    };

    return {
      suggestedTemplates: templateMap[userType as keyof typeof templateMap] || templateMap.beginner,
      optimizedQuestions: questionMap[userType as keyof typeof questionMap] || questionMap.beginner,
      personalizedGreeting: this.getPersonalizedGreeting(),
      adaptedCommunicationStyle: conversationPatterns.preferredInteractionStyle
    };
  }

  private getMostCommon<T>(items: T[]): T {
    const counts = items.reduce((acc, item) => {
      acc[item as any] = (acc[item as any] || 0) + 1;
      return acc;
    }, {} as Record<any, number>);

    return Object.entries(counts)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] as T;
  }

  private getTopItems<T>(items: T[], count: number): T[] {
    const counts = items.reduce((acc, item) => {
      acc[item as any] = (acc[item as any] || 0) + 1;
      return acc;
    }, {} as Record<any, number>);

    return Object.entries(counts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, count)
      .map(([item]) => item as T);
  }

  private updatePreferences(): void {
    if (this.patterns.length === 0) return;

    const projectPatterns = this.analyzeProjectPatterns();
    const conversationPatterns = this.analyzeConversationPatterns();

    this.preferences = {
      favoriteProjectTypes: projectPatterns.preferredFeatures.slice(0, 3),
      preferredComplexity: projectPatterns.averageComplexity,
      preferredTechStack: projectPatterns.techStackPreferences,
      communicationStyle: conversationPatterns.preferredInteractionStyle as any,
      averageConversationLength: conversationPatterns.averageLength,
      commonFeatureRequests: projectPatterns.preferredFeatures,
      clarificationPreferences: {
        prefersQuickReplies: conversationPatterns.clarificationRate < 3,
        prefersDetailedExplanations: conversationPatterns.preferredInteractionStyle === 'detailed',
        prefersTemplateRecommendations: true
      },
      languagePreferences: {
        primaryLanguage: 'en-US',
        technicalLevel: this.determineUserType() as any,
        preferredTerminology: this.determineUserType() === 'beginner' ? 'simple' : 'technical'
      }
    };
  }

  private getDefaultInsights(): LearningInsights {
    return {
      userType: 'beginner',
      projectPatterns: {
        mostCommonType: 'web_app',
        averageComplexity: 'simple',
        preferredFeatures: ['basic_ui', 'data_storage'],
        techStackPreferences: ['javascript', 'python']
      },
      conversationPatterns: {
        averageLength: 8,
        clarificationRate: 3,
        successRate: 0.8,
        preferredInteractionStyle: 'interactive'
      },
      recommendations: {
        suggestedTemplates: ['simple-calculator', 'basic-todo', 'hello-world-api'],
        optimizedQuestions: [
          "What kind of app would you like to create?",
          "Should we start with something simple?",
          "What should your app be able to do?"
        ],
        personalizedGreeting: "Hi! I'm your AI assistant. I'll help you create amazing applications. What would you like to build today?",
        adaptedCommunicationStyle: 'interactive'
      }
    };
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      favoriteProjectTypes: [],
      preferredComplexity: 'simple',
      preferredTechStack: [],
      communicationStyle: 'interactive',
      averageConversationLength: 8,
      commonFeatureRequests: [],
      clarificationPreferences: {
        prefersQuickReplies: true,
        prefersDetailedExplanations: false,
        prefersTemplateRecommendations: true
      },
      languagePreferences: {
        primaryLanguage: 'en-US',
        technicalLevel: 'beginner',
        preferredTerminology: 'simple'
      }
    };
  }

  private saveToStorage(): void {
    try {
      const data = {
        patterns: this.patterns,
        preferences: this.preferences,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save learning data to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.patterns = parsed.patterns || [];
        this.preferences = parsed.preferences;
        
        // Convert date strings back to Date objects
        this.patterns.forEach(pattern => {
          pattern.timestamp = new Date(pattern.timestamp);
        });
      }
    } catch (error) {
      console.warn('Failed to load learning data from storage:', error);
      this.patterns = [];
      this.preferences = null;
    }
  }

  // Public method to clear learning data
  clearLearningData(): void {
    this.patterns = [];
    this.preferences = null;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Get learning statistics for display
  getStatistics() {
    return {
      totalConversations: this.patterns.length,
      successRate: this.patterns.length > 0 
        ? this.patterns.filter(p => p.successfulGeneration).length / this.patterns.length 
        : 0,
      averageSatisfaction: this.patterns.length > 0
        ? this.patterns
            .filter(p => p.userSatisfaction)
            .reduce((sum, p) => sum + (p.userSatisfaction || 0), 0) / 
          this.patterns.filter(p => p.userSatisfaction).length
        : 0,
      mostUsedProjectType: this.patterns.length > 0 
        ? this.getMostCommon(this.patterns.map(p => p.projectType))
        : 'none',
      learningDataSize: this.patterns.length
    };
  }
}

// Singleton instance
export const learningSystem = new LearningSystem();

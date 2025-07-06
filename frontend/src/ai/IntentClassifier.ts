import * as tf from '@tensorflow/tfjs';
import nlp from 'compromise';

export interface ProjectIntent {
  projectType: 'calculator' | 'todo' | 'api' | 'data_analysis' | 'gui_app' | 'web_app' | 'game' | 'utility';
  complexity: 'simple' | 'intermediate' | 'advanced' | 'enterprise';
  features: string[];
  techStack: string[];
  confidence: number;
  needsClarification: boolean;
}

export interface ClassificationResult {
  intent: ProjectIntent;
  reasoning: string[];
  suggestions: string[];
}

export class IntentClassifier {
  private projectPatterns = {
    calculator: {
      keywords: ['calculator', 'math', 'arithmetic', 'compute', 'calculate', 'operations', 'numbers'],
      phrases: ['basic math', 'scientific calculator', 'arithmetic operations'],
      complexity_indicators: {
        simple: ['basic', 'simple', 'add', 'subtract', 'multiply', 'divide'],
        intermediate: ['scientific', 'functions', 'memory', 'history'],
        advanced: ['graphing', 'programming', 'complex', 'statistical'],
        enterprise: ['multi-user', 'cloud', 'api', 'database']
      }
    },
    todo: {
      keywords: ['todo', 'task', 'list', 'manage', 'organize', 'reminder', 'schedule'],
      phrases: ['task management', 'todo list', 'task tracker'],
      complexity_indicators: {
        simple: ['basic', 'simple', 'list', 'add', 'delete'],
        intermediate: ['categories', 'due dates', 'priority', 'search'],
        advanced: ['collaboration', 'notifications', 'recurring', 'analytics'],
        enterprise: ['teams', 'reporting', 'integration', 'workflow']
      }
    },
    api: {
      keywords: ['api', 'rest', 'endpoint', 'service', 'backend', 'server', 'microservice'],
      phrases: ['rest api', 'web service', 'backend service'],
      complexity_indicators: {
        simple: ['crud', 'basic', 'simple', 'get', 'post'],
        intermediate: ['authentication', 'validation', 'middleware', 'database'],
        advanced: ['microservices', 'caching', 'rate limiting', 'monitoring'],
        enterprise: ['scalability', 'load balancing', 'distributed', 'kubernetes']
      }
    },
    data_analysis: {
      keywords: ['data', 'analysis', 'analytics', 'visualization', 'chart', 'graph', 'statistics'],
      phrases: ['data analysis', 'data visualization', 'statistical analysis'],
      complexity_indicators: {
        simple: ['basic', 'simple', 'csv', 'chart', 'plot'],
        intermediate: ['pandas', 'numpy', 'multiple datasets', 'filtering'],
        advanced: ['machine learning', 'predictive', 'clustering', 'regression'],
        enterprise: ['big data', 'real-time', 'streaming', 'distributed']
      }
    },
    gui_app: {
      keywords: ['gui', 'desktop', 'window', 'interface', 'tkinter', 'qt', 'electron'],
      phrases: ['desktop application', 'gui application', 'desktop app'],
      complexity_indicators: {
        simple: ['basic', 'simple', 'window', 'buttons', 'forms'],
        intermediate: ['menus', 'dialogs', 'file handling', 'settings'],
        advanced: ['custom widgets', 'themes', 'plugins', 'multi-window'],
        enterprise: ['installer', 'auto-update', 'licensing', 'enterprise features']
      }
    },
    web_app: {
      keywords: ['web', 'website', 'html', 'css', 'javascript', 'react', 'vue', 'angular'],
      phrases: ['web application', 'website', 'web app'],
      complexity_indicators: {
        simple: ['static', 'basic', 'simple', 'html', 'css'],
        intermediate: ['interactive', 'forms', 'javascript', 'responsive'],
        advanced: ['spa', 'framework', 'state management', 'routing'],
        enterprise: ['ssr', 'microservices', 'cdn', 'performance optimization']
      }
    },
    game: {
      keywords: ['game', 'gaming', 'play', 'player', 'score', 'level', 'puzzle'],
      phrases: ['simple game', 'puzzle game', 'arcade game'],
      complexity_indicators: {
        simple: ['basic', 'simple', 'text', 'console', 'turn-based'],
        intermediate: ['graphics', 'animation', 'sound', 'levels'],
        advanced: ['3d', 'physics', 'multiplayer', 'ai opponents'],
        enterprise: ['mmo', 'server infrastructure', 'monetization', 'analytics']
      }
    },
    utility: {
      keywords: ['utility', 'tool', 'helper', 'converter', 'generator', 'automation'],
      phrases: ['utility tool', 'helper application', 'automation script'],
      complexity_indicators: {
        simple: ['basic', 'simple', 'convert', 'generate', 'single purpose'],
        intermediate: ['batch processing', 'file handling', 'configuration'],
        advanced: ['scheduling', 'monitoring', 'integration', 'plugins'],
        enterprise: ['enterprise integration', 'scalability', 'monitoring', 'reporting']
      }
    }
  };

  private featurePatterns = {
    authentication: ['login', 'auth', 'user', 'password', 'signin', 'signup'],
    database: ['database', 'db', 'storage', 'persist', 'save', 'store'],
    api_integration: ['api', 'integration', 'external', 'service', 'third-party'],
    real_time: ['real-time', 'live', 'websocket', 'streaming', 'instant'],
    mobile_responsive: ['mobile', 'responsive', 'tablet', 'phone', 'adaptive'],
    testing: ['test', 'testing', 'unit test', 'integration test', 'automated'],
    deployment: ['deploy', 'deployment', 'docker', 'cloud', 'production'],
    monitoring: ['monitoring', 'logging', 'analytics', 'metrics', 'tracking'],
    security: ['security', 'secure', 'encryption', 'ssl', 'https', 'protection'],
    performance: ['performance', 'fast', 'optimization', 'caching', 'speed']
  };

  private techStackPatterns = {
    python: ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
    javascript: ['javascript', 'js', 'node', 'react', 'vue', 'angular'],
    typescript: ['typescript', 'ts'],
    database: ['mysql', 'postgresql', 'mongodb', 'sqlite', 'redis'],
    cloud: ['aws', 'azure', 'gcp', 'cloud', 'serverless'],
    frontend: ['html', 'css', 'bootstrap', 'tailwind', 'sass'],
    testing: ['pytest', 'jest', 'mocha', 'cypress', 'selenium'],
    deployment: ['docker', 'kubernetes', 'heroku', 'vercel', 'netlify']
  };

  async classifyIntent(userInput: string): Promise<ClassificationResult> {
    const normalizedInput = userInput.toLowerCase().trim();
    const doc = nlp(userInput);
    
    // Extract entities and analyze structure
    const entities = this.extractEntities(doc);
    const projectType = this.determineProjectType(normalizedInput, entities);
    const complexity = this.assessComplexity(normalizedInput, projectType);
    const features = this.identifyFeatures(normalizedInput);
    const techStack = this.identifyTechStack(normalizedInput);
    
    // Calculate confidence based on keyword matches and structure
    const confidence = this.calculateConfidence(normalizedInput, projectType, entities);
    
    // Determine if clarification is needed
    const needsClarification = confidence < 0.7 || this.requiresClarification(normalizedInput, projectType);
    
    const intent: ProjectIntent = {
      projectType,
      complexity,
      features,
      techStack,
      confidence,
      needsClarification
    };

    const reasoning = this.generateReasoning(normalizedInput, intent);
    const suggestions = this.generateSuggestions(intent);

    return {
      intent,
      reasoning,
      suggestions
    };
  }

  private extractEntities(doc: any): any {
    return {
      nouns: doc.nouns().out('array'),
      verbs: doc.verbs().out('array'),
      adjectives: doc.adjectives().out('array'),
      topics: doc.topics().out('array'),
      organizations: doc.organizations().out('array'),
      technologies: doc.match('#Technology').out('array')
    };
  }

  private determineProjectType(input: string, entities: any): ProjectIntent['projectType'] {
    const scores: Record<string, number> = {};
    
    // Score each project type based on keyword matches
    Object.entries(this.projectPatterns).forEach(([type, patterns]) => {
      let score = 0;
      
      // Check keywords
      patterns.keywords.forEach(keyword => {
        if (input.includes(keyword)) {
          score += 2;
        }
      });
      
      // Check phrases
      patterns.phrases.forEach(phrase => {
        if (input.includes(phrase)) {
          score += 3;
        }
      });
      
      // Check entity matches
      entities.nouns.forEach((noun: string) => {
        if (patterns.keywords.includes(noun.toLowerCase())) {
          score += 1;
        }
      });
      
      scores[type] = score;
    });
    
    // Return the highest scoring type, default to 'utility' if no clear match
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return 'utility';
    
    const bestMatch = Object.entries(scores).find(([_, score]) => score === maxScore);
    return bestMatch ? bestMatch[0] as ProjectIntent['projectType'] : 'utility';
  }

  private assessComplexity(input: string, projectType: ProjectIntent['projectType']): ProjectIntent['complexity'] {
    const patterns = this.projectPatterns[projectType];
    if (!patterns) return 'simple';
    
    const complexityScores = {
      simple: 0,
      intermediate: 0,
      advanced: 0,
      enterprise: 0
    };
    
    // Score complexity based on indicators
    Object.entries(patterns.complexity_indicators).forEach(([level, indicators]) => {
      indicators.forEach(indicator => {
        if (input.includes(indicator)) {
          complexityScores[level as keyof typeof complexityScores] += 1;
        }
      });
    });
    
    // Additional complexity indicators
    if (input.includes('comprehensive') || input.includes('full-featured')) {
      complexityScores.advanced += 2;
    }
    if (input.includes('enterprise') || input.includes('scalable') || input.includes('production')) {
      complexityScores.enterprise += 2;
    }
    if (input.includes('simple') || input.includes('basic') || input.includes('minimal')) {
      complexityScores.simple += 2;
    }
    
    // Return the highest scoring complexity
    const maxScore = Math.max(...Object.values(complexityScores));
    if (maxScore === 0) return 'simple';
    
    const bestMatch = Object.entries(complexityScores).find(([_, score]) => score === maxScore);
    return bestMatch ? bestMatch[0] as ProjectIntent['complexity'] : 'simple';
  }

  private identifyFeatures(input: string): string[] {
    const features: string[] = [];
    
    Object.entries(this.featurePatterns).forEach(([feature, keywords]) => {
      if (keywords.some(keyword => input.includes(keyword))) {
        features.push(feature);
      }
    });
    
    return features;
  }

  private identifyTechStack(input: string): string[] {
    const techStack: string[] = [];
    
    Object.entries(this.techStackPatterns).forEach(([tech, keywords]) => {
      if (keywords.some(keyword => input.includes(keyword))) {
        techStack.push(tech);
      }
    });
    
    return techStack;
  }

  private calculateConfidence(input: string, projectType: string, entities: any): number {
    let confidence = 0.5; // Base confidence
    
    const patterns = this.projectPatterns[projectType as keyof typeof this.projectPatterns];
    if (!patterns) return 0.3;
    
    // Increase confidence based on keyword matches
    const keywordMatches = patterns.keywords.filter(keyword => input.includes(keyword)).length;
    confidence += (keywordMatches / patterns.keywords.length) * 0.3;
    
    // Increase confidence based on phrase matches
    const phraseMatches = patterns.phrases.filter(phrase => input.includes(phrase)).length;
    confidence += (phraseMatches / patterns.phrases.length) * 0.2;
    
    // Adjust based on input length and structure
    if (input.length > 50) confidence += 0.1;
    if (entities.nouns.length > 2) confidence += 0.1;
    if (entities.verbs.length > 1) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  private requiresClarification(input: string, projectType: string): boolean {
    // Check if input is too vague
    if (input.length < 10) return true;
    
    // Check for ambiguous terms
    const ambiguousTerms = ['app', 'application', 'program', 'software', 'system'];
    const hasOnlyAmbiguousTerms = ambiguousTerms.some(term => input.includes(term)) && 
                                  input.split(' ').length < 5;
    
    if (hasOnlyAmbiguousTerms) return true;
    
    // Check if project type confidence is low
    const patterns = this.projectPatterns[projectType as keyof typeof this.projectPatterns];
    if (!patterns) return true;
    
    const hasSpecificKeywords = patterns.keywords.some(keyword => input.includes(keyword));
    return !hasSpecificKeywords;
  }

  private generateReasoning(input: string, intent: ProjectIntent): string[] {
    const reasoning: string[] = [];
    
    reasoning.push(`Identified project type as "${intent.projectType}" based on keyword analysis`);
    reasoning.push(`Assessed complexity as "${intent.complexity}" based on feature requirements`);
    
    if (intent.features.length > 0) {
      reasoning.push(`Detected features: ${intent.features.join(', ')}`);
    }
    
    if (intent.techStack.length > 0) {
      reasoning.push(`Suggested tech stack: ${intent.techStack.join(', ')}`);
    }
    
    if (intent.confidence < 0.7) {
      reasoning.push('Low confidence score suggests need for clarification');
    }
    
    return reasoning;
  }

  private generateSuggestions(intent: ProjectIntent): string[] {
    const suggestions: string[] = [];
    const patterns = this.projectPatterns[intent.projectType];
    
    if (!patterns) return suggestions;
    
    // Generate complexity-based suggestions
    const complexityIndicators = patterns.complexity_indicators[intent.complexity];
    if (complexityIndicators) {
      suggestions.push(`Consider including: ${complexityIndicators.slice(0, 3).join(', ')}`);
    }
    
    // Generate feature suggestions based on project type
    switch (intent.projectType) {
      case 'calculator':
        suggestions.push('Add error handling for division by zero');
        suggestions.push('Include memory functions (M+, M-, MR, MC)');
        break;
      case 'todo':
        suggestions.push('Add due date functionality');
        suggestions.push('Include priority levels for tasks');
        break;
      case 'api':
        suggestions.push('Implement proper authentication');
        suggestions.push('Add input validation and error handling');
        break;
      case 'data_analysis':
        suggestions.push('Include data visualization charts');
        suggestions.push('Add export functionality for results');
        break;
    }
    
    return suggestions;
  }
}

export const intentClassifier = new IntentClassifier();

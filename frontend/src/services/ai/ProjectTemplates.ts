import { ProjectIntent } from '../../ai/IntentClassifier';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  projectType: ProjectIntent['projectType'];
  complexity: ProjectIntent['complexity'];
  features: string[];
  techStack: string[];
  estimatedTime: string;
  requirements: string;
  examples: string[];
  tags: string[];
}

export interface TemplateCategory {
  name: string;
  description: string;
  templates: ProjectTemplate[];
}

export class ProjectTemplateService {
  private templates: ProjectTemplate[] = [
    // Calculator Templates
    {
      id: 'basic-calculator',
      name: 'Basic Calculator',
      description: 'Simple calculator with basic arithmetic operations',
      projectType: 'calculator',
      complexity: 'simple',
      features: ['basic_operations', 'error_handling'],
      techStack: ['python'],
      estimatedTime: '15-30 minutes',
      requirements: 'Create a calculator that can perform basic arithmetic operations (addition, subtraction, multiplication, division) with proper error handling for division by zero.',
      examples: [
        'Calculator with +, -, *, / operations',
        'Command-line calculator with input validation',
        'Simple math calculator with error messages'
      ],
      tags: ['beginner', 'math', 'console']
    },
    {
      id: 'scientific-calculator',
      name: 'Scientific Calculator',
      description: 'Advanced calculator with scientific functions',
      projectType: 'calculator',
      complexity: 'intermediate',
      features: ['scientific_functions', 'memory', 'history', 'error_handling'],
      techStack: ['python', 'gui'],
      estimatedTime: '45-60 minutes',
      requirements: 'Create a scientific calculator with advanced mathematical functions including trigonometry, logarithms, exponentials, memory functions (M+, M-, MR, MC), and calculation history.',
      examples: [
        'Scientific calculator with sin, cos, tan functions',
        'Calculator with memory and history features',
        'Advanced math calculator with GUI interface'
      ],
      tags: ['intermediate', 'math', 'gui', 'scientific']
    },

    // Todo Application Templates
    {
      id: 'simple-todo',
      name: 'Simple Todo List',
      description: 'Basic task management application',
      projectType: 'todo',
      complexity: 'simple',
      features: ['task_management', 'persistence'],
      techStack: ['python'],
      estimatedTime: '30-45 minutes',
      requirements: 'Create a todo list application that allows users to add, remove, and mark tasks as complete. Include data persistence to save tasks between sessions.',
      examples: [
        'Command-line todo list with file storage',
        'Simple task manager with add/remove/complete',
        'Basic todo app with persistent storage'
      ],
      tags: ['beginner', 'productivity', 'console']
    },
    {
      id: 'advanced-todo',
      name: 'Advanced Todo Manager',
      description: 'Feature-rich task management with categories and priorities',
      projectType: 'todo',
      complexity: 'intermediate',
      features: ['categories', 'priorities', 'due_dates', 'search', 'database'],
      techStack: ['python', 'database', 'gui'],
      estimatedTime: '60-90 minutes',
      requirements: 'Create a comprehensive todo application with task categories, priority levels, due dates, search functionality, and database storage. Include a user-friendly interface.',
      examples: [
        'Todo app with categories and priority levels',
        'Task manager with due dates and notifications',
        'Advanced todo list with search and filtering'
      ],
      tags: ['intermediate', 'productivity', 'database', 'gui']
    },

    // API Templates
    {
      id: 'simple-rest-api',
      name: 'Simple REST API',
      description: 'Basic CRUD API with endpoints',
      projectType: 'api',
      complexity: 'simple',
      features: ['crud_operations', 'json_responses'],
      techStack: ['python', 'fastapi'],
      estimatedTime: '45-60 minutes',
      requirements: 'Create a REST API with basic CRUD operations (Create, Read, Update, Delete) for managing a simple resource. Include proper JSON responses and HTTP status codes.',
      examples: [
        'User management API with CRUD operations',
        'Product catalog API with basic endpoints',
        'Simple blog API with posts management'
      ],
      tags: ['intermediate', 'backend', 'api', 'web']
    },
    {
      id: 'secure-api',
      name: 'Secure REST API',
      description: 'API with authentication and validation',
      projectType: 'api',
      complexity: 'advanced',
      features: ['authentication', 'validation', 'database', 'security', 'documentation'],
      techStack: ['python', 'fastapi', 'database', 'security'],
      estimatedTime: '90-120 minutes',
      requirements: 'Create a secure REST API with user authentication, input validation, database integration, proper error handling, and comprehensive API documentation.',
      examples: [
        'User authentication API with JWT tokens',
        'E-commerce API with secure endpoints',
        'Task management API with user authorization'
      ],
      tags: ['advanced', 'backend', 'security', 'database']
    },

    // Data Analysis Templates
    {
      id: 'csv-analyzer',
      name: 'CSV Data Analyzer',
      description: 'Tool for analyzing CSV files with visualizations',
      projectType: 'data_analysis',
      complexity: 'intermediate',
      features: ['data_processing', 'visualization', 'statistics'],
      techStack: ['python', 'pandas', 'matplotlib'],
      estimatedTime: '60-75 minutes',
      requirements: 'Create a data analysis tool that can read CSV files, perform statistical analysis, and generate visualizations including charts and graphs.',
      examples: [
        'Sales data analyzer with charts',
        'Student grades analyzer with statistics',
        'Financial data processor with visualizations'
      ],
      tags: ['intermediate', 'data', 'visualization', 'analytics']
    },
    {
      id: 'ml-predictor',
      name: 'Machine Learning Predictor',
      description: 'Predictive model with data preprocessing',
      projectType: 'data_analysis',
      complexity: 'advanced',
      features: ['machine_learning', 'data_preprocessing', 'model_evaluation'],
      techStack: ['python', 'pandas', 'scikit-learn'],
      estimatedTime: '120-150 minutes',
      requirements: 'Create a machine learning application that preprocesses data, trains a predictive model, evaluates performance, and makes predictions on new data.',
      examples: [
        'House price prediction model',
        'Customer churn prediction system',
        'Stock price forecasting tool'
      ],
      tags: ['advanced', 'machine-learning', 'prediction', 'analytics']
    },

    // Web Application Templates
    {
      id: 'simple-web-app',
      name: 'Simple Web Application',
      description: 'Basic web app with forms and pages',
      projectType: 'web_app',
      complexity: 'intermediate',
      features: ['forms', 'routing', 'responsive_design'],
      techStack: ['python', 'html', 'css', 'javascript'],
      estimatedTime: '75-90 minutes',
      requirements: 'Create a simple web application with multiple pages, forms for user input, responsive design, and basic interactivity.',
      examples: [
        'Personal portfolio website',
        'Contact form with validation',
        'Simple blog with multiple pages'
      ],
      tags: ['intermediate', 'web', 'frontend', 'responsive']
    },
    {
      id: 'full-stack-app',
      name: 'Full-Stack Web Application',
      description: 'Complete web app with backend and database',
      projectType: 'web_app',
      complexity: 'advanced',
      features: ['authentication', 'database', 'api_integration', 'real_time'],
      techStack: ['python', 'fastapi', 'database', 'frontend'],
      estimatedTime: '150-180 minutes',
      requirements: 'Create a full-stack web application with user authentication, database integration, API endpoints, and real-time features.',
      examples: [
        'Social media platform with posts and comments',
        'E-commerce site with shopping cart',
        'Project management tool with real-time updates'
      ],
      tags: ['advanced', 'full-stack', 'database', 'real-time']
    },

    // Game Templates
    {
      id: 'text-game',
      name: 'Text-Based Game',
      description: 'Simple console game with gameplay mechanics',
      projectType: 'game',
      complexity: 'simple',
      features: ['game_logic', 'user_interaction', 'scoring'],
      techStack: ['python'],
      estimatedTime: '45-60 minutes',
      requirements: 'Create a text-based game with engaging gameplay mechanics, user interaction, scoring system, and win/lose conditions.',
      examples: [
        'Number guessing game with hints',
        'Text adventure with choices',
        'Word puzzle game with scoring'
      ],
      tags: ['beginner', 'game', 'console', 'interactive']
    },
    {
      id: 'gui-game',
      name: 'GUI Game',
      description: 'Graphical game with visual interface',
      projectType: 'game',
      complexity: 'intermediate',
      features: ['graphics', 'animation', 'sound', 'levels'],
      techStack: ['python', 'gui', 'graphics'],
      estimatedTime: '90-120 minutes',
      requirements: 'Create a graphical game with visual interface, animations, sound effects, multiple levels, and engaging gameplay.',
      examples: [
        'Snake game with graphics',
        'Puzzle game with animations',
        'Arcade-style game with levels'
      ],
      tags: ['intermediate', 'game', 'gui', 'graphics']
    },

    // Utility Templates
    {
      id: 'file-organizer',
      name: 'File Organizer',
      description: 'Tool for organizing files by type or date',
      projectType: 'utility',
      complexity: 'simple',
      features: ['file_handling', 'automation', 'organization'],
      techStack: ['python'],
      estimatedTime: '30-45 minutes',
      requirements: 'Create a utility that automatically organizes files in a directory by type, date, or custom criteria. Include options for different organization methods.',
      examples: [
        'Photo organizer by date taken',
        'Document sorter by file type',
        'Download folder organizer'
      ],
      tags: ['beginner', 'utility', 'automation', 'files']
    },
    {
      id: 'system-monitor',
      name: 'System Monitor',
      description: 'Tool for monitoring system resources',
      projectType: 'utility',
      complexity: 'intermediate',
      features: ['monitoring', 'real_time', 'alerts', 'logging'],
      techStack: ['python', 'system'],
      estimatedTime: '60-75 minutes',
      requirements: 'Create a system monitoring tool that tracks CPU, memory, disk usage, and network activity. Include real-time updates, alerts, and logging.',
      examples: [
        'CPU and memory usage monitor',
        'Network traffic analyzer',
        'Disk space monitoring tool'
      ],
      tags: ['intermediate', 'utility', 'monitoring', 'system']
    }
  ];

  private categories: TemplateCategory[] = [
    {
      name: 'Calculators & Math',
      description: 'Mathematical applications and calculators',
      templates: this.templates.filter(t => t.projectType === 'calculator')
    },
    {
      name: 'Task Management',
      description: 'Todo lists and productivity applications',
      templates: this.templates.filter(t => t.projectType === 'todo')
    },
    {
      name: 'APIs & Backend',
      description: 'REST APIs and backend services',
      templates: this.templates.filter(t => t.projectType === 'api')
    },
    {
      name: 'Data & Analytics',
      description: 'Data analysis and machine learning applications',
      templates: this.templates.filter(t => t.projectType === 'data_analysis')
    },
    {
      name: 'Web Applications',
      description: 'Web-based applications and websites',
      templates: this.templates.filter(t => t.projectType === 'web_app')
    },
    {
      name: 'Games & Entertainment',
      description: 'Games and interactive entertainment',
      templates: this.templates.filter(t => t.projectType === 'game')
    },
    {
      name: 'Utilities & Tools',
      description: 'Utility applications and automation tools',
      templates: this.templates.filter(t => t.projectType === 'utility')
    }
  ];

  // Get all templates
  getAllTemplates(): ProjectTemplate[] {
    return this.templates;
  }

  // Get templates by category
  getTemplatesByCategory(): TemplateCategory[] {
    return this.categories;
  }

  // Get template by ID
  getTemplateById(id: string): ProjectTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }

  // Get templates by project type
  getTemplatesByType(projectType: ProjectIntent['projectType']): ProjectTemplate[] {
    return this.templates.filter(template => template.projectType === projectType);
  }

  // Get templates by complexity
  getTemplatesByComplexity(complexity: ProjectIntent['complexity']): ProjectTemplate[] {
    return this.templates.filter(template => template.complexity === complexity);
  }

  // Search templates by keyword
  searchTemplates(query: string): ProjectTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    
    return this.templates.filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.requirements.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      template.features.some(feature => feature.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Get recommended templates based on intent
  getRecommendedTemplates(intent: ProjectIntent): ProjectTemplate[] {
    // Start with templates matching the project type
    let candidates = this.getTemplatesByType(intent.projectType);
    
    // If no exact matches, get similar templates
    if (candidates.length === 0) {
      candidates = this.templates;
    }
    
    // Score templates based on intent match
    const scoredTemplates = candidates.map(template => ({
      template,
      score: this.calculateTemplateScore(template, intent)
    }));
    
    // Sort by score and return top matches
    return scoredTemplates
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(item => item.template);
  }

  // Calculate how well a template matches an intent
  private calculateTemplateScore(template: ProjectTemplate, intent: ProjectIntent): number {
    let score = 0;
    
    // Project type match (highest weight)
    if (template.projectType === intent.projectType) {
      score += 10;
    }
    
    // Complexity match
    if (template.complexity === intent.complexity) {
      score += 5;
    } else {
      // Partial credit for adjacent complexity levels
      const complexityOrder = ['simple', 'intermediate', 'advanced', 'enterprise'];
      const templateIndex = complexityOrder.indexOf(template.complexity);
      const intentIndex = complexityOrder.indexOf(intent.complexity);
      const distance = Math.abs(templateIndex - intentIndex);
      score += Math.max(0, 3 - distance);
    }
    
    // Feature matches
    const featureMatches = template.features.filter(feature => 
      intent.features.includes(feature)
    ).length;
    score += featureMatches * 2;
    
    // Tech stack matches
    const techMatches = template.techStack.filter(tech => 
      intent.techStack.includes(tech)
    ).length;
    score += techMatches * 1.5;
    
    return score;
  }

  // Get templates for beginners
  getBeginnerTemplates(): ProjectTemplate[] {
    return this.templates.filter(template => 
      template.complexity === 'simple' || 
      template.tags.includes('beginner')
    );
  }

  // Get popular templates (based on common project types)
  getPopularTemplates(): ProjectTemplate[] {
    const popularIds = [
      'basic-calculator',
      'simple-todo',
      'simple-rest-api',
      'csv-analyzer',
      'simple-web-app',
      'text-game',
      'file-organizer'
    ];
    
    return popularIds
      .map(id => this.getTemplateById(id))
      .filter(template => template !== undefined) as ProjectTemplate[];
  }

  // Get templates by estimated time
  getTemplatesByTime(maxMinutes: number): ProjectTemplate[] {
    return this.templates.filter(template => {
      const timeRange = template.estimatedTime;
      const maxTime = parseInt(timeRange.split('-')[1]) || 0;
      return maxTime <= maxMinutes;
    });
  }

  // Get templates by tags
  getTemplatesByTags(tags: string[]): ProjectTemplate[] {
    return this.templates.filter(template =>
      tags.some(tag => template.tags.includes(tag.toLowerCase()))
    );
  }

  // Generate template variations
  generateTemplateVariations(baseTemplate: ProjectTemplate): ProjectTemplate[] {
    const variations: ProjectTemplate[] = [];
    
    // Create simpler version
    if (baseTemplate.complexity !== 'simple') {
      const simplerComplexity = baseTemplate.complexity === 'intermediate' ? 'simple' : 'intermediate';
      variations.push({
        ...baseTemplate,
        id: `${baseTemplate.id}-simple`,
        name: `Simple ${baseTemplate.name}`,
        complexity: simplerComplexity,
        features: baseTemplate.features.slice(0, Math.ceil(baseTemplate.features.length / 2)),
        estimatedTime: this.reduceEstimatedTime(baseTemplate.estimatedTime)
      });
    }
    
    // Create more complex version
    if (baseTemplate.complexity !== 'enterprise') {
      const complexerComplexity = baseTemplate.complexity === 'simple' ? 'intermediate' : 'advanced';
      variations.push({
        ...baseTemplate,
        id: `${baseTemplate.id}-advanced`,
        name: `Advanced ${baseTemplate.name}`,
        complexity: complexerComplexity,
        features: [...baseTemplate.features, 'advanced_features', 'optimization'],
        estimatedTime: this.increaseEstimatedTime(baseTemplate.estimatedTime)
      });
    }
    
    return variations;
  }

  private reduceEstimatedTime(timeRange: string): string {
    const [min, max] = timeRange.split('-').map(t => parseInt(t));
    return `${Math.max(15, min - 15)}-${Math.max(30, max - 15)} minutes`;
  }

  private increaseEstimatedTime(timeRange: string): string {
    const [min, max] = timeRange.split('-').map(t => parseInt(t));
    return `${min + 30}-${max + 45} minutes`;
  }
}

export const projectTemplateService = new ProjectTemplateService();

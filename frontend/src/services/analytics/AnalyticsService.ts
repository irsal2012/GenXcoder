import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export interface AnalyticsEvent {
  id: string;
  timestamp: Date;
  userId: string;
  sessionId?: string;
  eventType: 'user_action' | 'system_event' | 'performance' | 'error' | 'business';
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  duration?: number;
  success?: boolean;
}

export interface UserMetrics {
  userId: string;
  totalSessions: number;
  totalDuration: number;
  averageSessionDuration: number;
  projectsGenerated: number;
  collaborationSessions: number;
  voiceMinutes: number;
  messagesExchanged: number;
  lastActive: Date;
  preferredFeatures: string[];
  productivityScore: number;
}

export interface TeamMetrics {
  teamId: string;
  memberCount: number;
  totalCollaborationTime: number;
  averageSessionDuration: number;
  projectsCompleted: number;
  communicationEfficiency: number;
  knowledgeSharing: number;
  teamProductivity: number;
  mostActiveMembers: string[];
  peakCollaborationHours: number[];
}

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  averageResponseTime: number;
  errorRate: number;
  systemUptime: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    storage: number;
  };
  featureUsage: Record<string, number>;
}

export interface BusinessMetrics {
  revenue: number;
  conversionRate: number;
  customerSatisfaction: number;
  retentionRate: number;
  growthRate: number;
  marketShare: number;
  competitiveAdvantage: number;
}

export interface AnalyticsInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  data: any;
  createdAt: Date;
}

export interface AnalyticsDashboard {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalProjects: number;
    successRate: number;
    averageGenerationTime: number;
    userSatisfaction: number;
  };
  trends: {
    userGrowth: Array<{ date: string; users: number }>;
    projectGeneration: Array<{ date: string; projects: number }>;
    collaboration: Array<{ date: string; sessions: number }>;
    performance: Array<{ date: string; responseTime: number }>;
  };
  insights: AnalyticsInsight[];
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
  }>;
}

export class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private userMetrics: Map<string, UserMetrics> = new Map();
  private teamMetrics: Map<string, TeamMetrics> = new Map();
  private insights: AnalyticsInsight[] = [];
  private readonly STORAGE_KEY = 'genxcoder-analytics';
  private readonly MAX_EVENTS = 10000;

  constructor() {
    this.loadFromStorage();
    this.startPeriodicAnalysis();
  }

  // Event Tracking
  trackEvent(
    eventType: AnalyticsEvent['eventType'],
    category: string,
    action: string,
    options: {
      label?: string;
      value?: number;
      metadata?: Record<string, any>;
      duration?: number;
      success?: boolean;
      userId?: string;
      sessionId?: string;
    } = {}
  ): void {
    const event: AnalyticsEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      userId: options.userId || 'anonymous',
      sessionId: options.sessionId,
      eventType,
      category,
      action,
      label: options.label,
      value: options.value,
      metadata: options.metadata,
      duration: options.duration,
      success: options.success
    };

    this.events.push(event);

    // Limit storage size
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    this.updateMetrics(event);
    this.saveToStorage();
  }

  // User Analytics
  trackUserAction(
    action: string,
    options: {
      category?: string;
      label?: string;
      value?: number;
      metadata?: Record<string, any>;
      userId?: string;
    } = {}
  ): void {
    this.trackEvent('user_action', options.category || 'general', action, options);
  }

  trackPerformance(
    action: string,
    duration: number,
    options: {
      category?: string;
      success?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    this.trackEvent('performance', options.category || 'system', action, {
      ...options,
      duration
    });
  }

  trackError(
    error: string,
    options: {
      category?: string;
      metadata?: Record<string, any>;
      userId?: string;
    } = {}
  ): void {
    this.trackEvent('error', options.category || 'system', error, {
      ...options,
      success: false
    });
  }

  trackBusinessEvent(
    action: string,
    value: number,
    options: {
      category?: string;
      label?: string;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    this.trackEvent('business', options.category || 'revenue', action, {
      ...options,
      value
    });
  }

  // Metrics Calculation
  getUserMetrics(userId: string): UserMetrics | null {
    return this.userMetrics.get(userId) || null;
  }

  getTeamMetrics(teamId: string): TeamMetrics | null {
    return this.teamMetrics.get(teamId) || null;
  }

  getSystemMetrics(): SystemMetrics {
    const now = new Date();
    const last24Hours = subDays(now, 1);
    
    const recentEvents = this.events.filter(e => e.timestamp >= last24Hours);
    const userEvents = recentEvents.filter(e => e.eventType === 'user_action');
    const performanceEvents = recentEvents.filter(e => e.eventType === 'performance');
    const errorEvents = recentEvents.filter(e => e.eventType === 'error');

    const uniqueUsers = new Set(userEvents.map(e => e.userId)).size;
    const totalUsers = this.userMetrics.size;

    const avgResponseTime = performanceEvents.length > 0
      ? performanceEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / performanceEvents.length
      : 0;

    const errorRate = recentEvents.length > 0
      ? errorEvents.length / recentEvents.length
      : 0;

    // Feature usage analysis
    const featureUsage: Record<string, number> = {};
    userEvents.forEach(event => {
      const feature = event.category;
      featureUsage[feature] = (featureUsage[feature] || 0) + 1;
    });

    return {
      totalUsers,
      activeUsers: uniqueUsers,
      totalSessions: this.getSessionCount(),
      averageResponseTime: avgResponseTime,
      errorRate,
      systemUptime: 0.99, // Mock value
      resourceUtilization: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        storage: Math.random() * 100
      },
      featureUsage
    };
  }

  getBusinessMetrics(): BusinessMetrics {
    const businessEvents = this.events.filter(e => e.eventType === 'business');
    const revenue = businessEvents
      .filter(e => e.category === 'revenue')
      .reduce((sum, e) => sum + (e.value || 0), 0);

    return {
      revenue,
      conversionRate: 0.15, // Mock values
      customerSatisfaction: 4.2,
      retentionRate: 0.85,
      growthRate: 0.25,
      marketShare: 0.12,
      competitiveAdvantage: 0.78
    };
  }

  // Dashboard Data
  getDashboardData(dateRange: { start: Date; end: Date }): AnalyticsDashboard {
    const filteredEvents = this.events.filter(e =>
      isWithinInterval(e.timestamp, dateRange)
    );

    const overview = this.calculateOverview(filteredEvents);
    const trends = this.calculateTrends(filteredEvents, dateRange);
    const insights = this.getInsights();
    const alerts = this.getAlerts();

    return {
      overview,
      trends,
      insights,
      alerts
    };
  }

  // Advanced Analytics
  generateInsights(): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];

    // User behavior insights
    const userInsights = this.analyzeUserBehavior();
    insights.push(...userInsights);

    // Performance insights
    const performanceInsights = this.analyzePerformance();
    insights.push(...performanceInsights);

    // Collaboration insights
    const collaborationInsights = this.analyzeCollaboration();
    insights.push(...collaborationInsights);

    // Business insights
    const businessInsights = this.analyzeBusinessMetrics();
    insights.push(...businessInsights);

    this.insights = insights;
    return insights;
  }

  getInsights(): AnalyticsInsight[] {
    return this.insights;
  }

  // Predictive Analytics
  predictUserChurn(userId: string): {
    riskLevel: 'low' | 'medium' | 'high';
    probability: number;
    factors: string[];
    recommendations: string[];
  } {
    const userMetrics = this.getUserMetrics(userId);
    if (!userMetrics) {
      return {
        riskLevel: 'high',
        probability: 0.9,
        factors: ['No user data available'],
        recommendations: ['Engage user with onboarding']
      };
    }

    const factors: string[] = [];
    let riskScore = 0;

    // Analyze activity patterns
    const daysSinceLastActive = Math.floor(
      (Date.now() - userMetrics.lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastActive > 7) {
      factors.push('Inactive for more than 7 days');
      riskScore += 0.3;
    }

    if (userMetrics.averageSessionDuration < 300) { // Less than 5 minutes
      factors.push('Short session durations');
      riskScore += 0.2;
    }

    if (userMetrics.projectsGenerated < 2) {
      factors.push('Low project generation');
      riskScore += 0.2;
    }

    if (userMetrics.collaborationSessions === 0) {
      factors.push('No collaboration activity');
      riskScore += 0.1;
    }

    const probability = Math.min(riskScore, 0.95);
    const riskLevel = probability > 0.7 ? 'high' : probability > 0.4 ? 'medium' : 'low';

    const recommendations = this.generateChurnRecommendations(factors);

    return {
      riskLevel,
      probability,
      factors,
      recommendations
    };
  }

  // Real-time Monitoring
  getRealtimeMetrics(): {
    activeUsers: number;
    currentSessions: number;
    averageResponseTime: number;
    errorRate: number;
    systemLoad: number;
  } {
    const now = new Date();
    const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);
    
    const recentEvents = this.events.filter(e => e.timestamp >= last5Minutes);
    const activeUsers = new Set(recentEvents.map(e => e.userId)).size;
    
    const performanceEvents = recentEvents.filter(e => e.eventType === 'performance');
    const errorEvents = recentEvents.filter(e => e.eventType === 'error');
    
    const avgResponseTime = performanceEvents.length > 0
      ? performanceEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / performanceEvents.length
      : 0;

    const errorRate = recentEvents.length > 0
      ? errorEvents.length / recentEvents.length
      : 0;

    return {
      activeUsers,
      currentSessions: this.getActiveSessions(),
      averageResponseTime: avgResponseTime,
      errorRate,
      systemLoad: Math.random() * 100 // Mock system load
    };
  }

  // Export and Reporting
  exportData(format: 'json' | 'csv', dateRange?: { start: Date; end: Date }): string {
    let data = this.events;
    
    if (dateRange) {
      data = this.events.filter(e =>
        isWithinInterval(e.timestamp, dateRange)
      );
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      return this.convertToCSV(data);
    }
  }

  generateReport(type: 'user' | 'team' | 'system' | 'business'): any {
    switch (type) {
      case 'user':
        return this.generateUserReport();
      case 'team':
        return this.generateTeamReport();
      case 'system':
        return this.generateSystemReport();
      case 'business':
        return this.generateBusinessReport();
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  }

  // Private Methods
  private updateMetrics(event: AnalyticsEvent): void {
    this.updateUserMetrics(event);
    if (event.sessionId) {
      this.updateTeamMetrics(event);
    }
  }

  private updateUserMetrics(event: AnalyticsEvent): void {
    const userId = event.userId;
    let metrics = this.userMetrics.get(userId);

    if (!metrics) {
      metrics = {
        userId,
        totalSessions: 0,
        totalDuration: 0,
        averageSessionDuration: 0,
        projectsGenerated: 0,
        collaborationSessions: 0,
        voiceMinutes: 0,
        messagesExchanged: 0,
        lastActive: event.timestamp,
        preferredFeatures: [],
        productivityScore: 0
      };
    }

    metrics.lastActive = event.timestamp;

    if (event.category === 'session' && event.action === 'start') {
      metrics.totalSessions++;
    }

    if (event.category === 'generation' && event.action === 'complete') {
      metrics.projectsGenerated++;
    }

    if (event.category === 'collaboration') {
      metrics.collaborationSessions++;
    }

    if (event.category === 'voice' && event.duration) {
      metrics.voiceMinutes += event.duration / 60000; // Convert to minutes
    }

    if (event.category === 'chat' && event.action === 'send') {
      metrics.messagesExchanged++;
    }

    if (event.duration) {
      metrics.totalDuration += event.duration;
      metrics.averageSessionDuration = metrics.totalDuration / metrics.totalSessions;
    }

    // Update preferred features
    if (!metrics.preferredFeatures.includes(event.category)) {
      metrics.preferredFeatures.push(event.category);
    }

    // Calculate productivity score
    metrics.productivityScore = this.calculateProductivityScore(metrics);

    this.userMetrics.set(userId, metrics);
  }

  private updateTeamMetrics(event: AnalyticsEvent): void {
    // Implementation for team metrics update
    // This would be more complex in a real implementation
  }

  private calculateOverview(events: AnalyticsEvent[]): AnalyticsDashboard['overview'] {
    const uniqueUsers = new Set(events.map(e => e.userId)).size;
    const activeUsers = new Set(
      events
        .filter(e => e.timestamp >= subDays(new Date(), 7))
        .map(e => e.userId)
    ).size;

    const projectEvents = events.filter(e => 
      e.category === 'generation' && e.action === 'complete'
    );

    const successfulProjects = projectEvents.filter(e => e.success).length;
    const successRate = projectEvents.length > 0 
      ? successfulProjects / projectEvents.length 
      : 0;

    const generationTimes = projectEvents
      .filter(e => e.duration)
      .map(e => e.duration!);
    
    const averageGenerationTime = generationTimes.length > 0
      ? generationTimes.reduce((sum, time) => sum + time, 0) / generationTimes.length
      : 0;

    return {
      totalUsers: uniqueUsers,
      activeUsers,
      totalProjects: projectEvents.length,
      successRate,
      averageGenerationTime,
      userSatisfaction: 4.2 // Mock value
    };
  }

  private calculateTrends(
    events: AnalyticsEvent[], 
    dateRange: { start: Date; end: Date }
  ): AnalyticsDashboard['trends'] {
    const days = Math.ceil(
      (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const userGrowth = [];
    const projectGeneration = [];
    const collaboration = [];
    const performance = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayEvents = events.filter(e =>
        isWithinInterval(e.timestamp, { start: dayStart, end: dayEnd })
      );

      userGrowth.push({
        date: format(date, 'yyyy-MM-dd'),
        users: new Set(dayEvents.map(e => e.userId)).size
      });

      projectGeneration.push({
        date: format(date, 'yyyy-MM-dd'),
        projects: dayEvents.filter(e => 
          e.category === 'generation' && e.action === 'complete'
        ).length
      });

      collaboration.push({
        date: format(date, 'yyyy-MM-dd'),
        sessions: dayEvents.filter(e => 
          e.category === 'collaboration'
        ).length
      });

      const perfEvents = dayEvents.filter(e => e.eventType === 'performance');
      const avgResponseTime = perfEvents.length > 0
        ? perfEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / perfEvents.length
        : 0;

      performance.push({
        date: format(date, 'yyyy-MM-dd'),
        responseTime: avgResponseTime
      });
    }

    return {
      userGrowth,
      projectGeneration,
      collaboration,
      performance
    };
  }

  private analyzeUserBehavior(): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];

    // Analyze user engagement patterns
    const userMetricsArray = Array.from(this.userMetrics.values());
    const avgSessionDuration = userMetricsArray.reduce(
      (sum, m) => sum + m.averageSessionDuration, 0
    ) / userMetricsArray.length;

    if (avgSessionDuration < 300) { // Less than 5 minutes
      insights.push({
        id: uuidv4(),
        type: 'opportunity',
        title: 'Low User Engagement',
        description: 'Average session duration is below optimal levels',
        impact: 'medium',
        confidence: 0.8,
        actionable: true,
        recommendations: [
          'Improve onboarding experience',
          'Add interactive tutorials',
          'Implement gamification elements'
        ],
        data: { avgSessionDuration },
        createdAt: new Date()
      });
    }

    return insights;
  }

  private analyzePerformance(): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];

    const performanceEvents = this.events.filter(e => e.eventType === 'performance');
    const avgResponseTime = performanceEvents.length > 0
      ? performanceEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / performanceEvents.length
      : 0;

    if (avgResponseTime > 5000) { // More than 5 seconds
      insights.push({
        id: uuidv4(),
        type: 'risk',
        title: 'High Response Times',
        description: 'System response times are above acceptable thresholds',
        impact: 'high',
        confidence: 0.9,
        actionable: true,
        recommendations: [
          'Optimize database queries',
          'Implement caching strategies',
          'Scale infrastructure resources'
        ],
        data: { avgResponseTime },
        createdAt: new Date()
      });
    }

    return insights;
  }

  private analyzeCollaboration(): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];

    const collaborationEvents = this.events.filter(e => e.category === 'collaboration');
    const totalUsers = this.userMetrics.size;
    const collaboratingUsers = new Set(collaborationEvents.map(e => e.userId)).size;
    const collaborationRate = totalUsers > 0 ? collaboratingUsers / totalUsers : 0;

    if (collaborationRate < 0.3) { // Less than 30% collaboration
      insights.push({
        id: uuidv4(),
        type: 'opportunity',
        title: 'Low Collaboration Adoption',
        description: 'Only a small percentage of users are using collaboration features',
        impact: 'medium',
        confidence: 0.7,
        actionable: true,
        recommendations: [
          'Promote collaboration features',
          'Create team-building incentives',
          'Improve collaboration UX'
        ],
        data: { collaborationRate },
        createdAt: new Date()
      });
    }

    return insights;
  }

  private analyzeBusinessMetrics(): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];

    const businessMetrics = this.getBusinessMetrics();
    
    if (businessMetrics.retentionRate < 0.8) {
      insights.push({
        id: uuidv4(),
        type: 'risk',
        title: 'Low User Retention',
        description: 'User retention rate is below industry standards',
        impact: 'high',
        confidence: 0.85,
        actionable: true,
        recommendations: [
          'Implement user feedback system',
          'Improve product value proposition',
          'Create loyalty programs'
        ],
        data: businessMetrics,
        createdAt: new Date()
      });
    }

    return insights;
  }

  private calculateProductivityScore(metrics: UserMetrics): number {
    let score = 0;

    // Project generation score (40%)
    score += Math.min(metrics.projectsGenerated / 10, 1) * 40;

    // Collaboration score (30%)
    score += Math.min(metrics.collaborationSessions / 5, 1) * 30;

    // Engagement score (30%)
    const avgSessionMinutes = metrics.averageSessionDuration / 60000;
    score += Math.min(avgSessionMinutes / 30, 1) * 30;

    return Math.round(score);
  }

  private generateChurnRecommendations(factors: string[]): string[] {
    const recommendations: string[] = [];

    if (factors.includes('Inactive for more than 7 days')) {
      recommendations.push('Send re-engagement email campaign');
      recommendations.push('Offer personalized project suggestions');
    }

    if (factors.includes('Short session durations')) {
      recommendations.push('Improve onboarding experience');
      recommendations.push('Add interactive tutorials');
    }

    if (factors.includes('Low project generation')) {
      recommendations.push('Provide project templates');
      recommendations.push('Offer guided project creation');
    }

    if (factors.includes('No collaboration activity')) {
      recommendations.push('Introduce to team features');
      recommendations.push('Create collaboration incentives');
    }

    return recommendations;
  }

  private getSessionCount(): number {
    return this.events.filter(e => 
      e.category === 'session' && e.action === 'start'
    ).length;
  }

  private getActiveSessions(): number {
    const now = new Date();
    const last30Minutes = new Date(now.getTime() - 30 * 60 * 1000);
    
    return new Set(
      this.events
        .filter(e => e.timestamp >= last30Minutes && e.sessionId)
        .map(e => e.sessionId)
    ).size;
  }

  private getAlerts(): AnalyticsDashboard['alerts'] {
    const alerts: AnalyticsDashboard['alerts'] = [];
    const realtimeMetrics = this.getRealtimeMetrics();

    if (realtimeMetrics.errorRate > 0.05) {
      alerts.push({
        id: uuidv4(),
        type: 'error',
        message: `High error rate detected: ${(realtimeMetrics.errorRate * 100).toFixed(1)}%`,
        timestamp: new Date()
      });
    }

    if (realtimeMetrics.averageResponseTime > 3000) {
      alerts.push({
        id: uuidv4(),
        type: 'warning',
        message: `Slow response times: ${realtimeMetrics.averageResponseTime.toFixed(0)}ms`,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  private convertToCSV(data: AnalyticsEvent[]): string {
    const headers = ['id', 'timestamp', 'userId', 'eventType', 'category', 'action', 'value', 'duration'];
    const rows = data.map(event => [
      event.id,
      event.timestamp.toISOString(),
      event.userId,
      event.eventType,
      event.category,
      event.action,
      event.value || '',
      event.duration || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private generateUserReport(): any {
    return {
      totalUsers: this.userMetrics.size,
      userMetrics: Array.from(this.userMetrics.values()),
      insights: this.analyzeUserBehavior()
    };
  }

  private generateTeamReport(): any {
    return {
      totalTeams: this.teamMetrics.size,
      teamMetrics: Array.from(this.teamMetrics.values()),
      insights: this.analyzeCollaboration()
    };
  }

  private generateSystemReport(): any {
    return {
      systemMetrics: this.getSystemMetrics(),
      insights: this.analyzePerformance()
    };
  }

  private generateBusinessReport(): any {
    return {
      businessMetrics: this.getBusinessMetrics(),
      insights: this.analyzeBusinessMetrics()
    };
  }

  private startPeriodicAnalysis(): void {
    // Generate insights every hour
    setInterval(() => {
      this.generateInsights();
    }, 60 * 60 * 1000);
  }

  private saveToStorage(): void {
    try {
      const data = {
        events: this.events.slice(-1000), // Keep only last 1000 events
        userMetrics: Array.from(this.userMetrics.entries()),
        teamMetrics: Array.from(this.teamMetrics.entries()),
        insights: this.insights,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save analytics data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        
        this.events = (parsed.events || []).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }));
        
        this.userMetrics = new Map(parsed.userMetrics || []);
        this.teamMetrics = new Map(parsed.teamMetrics || []);
        this.insights = (parsed.insights || []).map((i: any) => ({
          ...i,
          createdAt: new Date(i.createdAt)
        }));

        // Convert date strings back to Date objects
        this.userMetrics.forEach(metrics => {
          metrics.lastActive = new Date(metrics.lastActive);
        });
      }
    } catch (error) {
      console.warn('Failed to load analytics data:', error);
    }
  }

  // Public utility methods
  clearData(): void {
    this.events = [];
    this.userMetrics.clear();
    this.teamMetrics.clear();
    this.insights = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }

  getDataSize(): number {
    return this.events.length;
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();

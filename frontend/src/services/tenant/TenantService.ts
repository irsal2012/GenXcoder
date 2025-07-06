import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import jwt from 'jsonwebtoken';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  subdomain: string;
  plan: 'starter' | 'professional' | 'enterprise' | 'custom';
  status: 'active' | 'suspended' | 'trial' | 'expired';
  createdAt: Date;
  updatedAt: Date;
  settings: TenantSettings;
  limits: TenantLimits;
  billing: TenantBilling;
  customization: TenantCustomization;
  integrations: TenantIntegrations;
  compliance: TenantCompliance;
}

export interface TenantSettings {
  allowUserRegistration: boolean;
  requireEmailVerification: boolean;
  enableSSO: boolean;
  ssoProvider?: 'okta' | 'azure' | 'google' | 'custom';
  ssoConfig?: Record<string, any>;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // days
  };
  sessionTimeout: number; // minutes
  enableMFA: boolean;
  allowedDomains: string[];
  dataRetention: number; // days
  enableAuditLog: boolean;
  enableAPIAccess: boolean;
  webhookEndpoints: string[];
}

export interface TenantLimits {
  maxUsers: number;
  maxProjects: number;
  maxCollaborationSessions: number;
  maxStorageGB: number;
  maxAPICallsPerMonth: number;
  maxAIGenerationsPerMonth: number;
  maxVoiceMinutesPerMonth: number;
  enableAdvancedAnalytics: boolean;
  enableCustomAI: boolean;
  enableWhiteLabel: boolean;
  enablePrioritySupport: boolean;
}

export interface TenantBilling {
  plan: string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  nextBillingDate: Date;
  paymentMethod: {
    type: 'card' | 'bank' | 'invoice';
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
  invoices: TenantInvoice[];
  usage: TenantUsage;
}

export interface TenantInvoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'failed';
  dueDate: Date;
  paidDate?: Date;
  downloadUrl?: string;
}

export interface TenantUsage {
  users: number;
  projects: number;
  collaborationSessions: number;
  storageGB: number;
  apiCalls: number;
  aiGenerations: number;
  voiceMinutes: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface TenantCustomization {
  branding: {
    logo?: string;
    favicon?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    customCSS?: string;
  };
  ui: {
    showPoweredBy: boolean;
    customFooter?: string;
    customHeader?: string;
    hideDefaultNavigation: boolean;
    customDashboard?: string;
  };
  features: {
    enabledModules: string[];
    customModules: TenantCustomModule[];
    hiddenFeatures: string[];
  };
}

export interface TenantCustomModule {
  id: string;
  name: string;
  description: string;
  component: string;
  permissions: string[];
  config: Record<string, any>;
}

export interface TenantIntegrations {
  sso: {
    enabled: boolean;
    provider?: string;
    config?: Record<string, any>;
  };
  analytics: {
    googleAnalytics?: string;
    mixpanel?: string;
    amplitude?: string;
    custom?: Record<string, any>;
  };
  communication: {
    slack?: {
      webhookUrl: string;
      channels: string[];
    };
    teams?: {
      webhookUrl: string;
      channels: string[];
    };
    discord?: {
      webhookUrl: string;
      channels: string[];
    };
  };
  storage: {
    aws?: {
      accessKey: string;
      secretKey: string;
      bucket: string;
      region: string;
    };
    azure?: {
      connectionString: string;
      container: string;
    };
    gcp?: {
      projectId: string;
      keyFile: string;
      bucket: string;
    };
  };
  ai: {
    openai?: {
      apiKey: string;
      model: string;
      maxTokens: number;
    };
    anthropic?: {
      apiKey: string;
      model: string;
    };
    custom?: {
      endpoint: string;
      apiKey: string;
      model: string;
    };
  };
}

export interface TenantCompliance {
  gdpr: {
    enabled: boolean;
    dataProcessingAgreement: boolean;
    cookieConsent: boolean;
    rightToBeForgotten: boolean;
  };
  hipaa: {
    enabled: boolean;
    businessAssociateAgreement: boolean;
    encryptionAtRest: boolean;
    encryptionInTransit: boolean;
    auditLogging: boolean;
  };
  soc2: {
    enabled: boolean;
    type1: boolean;
    type2: boolean;
    reportUrl?: string;
  };
  iso27001: {
    enabled: boolean;
    certificateUrl?: string;
  };
  customCompliance: {
    name: string;
    requirements: string[];
    status: 'compliant' | 'non-compliant' | 'in-progress';
  }[];
}

export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'admin' | 'member' | 'viewer' | 'custom';
  permissions: string[];
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  profile: {
    avatar?: string;
    timezone: string;
    language: string;
    preferences: Record<string, any>;
  };
  mfa: {
    enabled: boolean;
    method?: 'totp' | 'sms' | 'email';
    backupCodes?: string[];
  };
}

export interface TenantSession {
  id: string;
  tenantId: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export class TenantService {
  private tenants: Map<string, Tenant> = new Map();
  private users: Map<string, TenantUser> = new Map();
  private sessions: Map<string, TenantSession> = new Map();
  private currentTenant: Tenant | null = null;
  private currentUser: TenantUser | null = null;
  private currentSession: TenantSession | null = null;
  private readonly STORAGE_KEY = 'genxcoder-tenant';
  private readonly SECRET_KEY = 'genxcoder-secret-key-2024';

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultTenant();
  }

  // Tenant Management
  async createTenant(
    name: string,
    domain: string,
    plan: Tenant['plan'] = 'starter',
    ownerEmail: string,
    ownerName: string
  ): Promise<Tenant> {
    const tenantId = uuidv4();
    const subdomain = domain.toLowerCase().replace(/[^a-z0-9]/g, '');

    const tenant: Tenant = {
      id: tenantId,
      name,
      domain,
      subdomain,
      plan,
      status: 'trial',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: this.getDefaultSettings(),
      limits: this.getPlanLimits(plan),
      billing: this.getDefaultBilling(plan),
      customization: this.getDefaultCustomization(),
      integrations: this.getDefaultIntegrations(),
      compliance: this.getDefaultCompliance()
    };

    this.tenants.set(tenantId, tenant);

    // Create owner user
    const owner = await this.createUser(
      tenantId,
      ownerEmail,
      ownerName.split(' ')[0] || 'Owner',
      ownerName.split(' ')[1] || '',
      'owner'
    );

    this.saveToStorage();
    return tenant;
  }

  async getTenant(tenantId: string): Promise<Tenant | null> {
    return this.tenants.get(tenantId) || null;
  }

  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    for (const tenant of this.tenants.values()) {
      if (tenant.domain === domain || tenant.subdomain === domain) {
        return tenant;
      }
    }
    return null;
  }

  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant | null> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return null;

    const updatedTenant = {
      ...tenant,
      ...updates,
      updatedAt: new Date()
    };

    this.tenants.set(tenantId, updatedTenant);
    this.saveToStorage();
    return updatedTenant;
  }

  async deleteTenant(tenantId: string): Promise<boolean> {
    const deleted = this.tenants.delete(tenantId);
    
    // Delete all users for this tenant
    for (const [userId, user] of this.users.entries()) {
      if (user.tenantId === tenantId) {
        this.users.delete(userId);
      }
    }

    // Delete all sessions for this tenant
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.tenantId === tenantId) {
        this.sessions.delete(sessionId);
      }
    }

    this.saveToStorage();
    return deleted;
  }

  // User Management
  async createUser(
    tenantId: string,
    email: string,
    firstName: string,
    lastName: string,
    role: TenantUser['role'] = 'member',
    permissions: string[] = []
  ): Promise<TenantUser> {
    const userId = uuidv4();
    
    const user: TenantUser = {
      id: userId,
      tenantId,
      email,
      firstName,
      lastName,
      role,
      permissions: permissions.length > 0 ? permissions : this.getRolePermissions(role),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        timezone: 'UTC',
        language: 'en',
        preferences: {}
      },
      mfa: {
        enabled: false
      }
    };

    this.users.set(userId, user);
    this.saveToStorage();
    return user;
  }

  async getUser(userId: string): Promise<TenantUser | null> {
    return this.users.get(userId) || null;
  }

  async getUserByEmail(tenantId: string, email: string): Promise<TenantUser | null> {
    for (const user of this.users.values()) {
      if (user.tenantId === tenantId && user.email === email) {
        return user;
      }
    }
    return null;
  }

  async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    return Array.from(this.users.values()).filter(user => user.tenantId === tenantId);
  }

  async updateUser(userId: string, updates: Partial<TenantUser>): Promise<TenantUser | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };

    this.users.set(userId, updatedUser);
    this.saveToStorage();
    return updatedUser;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const deleted = this.users.delete(userId);
    
    // Delete all sessions for this user
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }

    this.saveToStorage();
    return deleted;
  }

  // Authentication & Sessions
  async authenticate(
    tenantId: string,
    email: string,
    password: string
  ): Promise<{ user: TenantUser; session: TenantSession; token: string } | null> {
    const user = await this.getUserByEmail(tenantId, email);
    if (!user || user.status !== 'active') {
      return null;
    }

    // In a real implementation, you would verify the password hash
    // For demo purposes, we'll skip password verification

    const session = await this.createSession(tenantId, user.id);
    const token = this.generateToken(user, session);

    return { user, session, token };
  }

  async createSession(tenantId: string, userId: string): Promise<TenantSession> {
    const sessionId = uuidv4();
    const token = uuidv4();
    const refreshToken = uuidv4();

    const session: TenantSession = {
      id: sessionId,
      tenantId,
      userId,
      token,
      refreshToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date(),
      ipAddress: '127.0.0.1', // Mock IP
      userAgent: navigator.userAgent,
      isActive: true
    };

    this.sessions.set(sessionId, session);
    this.saveToStorage();
    return session;
  }

  async validateSession(token: string): Promise<{ user: TenantUser; session: TenantSession } | null> {
    for (const session of this.sessions.values()) {
      if (session.token === token && session.isActive && session.expiresAt > new Date()) {
        const user = await this.getUser(session.userId);
        if (user) {
          return { user, session };
        }
      }
    }
    return null;
  }

  async refreshSession(refreshToken: string): Promise<TenantSession | null> {
    for (const session of this.sessions.values()) {
      if (session.refreshToken === refreshToken && session.isActive) {
        session.token = uuidv4();
        session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        this.sessions.set(session.id, session);
        this.saveToStorage();
        return session;
      }
    }
    return null;
  }

  async revokeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.set(sessionId, session);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Current Context
  setCurrentTenant(tenant: Tenant): void {
    this.currentTenant = tenant;
  }

  getCurrentTenant(): Tenant | null {
    return this.currentTenant;
  }

  setCurrentUser(user: TenantUser): void {
    this.currentUser = user;
  }

  getCurrentUser(): TenantUser | null {
    return this.currentUser;
  }

  setCurrentSession(session: TenantSession): void {
    this.currentSession = session;
  }

  getCurrentSession(): TenantSession | null {
    return this.currentSession;
  }

  // Permissions & Authorization
  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.permissions.includes(permission) || 
           this.currentUser.permissions.includes('*');
  }

  hasRole(role: TenantUser['role']): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.role === role;
  }

  canAccessFeature(feature: string): boolean {
    if (!this.currentTenant) return false;
    
    const limits = this.currentTenant.limits;
    const customization = this.currentTenant.customization;

    // Check if feature is enabled for this tenant
    if (customization.features.hiddenFeatures.includes(feature)) {
      return false;
    }

    // Check plan-based feature access
    switch (feature) {
      case 'advanced_analytics':
        return limits.enableAdvancedAnalytics;
      case 'custom_ai':
        return limits.enableCustomAI;
      case 'white_label':
        return limits.enableWhiteLabel;
      case 'priority_support':
        return limits.enablePrioritySupport;
      default:
        return true;
    }
  }

  // Usage Tracking
  async trackUsage(
    tenantId: string,
    metric: keyof TenantUsage,
    amount: number = 1
  ): Promise<void> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) return;

    const currentUsage = tenant.billing.usage;
    
    switch (metric) {
      case 'users':
        currentUsage.users = Math.max(currentUsage.users, amount);
        break;
      case 'projects':
        currentUsage.projects = Math.max(currentUsage.projects, amount);
        break;
      default:
        (currentUsage as any)[metric] += amount;
    }

    await this.updateTenant(tenantId, { billing: tenant.billing });
  }

  async checkUsageLimit(
    tenantId: string,
    metric: keyof TenantLimits
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      return { allowed: false, current: 0, limit: 0 };
    }

    const limits = tenant.limits;
    const usage = tenant.billing.usage;

    let current = 0;
    let limit = 0;

    switch (metric) {
      case 'maxUsers':
        current = usage.users;
        limit = limits.maxUsers;
        break;
      case 'maxProjects':
        current = usage.projects;
        limit = limits.maxProjects;
        break;
      case 'maxStorageGB':
        current = usage.storageGB;
        limit = limits.maxStorageGB;
        break;
      case 'maxAPICallsPerMonth':
        current = usage.apiCalls;
        limit = limits.maxAPICallsPerMonth;
        break;
      case 'maxAIGenerationsPerMonth':
        current = usage.aiGenerations;
        limit = limits.maxAIGenerationsPerMonth;
        break;
      case 'maxVoiceMinutesPerMonth':
        current = usage.voiceMinutes;
        limit = limits.maxVoiceMinutesPerMonth;
        break;
      default:
        return { allowed: true, current: 0, limit: -1 };
    }

    return {
      allowed: current < limit,
      current,
      limit
    };
  }

  // Utility Methods
  private generateToken(user: TenantUser, session: TenantSession): string {
    const payload = {
      userId: user.id,
      tenantId: user.tenantId,
      sessionId: session.id,
      role: user.role,
      permissions: user.permissions,
      exp: Math.floor(session.expiresAt.getTime() / 1000)
    };

    return jwt.sign(payload, this.SECRET_KEY);
  }

  private getDefaultSettings(): TenantSettings {
    return {
      allowUserRegistration: true,
      requireEmailVerification: true,
      enableSSO: false,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        maxAge: 90
      },
      sessionTimeout: 480, // 8 hours
      enableMFA: false,
      allowedDomains: [],
      dataRetention: 365,
      enableAuditLog: true,
      enableAPIAccess: true,
      webhookEndpoints: []
    };
  }

  private getPlanLimits(plan: Tenant['plan']): TenantLimits {
    switch (plan) {
      case 'starter':
        return {
          maxUsers: 5,
          maxProjects: 10,
          maxCollaborationSessions: 2,
          maxStorageGB: 1,
          maxAPICallsPerMonth: 1000,
          maxAIGenerationsPerMonth: 100,
          maxVoiceMinutesPerMonth: 60,
          enableAdvancedAnalytics: false,
          enableCustomAI: false,
          enableWhiteLabel: false,
          enablePrioritySupport: false
        };
      case 'professional':
        return {
          maxUsers: 25,
          maxProjects: 100,
          maxCollaborationSessions: 10,
          maxStorageGB: 10,
          maxAPICallsPerMonth: 10000,
          maxAIGenerationsPerMonth: 1000,
          maxVoiceMinutesPerMonth: 300,
          enableAdvancedAnalytics: true,
          enableCustomAI: false,
          enableWhiteLabel: false,
          enablePrioritySupport: true
        };
      case 'enterprise':
        return {
          maxUsers: 500,
          maxProjects: 1000,
          maxCollaborationSessions: 100,
          maxStorageGB: 100,
          maxAPICallsPerMonth: 100000,
          maxAIGenerationsPerMonth: 10000,
          maxVoiceMinutesPerMonth: 1500,
          enableAdvancedAnalytics: true,
          enableCustomAI: true,
          enableWhiteLabel: true,
          enablePrioritySupport: true
        };
      case 'custom':
        return {
          maxUsers: -1, // Unlimited
          maxProjects: -1,
          maxCollaborationSessions: -1,
          maxStorageGB: -1,
          maxAPICallsPerMonth: -1,
          maxAIGenerationsPerMonth: -1,
          maxVoiceMinutesPerMonth: -1,
          enableAdvancedAnalytics: true,
          enableCustomAI: true,
          enableWhiteLabel: true,
          enablePrioritySupport: true
        };
      default:
        return this.getPlanLimits('starter');
    }
  }

  private getDefaultBilling(plan: Tenant['plan']): TenantBilling {
    const planPricing = {
      starter: 29,
      professional: 99,
      enterprise: 299,
      custom: 999
    };

    return {
      plan,
      billingCycle: 'monthly',
      amount: planPricing[plan],
      currency: 'USD',
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentMethod: {
        type: 'card'
      },
      invoices: [],
      usage: {
        users: 0,
        projects: 0,
        collaborationSessions: 0,
        storageGB: 0,
        apiCalls: 0,
        aiGenerations: 0,
        voiceMinutes: 0,
        period: {
          start: new Date(),
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }
    };
  }

  private getDefaultCustomization(): TenantCustomization {
    return {
      branding: {
        primaryColor: '#3B82F6',
        secondaryColor: '#6B7280',
        accentColor: '#10B981',
        fontFamily: 'Inter, sans-serif'
      },
      ui: {
        showPoweredBy: true,
        hideDefaultNavigation: false
      },
      features: {
        enabledModules: ['code-generation', 'collaboration', 'analytics'],
        customModules: [],
        hiddenFeatures: []
      }
    };
  }

  private getDefaultIntegrations(): TenantIntegrations {
    return {
      sso: {
        enabled: false
      },
      analytics: {},
      communication: {},
      storage: {},
      ai: {}
    };
  }

  private getDefaultCompliance(): TenantCompliance {
    return {
      gdpr: {
        enabled: false,
        dataProcessingAgreement: false,
        cookieConsent: false,
        rightToBeForgotten: false
      },
      hipaa: {
        enabled: false,
        businessAssociateAgreement: false,
        encryptionAtRest: false,
        encryptionInTransit: false,
        auditLogging: false
      },
      soc2: {
        enabled: false,
        type1: false,
        type2: false
      },
      iso27001: {
        enabled: false
      },
      customCompliance: []
    };
  }

  private getRolePermissions(role: TenantUser['role']): string[] {
    switch (role) {
      case 'owner':
        return ['*']; // All permissions
      case 'admin':
        return [
          'users.read', 'users.write', 'users.delete',
          'projects.read', 'projects.write', 'projects.delete',
          'collaboration.read', 'collaboration.write',
          'analytics.read', 'settings.read', 'settings.write'
        ];
      case 'member':
        return [
          'projects.read', 'projects.write',
          'collaboration.read', 'collaboration.write',
          'analytics.read'
        ];
      case 'viewer':
        return [
          'projects.read', 'collaboration.read', 'analytics.read'
        ];
      case 'custom':
        return [];
      default:
        return [];
    }
  }

  private initializeDefaultTenant(): void {
    if (this.tenants.size === 0) {
      // Create a default demo tenant
      this.createTenant(
        'Demo Organization',
        'demo.genxcoder.com',
        'enterprise',
        'admin@demo.genxcoder.com',
        'Demo Admin'
      );
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        tenants: Array.from(this.tenants.entries()),
        users: Array.from(this.users.entries()),
        sessions: Array.from(this.sessions.entries()),
        lastUpdated: new Date().toISOString()
      };

      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        this.SECRET_KEY
      ).toString();

      localStorage.setItem(this.STORAGE_KEY, encrypted);
    } catch (error) {
      console.warn('Failed to save tenant data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const encrypted = localStorage.getItem(this.STORAGE_KEY);
      if (encrypted) {
        const decrypted = CryptoJS.AES.decrypt(encrypted, this.SECRET_KEY);
        const data = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));

        this.tenants = new Map(data.tenants || []);
        this.users = new Map(data.users || []);
        this.sessions = new Map(data.sessions || []);

        // Convert date strings back to Date objects
        this.tenants.forEach(tenant => {
          tenant.createdAt = new Date(tenant.createdAt);
          tenant.updatedAt = new Date(tenant.updatedAt);
          tenant.billing.nextBillingDate = new Date(tenant.billing.nextBillingDate);
          tenant.billing.usage.period.start = new Date(tenant.billing.usage.period.start);
          tenant.billing.usage.period.end = new Date(tenant.billing.usage.period.end);
          tenant.billing.invoices.forEach(invoice => {
            invoice.dueDate = new Date(invoice.dueDate);
            if (invoice.paidDate) {
              invoice.paidDate = new Date(invoice.paidDate);
            }
          });
        });

        this.users.forEach(user => {
          user.createdAt = new Date(user.createdAt);
          user.updatedAt = new Date(user.updatedAt);
          if (user.lastLogin) {
            user.lastLogin = new Date(user.lastLogin);
          }
        });

        this.sessions.forEach(session => {
          session.expiresAt = new Date(session.expiresAt);
          session.createdAt = new Date(session.createdAt);
        });
      }
    } catch (error) {
      console.warn('Failed to load tenant data:', error);
    }
  }

  // Public utility methods
  getAllTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  clearAllData(): void {
    this.tenants.clear();
    this.users.clear();
    this.sessions.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// Singleton instance
export const tenantService = new TenantService();

import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  type: 'authentication' | 'authorization' | 'encryption' | 'audit' | 'compliance';
  rules: SecurityRule[];
  isActive: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityRule {
  id: string;
  name: string;
  condition: string;
  action: 'allow' | 'deny' | 'log' | 'alert' | 'quarantine';
  parameters: Record<string, any>;
  isEnabled: boolean;
}

export interface SecurityThreat {
  id: string;
  type: 'malware' | 'phishing' | 'ddos' | 'injection' | 'xss' | 'csrf' | 'brute_force' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  description: string;
  status: 'detected' | 'investigating' | 'mitigated' | 'resolved' | 'false_positive';
  detectedAt: Date;
  resolvedAt?: Date;
  mitigation: string[];
  evidence: SecurityEvidence[];
}

export interface SecurityEvidence {
  id: string;
  type: 'log' | 'network_traffic' | 'file_hash' | 'behavior_pattern' | 'signature';
  data: any;
  timestamp: Date;
  source: string;
}

export interface SecurityAudit {
  id: string;
  type: 'access' | 'data_modification' | 'system_change' | 'policy_violation' | 'compliance_check';
  userId: string;
  action: string;
  resource: string;
  result: 'success' | 'failure' | 'blocked';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
}

export interface EncryptionKey {
  id: string;
  name: string;
  algorithm: 'AES-256' | 'RSA-2048' | 'RSA-4096' | 'ECC-P256' | 'ChaCha20';
  keySize: number;
  purpose: 'data_encryption' | 'key_exchange' | 'digital_signature' | 'authentication';
  status: 'active' | 'expired' | 'revoked' | 'compromised';
  createdAt: Date;
  expiresAt: Date;
  usageCount: number;
  maxUsage?: number;
}

export interface SecurityCompliance {
  id: string;
  framework: 'SOC2' | 'ISO27001' | 'GDPR' | 'HIPAA' | 'PCI-DSS' | 'NIST' | 'CIS';
  status: 'compliant' | 'non_compliant' | 'partial' | 'under_review';
  score: number;
  requirements: ComplianceRequirement[];
  lastAssessment: Date;
  nextAssessment: Date;
  assessor: string;
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  status: 'met' | 'not_met' | 'partial' | 'not_applicable';
  evidence: string[];
  remediation?: string;
  dueDate?: Date;
}

export interface SecurityMetrics {
  threatsDetected: number;
  threatsBlocked: number;
  vulnerabilitiesFound: number;
  vulnerabilitiesFixed: number;
  complianceScore: number;
  securityScore: number;
  incidentResponseTime: number;
  falsePositiveRate: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface VulnerabilityAssessment {
  id: string;
  type: 'automated' | 'manual' | 'penetration_test' | 'code_review';
  target: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  vulnerabilities: Vulnerability[];
  startedAt: Date;
  completedAt?: Date;
  scanner: string;
  configuration: Record<string, any>;
}

export interface Vulnerability {
  id: string;
  cve?: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cvssScore: number;
  category: string;
  location: string;
  remediation: string;
  status: 'open' | 'in_progress' | 'fixed' | 'accepted_risk' | 'false_positive';
  discoveredAt: Date;
  fixedAt?: Date;
}

export class SecurityService {
  private policies: Map<string, SecurityPolicy> = new Map();
  private threats: Map<string, SecurityThreat> = new Map();
  private audits: Map<string, SecurityAudit> = new Map();
  private encryptionKeys: Map<string, EncryptionKey> = new Map();
  private compliance: Map<string, SecurityCompliance> = new Map();
  private vulnerabilityAssessments: Map<string, VulnerabilityAssessment> = new Map();
  private readonly STORAGE_KEY = 'genxcoder-security';
  private readonly JWT_SECRET = 'genxcoder-jwt-secret-key';

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultPolicies();
    this.startSecurityMonitoring();
  }

  // Security Policy Management
  async createSecurityPolicy(policyData: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityPolicy> {
    const policyId = uuidv4();
    const policy: SecurityPolicy = {
      ...policyData,
      id: policyId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.policies.set(policyId, policy);
    this.saveToStorage();
    return policy;
  }

  async updateSecurityPolicy(policyId: string, updates: Partial<SecurityPolicy>): Promise<SecurityPolicy | null> {
    const policy = this.policies.get(policyId);
    if (!policy) return null;

    const updatedPolicy = {
      ...policy,
      ...updates,
      updatedAt: new Date()
    };

    this.policies.set(policyId, updatedPolicy);
    this.saveToStorage();
    return updatedPolicy;
  }

  async getSecurityPolicies(): Promise<SecurityPolicy[]> {
    return Array.from(this.policies.values());
  }

  async getSecurityPolicy(policyId: string): Promise<SecurityPolicy | null> {
    return this.policies.get(policyId) || null;
  }

  // Threat Detection and Management
  async detectThreat(threatData: Omit<SecurityThreat, 'id' | 'detectedAt' | 'evidence'>): Promise<SecurityThreat> {
    const threatId = uuidv4();
    const threat: SecurityThreat = {
      ...threatData,
      id: threatId,
      detectedAt: new Date(),
      evidence: []
    };

    this.threats.set(threatId, threat);
    
    // Auto-generate evidence
    await this.generateThreatEvidence(threatId);
    
    // Log security audit
    await this.logSecurityAudit({
      type: 'policy_violation',
      userId: 'system',
      action: 'threat_detected',
      resource: threat.target,
      result: 'success',
      ipAddress: threat.source,
      userAgent: 'SecurityService',
      metadata: { threatType: threat.type, severity: threat.severity }
    });

    this.saveToStorage();
    return threat;
  }

  async mitigateThreat(threatId: string, mitigation: string[]): Promise<boolean> {
    const threat = this.threats.get(threatId);
    if (!threat) return false;

    threat.mitigation = mitigation;
    threat.status = 'mitigated';
    this.threats.set(threatId, threat);

    await this.logSecurityAudit({
      type: 'system_change',
      userId: 'admin',
      action: 'threat_mitigated',
      resource: threat.target,
      result: 'success',
      ipAddress: '127.0.0.1',
      userAgent: 'SecurityService',
      metadata: { threatId, mitigation }
    });

    this.saveToStorage();
    return true;
  }

  async getThreats(): Promise<SecurityThreat[]> {
    return Array.from(this.threats.values());
  }

  async getThreatsByStatus(status: SecurityThreat['status']): Promise<SecurityThreat[]> {
    return Array.from(this.threats.values()).filter(threat => threat.status === status);
  }

  // Encryption and Key Management
  async generateEncryptionKey(keyData: Omit<EncryptionKey, 'id' | 'createdAt' | 'usageCount'>): Promise<EncryptionKey> {
    const keyId = uuidv4();
    const key: EncryptionKey = {
      ...keyData,
      id: keyId,
      createdAt: new Date(),
      usageCount: 0
    };

    this.encryptionKeys.set(keyId, key);
    this.saveToStorage();
    return key;
  }

  async encryptData(data: string, keyId: string): Promise<string> {
    const key = this.encryptionKeys.get(keyId);
    if (!key || key.status !== 'active') {
      throw new Error('Invalid or inactive encryption key');
    }

    // Increment usage count
    key.usageCount++;
    if (key.maxUsage && key.usageCount >= key.maxUsage) {
      key.status = 'expired';
    }
    this.encryptionKeys.set(keyId, key);

    // Encrypt data using AES
    const encrypted = CryptoJS.AES.encrypt(data, keyId).toString();
    
    await this.logSecurityAudit({
      type: 'data_modification',
      userId: 'system',
      action: 'data_encrypted',
      resource: 'data',
      result: 'success',
      ipAddress: '127.0.0.1',
      userAgent: 'SecurityService',
      metadata: { keyId, algorithm: key.algorithm }
    });

    this.saveToStorage();
    return encrypted;
  }

  async decryptData(encryptedData: string, keyId: string): Promise<string> {
    const key = this.encryptionKeys.get(keyId);
    if (!key || key.status !== 'active') {
      throw new Error('Invalid or inactive encryption key');
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, keyId).toString(CryptoJS.enc.Utf8);
      
      await this.logSecurityAudit({
        type: 'access',
        userId: 'system',
        action: 'data_decrypted',
        resource: 'data',
        result: 'success',
        ipAddress: '127.0.0.1',
        userAgent: 'SecurityService',
        metadata: { keyId, algorithm: key.algorithm }
      });

      return decrypted;
    } catch (error) {
      await this.logSecurityAudit({
        type: 'access',
        userId: 'system',
        action: 'data_decryption_failed',
        resource: 'data',
        result: 'failure',
        ipAddress: '127.0.0.1',
        userAgent: 'SecurityService',
        metadata: { keyId, error: (error as Error).message }
      });

      throw new Error('Decryption failed');
    }
  }

  async getEncryptionKeys(): Promise<EncryptionKey[]> {
    return Array.from(this.encryptionKeys.values());
  }

  // Authentication and Authorization
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateJWT(payload: any, expiresIn: string = '24h'): Promise<string> {
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn } as any);
  }

  async verifyJWT(token: string): Promise<any> {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Audit Logging
  async logSecurityAudit(auditData: Omit<SecurityAudit, 'id' | 'timestamp'>): Promise<SecurityAudit> {
    const auditId = uuidv4();
    const audit: SecurityAudit = {
      ...auditData,
      id: auditId,
      timestamp: new Date()
    };

    this.audits.set(auditId, audit);
    this.saveToStorage();
    return audit;
  }

  async getSecurityAudits(limit?: number): Promise<SecurityAudit[]> {
    const audits = Array.from(this.audits.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? audits.slice(0, limit) : audits;
  }

  async getAuditsByUser(userId: string): Promise<SecurityAudit[]> {
    return Array.from(this.audits.values()).filter(audit => audit.userId === userId);
  }

  // Compliance Management
  async createComplianceFramework(complianceData: Omit<SecurityCompliance, 'id'>): Promise<SecurityCompliance> {
    const complianceId = uuidv4();
    const compliance: SecurityCompliance = {
      ...complianceData,
      id: complianceId
    };

    this.compliance.set(complianceId, compliance);
    this.saveToStorage();
    return compliance;
  }

  async updateComplianceStatus(complianceId: string, status: SecurityCompliance['status'], score: number): Promise<boolean> {
    const compliance = this.compliance.get(complianceId);
    if (!compliance) return false;

    compliance.status = status;
    compliance.score = score;
    compliance.lastAssessment = new Date();
    this.compliance.set(complianceId, compliance);
    this.saveToStorage();
    return true;
  }

  async getComplianceFrameworks(): Promise<SecurityCompliance[]> {
    return Array.from(this.compliance.values());
  }

  // Vulnerability Assessment
  async startVulnerabilityAssessment(assessmentData: Omit<VulnerabilityAssessment, 'id' | 'startedAt' | 'vulnerabilities'>): Promise<VulnerabilityAssessment> {
    const assessmentId = uuidv4();
    const assessment: VulnerabilityAssessment = {
      ...assessmentData,
      id: assessmentId,
      startedAt: new Date(),
      vulnerabilities: []
    };

    this.vulnerabilityAssessments.set(assessmentId, assessment);
    
    // Simulate vulnerability scanning
    setTimeout(async () => {
      await this.completeVulnerabilityAssessment(assessmentId);
    }, 5000 + Math.random() * 10000);

    this.saveToStorage();
    return assessment;
  }

  private async completeVulnerabilityAssessment(assessmentId: string): Promise<void> {
    const assessment = this.vulnerabilityAssessments.get(assessmentId);
    if (!assessment) return;

    // Generate mock vulnerabilities
    const mockVulnerabilities: Vulnerability[] = [
      {
        id: uuidv4(),
        cve: 'CVE-2023-1234',
        title: 'SQL Injection Vulnerability',
        description: 'Potential SQL injection in user input validation',
        severity: 'high',
        cvssScore: 8.1,
        category: 'Injection',
        location: '/api/users',
        remediation: 'Implement parameterized queries and input validation',
        status: 'open',
        discoveredAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Cross-Site Scripting (XSS)',
        description: 'Reflected XSS vulnerability in search functionality',
        severity: 'medium',
        cvssScore: 6.1,
        category: 'XSS',
        location: '/search',
        remediation: 'Implement proper output encoding and CSP headers',
        status: 'open',
        discoveredAt: new Date()
      }
    ];

    assessment.vulnerabilities = mockVulnerabilities;
    assessment.status = 'completed';
    assessment.completedAt = new Date();
    
    this.vulnerabilityAssessments.set(assessmentId, assessment);
    this.saveToStorage();
  }

  async getVulnerabilityAssessments(): Promise<VulnerabilityAssessment[]> {
    return Array.from(this.vulnerabilityAssessments.values());
  }

  // Security Metrics and Analytics
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    const threats = Array.from(this.threats.values());
    const assessments = Array.from(this.vulnerabilityAssessments.values());
    const compliance = Array.from(this.compliance.values());

    const threatsDetected = threats.length;
    const threatsBlocked = threats.filter(t => t.status === 'mitigated' || t.status === 'resolved').length;
    
    const vulnerabilities = assessments.flatMap(a => a.vulnerabilities);
    const vulnerabilitiesFound = vulnerabilities.length;
    const vulnerabilitiesFixed = vulnerabilities.filter(v => v.status === 'fixed').length;

    const avgComplianceScore = compliance.length > 0 
      ? compliance.reduce((sum, c) => sum + c.score, 0) / compliance.length 
      : 0;

    const criticalThreats = threats.filter(t => t.severity === 'critical').length;
    const highThreats = threats.filter(t => t.severity === 'high').length;
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (criticalThreats > 0) riskLevel = 'critical';
    else if (highThreats > 2) riskLevel = 'high';
    else if (highThreats > 0 || threats.length > 5) riskLevel = 'medium';

    return {
      threatsDetected,
      threatsBlocked,
      vulnerabilitiesFound,
      vulnerabilitiesFixed,
      complianceScore: Math.round(avgComplianceScore),
      securityScore: Math.round((threatsBlocked / Math.max(threatsDetected, 1)) * 100),
      incidentResponseTime: Math.round(Math.random() * 60) + 15, // Mock response time in minutes
      falsePositiveRate: Math.round(Math.random() * 10) + 2, // Mock false positive rate
      riskLevel
    };
  }

  // Private utility methods
  private async generateThreatEvidence(threatId: string): Promise<void> {
    const threat = this.threats.get(threatId);
    if (!threat) return;

    const evidence: SecurityEvidence[] = [
      {
        id: uuidv4(),
        type: 'log',
        data: {
          message: `Suspicious activity detected from ${threat.source}`,
          level: 'warning',
          component: 'security_monitor'
        },
        timestamp: new Date(),
        source: 'security_log'
      },
      {
        id: uuidv4(),
        type: 'network_traffic',
        data: {
          sourceIP: threat.source,
          destinationIP: threat.target,
          protocol: 'HTTP',
          requestCount: Math.floor(Math.random() * 1000) + 100,
          anomalyScore: Math.random() * 0.5 + 0.5
        },
        timestamp: new Date(),
        source: 'network_monitor'
      }
    ];

    threat.evidence = evidence;
    this.threats.set(threatId, threat);
  }

  private initializeDefaultPolicies(): void {
    if (this.policies.size > 0) return;

    const defaultPolicies: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Password Policy',
        description: 'Enforce strong password requirements',
        type: 'authentication',
        severity: 'high',
        isActive: true,
        rules: [
          {
            id: uuidv4(),
            name: 'Minimum Length',
            condition: 'password.length >= 8',
            action: 'deny',
            parameters: { minLength: 8 },
            isEnabled: true
          },
          {
            id: uuidv4(),
            name: 'Complexity Requirements',
            condition: 'password.hasUppercase && password.hasLowercase && password.hasNumbers',
            action: 'deny',
            parameters: { requireMixed: true },
            isEnabled: true
          }
        ]
      },
      {
        name: 'Access Control Policy',
        description: 'Control user access to resources',
        type: 'authorization',
        severity: 'critical',
        isActive: true,
        rules: [
          {
            id: uuidv4(),
            name: 'Admin Access',
            condition: 'user.role === "admin"',
            action: 'allow',
            parameters: { adminOnly: true },
            isEnabled: true
          },
          {
            id: uuidv4(),
            name: 'Rate Limiting',
            condition: 'requests.perMinute > 100',
            action: 'deny',
            parameters: { maxRequests: 100 },
            isEnabled: true
          }
        ]
      }
    ];

    defaultPolicies.forEach(async (policyData) => {
      await this.createSecurityPolicy(policyData);
    });
  }

  private startSecurityMonitoring(): void {
    // Simulate threat detection
    setInterval(async () => {
      if (Math.random() < 0.1) { // 10% chance of detecting a threat
        const threatTypes = ['malware', 'phishing', 'ddos', 'injection', 'xss', 'brute_force'] as const;
        const severities = ['low', 'medium', 'high', 'critical'] as const;
        
        await this.detectThreat({
          type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          source: `192.168.1.${Math.floor(Math.random() * 255)}`,
          target: 'application_server',
          description: 'Automated threat detection',
          status: 'detected',
          mitigation: []
        });
      }
    }, 30000); // Check every 30 seconds
  }

  private saveToStorage(): void {
    try {
      const data = {
        policies: Array.from(this.policies.entries()),
        threats: Array.from(this.threats.entries()),
        audits: Array.from(this.audits.entries()),
        encryptionKeys: Array.from(this.encryptionKeys.entries()),
        compliance: Array.from(this.compliance.entries()),
        vulnerabilityAssessments: Array.from(this.vulnerabilityAssessments.entries()),
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save security data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        
        this.policies = new Map(parsed.policies || []);
        this.threats = new Map(parsed.threats || []);
        this.audits = new Map(parsed.audits || []);
        this.encryptionKeys = new Map(parsed.encryptionKeys || []);
        this.compliance = new Map(parsed.compliance || []);
        this.vulnerabilityAssessments = new Map(parsed.vulnerabilityAssessments || []);

        // Convert date strings back to Date objects
        this.policies.forEach(policy => {
          policy.createdAt = new Date(policy.createdAt);
          policy.updatedAt = new Date(policy.updatedAt);
        });

        this.threats.forEach(threat => {
          threat.detectedAt = new Date(threat.detectedAt);
          if (threat.resolvedAt) threat.resolvedAt = new Date(threat.resolvedAt);
          threat.evidence.forEach(evidence => {
            evidence.timestamp = new Date(evidence.timestamp);
          });
        });

        this.audits.forEach(audit => {
          audit.timestamp = new Date(audit.timestamp);
        });

        this.encryptionKeys.forEach(key => {
          key.createdAt = new Date(key.createdAt);
          key.expiresAt = new Date(key.expiresAt);
        });

        this.compliance.forEach(comp => {
          comp.lastAssessment = new Date(comp.lastAssessment);
          comp.nextAssessment = new Date(comp.nextAssessment);
          comp.requirements.forEach(req => {
            if (req.dueDate) req.dueDate = new Date(req.dueDate);
          });
        });

        this.vulnerabilityAssessments.forEach(assessment => {
          assessment.startedAt = new Date(assessment.startedAt);
          if (assessment.completedAt) assessment.completedAt = new Date(assessment.completedAt);
          assessment.vulnerabilities.forEach(vuln => {
            vuln.discoveredAt = new Date(vuln.discoveredAt);
            if (vuln.fixedAt) vuln.fixedAt = new Date(vuln.fixedAt);
          });
        });
      }
    } catch (error) {
      console.warn('Failed to load security data:', error);
    }
  }

  // Public utility methods
  clearAllData(): void {
    this.policies.clear();
    this.threats.clear();
    this.audits.clear();
    this.encryptionKeys.clear();
    this.compliance.clear();
    this.vulnerabilityAssessments.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    this.initializeDefaultPolicies();
  }
}

// Singleton instance
export const securityService = new SecurityService();

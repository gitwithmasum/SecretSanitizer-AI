export type SecretCategory =
  | 'api_credential'
  | 'auth_secret'
  | 'infrastructure_secret'
  | 'pii_business'
  | 'custom';

export type SecretSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SecretDetection {
  id: string;
  ruleId: string;
  category: SecretCategory;
  name: string;
  severity: SecretSeverity;
  confidence: number;
  value: string; // Active memory only, never stored in persistent audit logs
  maskedValue: string; // Safe representation (e.g., sk-proj-...34aB)
  start: number;
  end: number;
  line: number;
  column: number;
  replacement: string;
  explanation: string;
  remediation: string;
}

export interface DetectionRule {
  id: string;
  name: string;
  category: SecretCategory;
  severity: SecretSeverity;
  pattern: RegExp;
  placeholder: string;
  explanation: string;
  remediation: string;
  entropyThreshold?: number;
  minEntropy?: number;
  keywords?: string[];
  contextKeywords?: string[];
  validator?: (match: string, context?: string) => boolean;
}

export interface SanitizeResult {
  original: string;
  sanitized: string;
  detections: SecretDetection[];
  replacementMap: Array<{
    placeholder: string;
    detectionId: string;
    category: SecretCategory;
    ruleId: string;
  }>;
  stats: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export type ProtectionMode = 'automatic' | 'review' | 'warning' | 'disabled';
export type SensitivityLevel = 'low' | 'balanced' | 'aggressive';

export interface WebsiteProtectionConfig {
  domain: string;
  name: string;
  enabled: boolean;
  mode: ProtectionMode;
  selectorFallback: boolean;
  interceptionType: 'dom_submit' | 'keydown_enter' | 'paste' | 'all';
}

export interface SecurityEvent {
  id: string;
  timestamp: number;
  domain: string;
  category: SecretCategory;
  ruleId: string;
  severity: SecretSeverity;
  actionTaken: 'sanitized' | 'blocked' | 'bypassed' | 'warned';
  maskedSnippet: string; // Zero raw secret retention
}

export interface CustomRule {
  id: string;
  name: string;
  regex: string;
  category: SecretCategory;
  severity: SecretSeverity;
  placeholder: string;
  description: string;
  enabled: boolean;
  createdAt: number;
}

export interface EnterprisePolicy {
  version: string;
  organizationName: string;
  enforcedMode?: ProtectionMode;
  allowBypass: boolean;
  domainAllowlist: string[];
  domainBlocklist: string[];
  mandatoryCategories: SecretCategory[];
  complianceMode: 'SOC2' | 'ISO27001' | 'GDPR' | 'STANDARD';
  lastUpdated: number;
  adminSignature?: string;
}

export interface ExtensionSettings {
  masterEnabled: boolean;
  protectionMode: ProtectionMode;
  sensitivity: SensitivityLevel;
  detectPII: boolean;
  clipboardProtection: boolean;
  clipboardAutoSanitize: boolean;
  blockedDomains: string[];
  whitelistedDomains: string[];
  websiteConfigs: Record<string, WebsiteProtectionConfig>;
  theme: 'dark' | 'light' | 'system';
  onboardingCompleted: boolean;
}

export interface SystemMetrics {
  totalDetections: number;
  exposuresPrevented: number;
  totalSanitizations: number;
  securityScore: number;
  weeklyDetections: Array<{ day: string; count: number; prevented: number }>;
}

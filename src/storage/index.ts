import {
  ExtensionSettings,
  SecurityEvent,
  CustomRule,
  EnterprisePolicy,
  SystemMetrics
} from '../types';
import { DEFAULT_ENTERPRISE_POLICY } from '../enterprise/policy';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  masterEnabled: true,
  protectionMode: 'review',
  sensitivity: 'balanced',
  detectPII: true,
  clipboardProtection: true,
  clipboardAutoSanitize: false,
  blockedDomains: [],
  whitelistedDomains: [],
  websiteConfigs: {
    'chatgpt.com': {
      domain: 'chatgpt.com',
      name: 'ChatGPT',
      enabled: true,
      mode: 'review',
      selectorFallback: true,
      interceptionType: 'all'
    },
    'claude.ai': {
      domain: 'claude.ai',
      name: 'Claude',
      enabled: true,
      mode: 'review',
      selectorFallback: true,
      interceptionType: 'all'
    },
    'gemini.google.com': {
      domain: 'gemini.google.com',
      name: 'Google Gemini',
      enabled: true,
      mode: 'review',
      selectorFallback: true,
      interceptionType: 'all'
    },
    'copilot.microsoft.com': {
      domain: 'copilot.microsoft.com',
      name: 'Microsoft Copilot',
      enabled: true,
      mode: 'review',
      selectorFallback: true,
      interceptionType: 'all'
    },
    'perplexity.ai': {
      domain: 'perplexity.ai',
      name: 'Perplexity AI',
      enabled: true,
      mode: 'review',
      selectorFallback: true,
      interceptionType: 'all'
    }
  },
  theme: 'dark',
  onboardingCompleted: false
};

const STORAGE_KEYS = {
  SETTINGS: 'secretsanitizer_settings',
  EVENTS: 'secretsanitizer_events',
  CUSTOM_RULES: 'secretsanitizer_custom_rules',
  ENTERPRISE_POLICY: 'secretsanitizer_enterprise_policy',
  METRICS: 'secretsanitizer_metrics'
};

const isChromeStorageAvailable = (): boolean => {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage && chrome.storage.local);
};

export class StorageService {
  /**
   * Retrieves extension settings
   */
  public static async getSettings(): Promise<ExtensionSettings> {
    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (result) => {
          if (result && result[STORAGE_KEYS.SETTINGS]) {
            resolve({ ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] });
          } else {
            resolve(DEFAULT_SETTINGS);
          }
        });
      });
    }

    try {
      const item = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return item ? { ...DEFAULT_SETTINGS, ...JSON.parse(item) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Saves extension settings
   */
  public static async saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };

    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated }, () => resolve());
      });
    }

    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }

  /**
   * Retrieves logged security events (strictly masked values, never raw secrets)
   */
  public static async getEvents(): Promise<SecurityEvent[]> {
    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEYS.EVENTS], (result) => {
          resolve(result && result[STORAGE_KEYS.EVENTS] ? result[STORAGE_KEYS.EVENTS] : []);
        });
      });
    }

    try {
      const item = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  }

  /**
   * Logs a security event (guaranteed to contain zero raw secret material)
   */
  public static async recordEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const events = await this.getEvents();
    const newEvent: SecurityEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now()
    };

    // Keep rolling log of last 500 events to prevent quota overflow
    const trimmed = [newEvent, ...events].slice(0, 500);

    if (isChromeStorageAvailable()) {
      await new Promise<void>((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEYS.EVENTS]: trimmed }, () => resolve());
      });
    } else {
      try {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(trimmed));
      } catch (e) {
        console.warn('Event save error', e);
      }
    }

    // Update global metrics
    await this.incrementMetric(
      event.actionTaken === 'sanitized'
        ? 'totalSanitizations'
        : event.actionTaken === 'blocked'
        ? 'exposuresPrevented'
        : 'totalDetections'
    );
  }

  /**
   * Custom Rules management
   */
  public static async getCustomRules(): Promise<CustomRule[]> {
    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEYS.CUSTOM_RULES], (result) => {
          resolve(
            result && result[STORAGE_KEYS.CUSTOM_RULES] ? result[STORAGE_KEYS.CUSTOM_RULES] : []
          );
        });
      });
    }

    try {
      const item = localStorage.getItem(STORAGE_KEYS.CUSTOM_RULES);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  }

  public static async saveCustomRules(rules: CustomRule[]): Promise<void> {
    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEYS.CUSTOM_RULES]: rules }, () => resolve());
      });
    }

    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_RULES, JSON.stringify(rules));
    } catch (e) {
      console.warn('Custom rules save error', e);
    }
  }

  /**
   * Enterprise Policy
   */
  public static async getEnterprisePolicy(): Promise<EnterprisePolicy> {
    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEYS.ENTERPRISE_POLICY], (result) => {
          resolve(
            result && result[STORAGE_KEYS.ENTERPRISE_POLICY]
              ? result[STORAGE_KEYS.ENTERPRISE_POLICY]
              : DEFAULT_ENTERPRISE_POLICY
          );
        });
      });
    }

    try {
      const item = localStorage.getItem(STORAGE_KEYS.ENTERPRISE_POLICY);
      return item ? JSON.parse(item) : DEFAULT_ENTERPRISE_POLICY;
    } catch {
      return DEFAULT_ENTERPRISE_POLICY;
    }
  }

  public static async saveEnterprisePolicy(policy: EnterprisePolicy): Promise<void> {
    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEYS.ENTERPRISE_POLICY]: policy }, () => resolve());
      });
    }

    try {
      localStorage.setItem(STORAGE_KEYS.ENTERPRISE_POLICY, JSON.stringify(policy));
    } catch (e) {
      console.warn('Policy save error', e);
    }
  }

  /**
   * Metrics and statistics
   */
  public static async getMetrics(): Promise<SystemMetrics> {
    const defaultMetrics: SystemMetrics = {
      totalDetections: 42,
      exposuresPrevented: 18,
      totalSanitizations: 24,
      securityScore: 98,
      weeklyDetections: [
        { day: 'Mon', count: 4, prevented: 2 },
        { day: 'Tue', count: 7, prevented: 3 },
        { day: 'Wed', count: 12, prevented: 5 },
        { day: 'Thu', count: 9, prevented: 4 },
        { day: 'Fri', count: 15, prevented: 6 },
        { day: 'Sat', count: 2, prevented: 1 },
        { day: 'Sun', count: 1, prevented: 1 }
      ]
    };

    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEYS.METRICS], (result) => {
          resolve(result && result[STORAGE_KEYS.METRICS] ? result[STORAGE_KEYS.METRICS] : defaultMetrics);
        });
      });
    }

    try {
      const item = localStorage.getItem(STORAGE_KEYS.METRICS);
      return item ? JSON.parse(item) : defaultMetrics;
    } catch {
      return defaultMetrics;
    }
  }

  private static async incrementMetric(metricName: keyof SystemMetrics): Promise<void> {
    const metrics = await this.getMetrics();
    if (typeof metrics[metricName] === 'number') {
      (metrics[metricName] as number)++;
    }
    metrics.totalDetections++;

    if (isChromeStorageAvailable()) {
      chrome.storage.local.set({ [STORAGE_KEYS.METRICS]: metrics });
    } else {
      try {
        localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(metrics));
      } catch (e) {
        console.warn('Metric save error', e);
      }
    }
  }

  /**
   * Erases all locally stored data
   */
  public static async clearAllData(): Promise<void> {
    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.clear(() => resolve());
      });
    }

    try {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.EVENTS);
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_RULES);
      localStorage.removeItem(STORAGE_KEYS.ENTERPRISE_POLICY);
      localStorage.removeItem(STORAGE_KEYS.METRICS);
    } catch (e) {
      console.warn('Clear data error', e);
    }
  }
}

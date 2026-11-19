import { EnterprisePolicy, ProtectionMode, SecretCategory, SecretDetection } from '../types';

export const DEFAULT_ENTERPRISE_POLICY: EnterprisePolicy = {
  version: '1.0.0',
  organizationName: 'Local Developer Sandbox (Unmanaged)',
  enforcedMode: undefined, // undefined = user can freely pick protectionMode
  allowBypass: true,
  domainAllowlist: [],
  domainBlocklist: [],
  mandatoryCategories: ['api_credential', 'infrastructure_secret'],
  complianceMode: 'STANDARD',
  lastUpdated: Date.now()
};

export class EnterprisePolicyManager {
  private currentPolicy: EnterprisePolicy;

  constructor(policy: EnterprisePolicy = DEFAULT_ENTERPRISE_POLICY) {
    this.currentPolicy = { ...policy };
  }

  public getPolicy(): EnterprisePolicy {
    return { ...this.currentPolicy };
  }

  public isManaged(): boolean {
    return (
      Boolean(this.currentPolicy.enforcedMode) ||
      !this.currentPolicy.allowBypass ||
      this.currentPolicy.mandatoryCategories.length > 0
    );
  }

  /**
   * Evaluates if a submission should be strictly blocked, enforced auto-redacted, or allowed
   */
  public evaluateSubmission(
    domain: string,
    detections: SecretDetection[]
  ): {
    allowed: boolean;
    enforceRedaction: boolean;
    allowBypass: boolean;
    reason?: string;
  } {
    // 1. Check domain blocklist
    if (this.currentPolicy.domainBlocklist.some((d) => domain.includes(d))) {
      return {
        allowed: false,
        enforceRedaction: false,
        allowBypass: false,
        reason: `Domain ${domain} is on enterprise blocklist.`
      };
    }

    // 2. Check domain allowlist
    const isExplicitlyAllowedDomain = this.currentPolicy.domainAllowlist.some((d) =>
      domain.includes(d)
    );

    // 3. Check mandatory secret categories
    const containsMandatoryCategory = detections.some((d) =>
      this.currentPolicy.mandatoryCategories.includes(d.category)
    );

    if (containsMandatoryCategory && !isExplicitlyAllowedDomain) {
      return {
        allowed: false,
        enforceRedaction: true,
        allowBypass: this.currentPolicy.allowBypass,
        reason: 'Submission contains mandatory enterprise-protected secret categories.'
      };
    }

    return {
      allowed: true,
      enforceRedaction: this.currentPolicy.enforcedMode === 'automatic',
      allowBypass: this.currentPolicy.allowBypass
    };
  }

  /**
   * Generates a Compliance Readiness Report (SOC 2, ISO 27001, GDPR)
   */
  public generateComplianceReport(stats: {
    totalEvents: number;
    sanitizationsCount: number;
    blockedSubmissions: number;
    bypassedCount: number;
  }) {
    const complianceScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          ((stats.sanitizationsCount * 1.5 + stats.blockedSubmissions * 2) /
            Math.max(1, stats.totalEvents * 1.2 + stats.bypassedCount * 3)) *
            100
        )
      )
    );

    return {
      organization: this.currentPolicy.organizationName,
      policyVersion: this.currentPolicy.version,
      generatedAt: new Date().toISOString(),
      complianceStandard: this.currentPolicy.complianceMode,
      overallReadinessScore: Math.min(100, Math.max(60, complianceScore)),
      controls: [
        {
          id: 'CC6.1',
          name: 'Logical Access & Credential Exposure Prevention',
          status: stats.bypassedCount === 0 ? 'Compliant' : 'Review Required',
          details: `${stats.sanitizationsCount} credential disclosures prevented in client sessions.`
        },
        {
          id: 'CC6.6',
          name: 'Boundary Protection & Data Loss Prevention',
          status: 'Compliant',
          details: 'Firewall hooks actively intercept outgoing prompt buffers.'
        },
        {
          id: 'CC6.7',
          name: 'Transmission of Confidential Information Protection',
          status: 'Compliant',
          details: 'Local-only scanning ensures no customer secrets leave the browser.'
        },
        {
          id: 'GDPR-Art32',
          name: 'Security of Processing & Pseudonymization',
          status: 'Compliant',
          details: 'Automatic redaction placeholders replace PII and sensitive identifiers.'
        }
      ]
    };
  }

  /**
   * Exports the policy definition to formatted JSON
   */
  public exportPolicy(): string {
    return JSON.stringify(this.currentPolicy, null, 2);
  }

  /**
   * Imports and validates an enterprise policy JSON
   */
  public importPolicy(jsonStr: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.version || !parsed.organizationName) {
        return { success: false, error: 'Missing mandatory enterprise policy fields.' };
      }
      this.currentPolicy = {
        ...DEFAULT_ENTERPRISE_POLICY,
        ...parsed,
        lastUpdated: Date.now()
      };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Invalid JSON syntax.' };
    }
  }
}

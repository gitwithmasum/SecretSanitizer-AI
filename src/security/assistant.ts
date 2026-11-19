import { SecretDetection, SecretCategory } from '../types';

export interface SecurityAdvisory {
  ruleId: string;
  category: SecretCategory;
  title: string;
  threatLevel: string;
  blastRadius: string;
  impactDescription: string;
  attackVector: string;
  immediateActions: string[];
  longTermBestPractices: string[];
  safeArchitectureExample: string;
}

export class SecurityAIAssistant {
  private static advisoryKnowledgeBase: Record<string, Partial<SecurityAdvisory>> = {
    'openai-api-key': {
      title: 'OpenAI API Key Exposure Risk',
      threatLevel: 'Severe Financial & Data Exposure',
      blastRadius: 'Direct consumption of API credit quotas, fine-tuned models exfiltration, unauthorized prompt injection against org resources.',
      impactDescription: 'If leaked into an AI chat or public repo, automated credential scraping bots will capture this token within seconds, running thousands of costly inference requests under your billing account.',
      attackVector: 'Automated GitHub/Pastebin scrapers and unencrypted logging pipelines.',
      immediateActions: [
        'Navigate to OpenAI Platform Console (platform.openai.com/api-keys).',
        'Revoke the exposed key immediately.',
        'Review current billing and usage graphs for anomalous spikes.',
        'Create a new restricted-scope API key with spending limits.'
      ],
      longTermBestPractices: [
        'Store keys in `.env` files and add `.env*` to `.gitignore`.',
        'Use server-side proxy routes rather than embedding client-side API keys.',
        'Employ HashiCorp Vault, AWS Secrets Manager, or Doppler in production pipelines.'
      ],
      safeArchitectureExample: `// Bad:\nconst openai = new OpenAI({ apiKey: "sk-..." });\n\n// Safe:\nconst openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });`
    },
    'anthropic-api-key': {
      title: 'Anthropic Claude Key Compromise',
      threatLevel: 'Critical Inference & Quota Hijack',
      blastRadius: 'Unmetered Claude 3.5 Sonnet / Opus generation on your organization credit pool.',
      impactDescription: 'Attackers can deplete organization credits or query proprietary workspaces connected to the Claude API.',
      attackVector: 'Prompt scraping, public chat logs, browser extensions with excessive telemetry.',
      immediateActions: [
        'Open console.anthropic.com/settings/keys.',
        'Delete the exposed API key.',
        'Generate a replacement key and update CI/CD secrets.'
      ],
      longTermBestPractices: [
        'Use ephemeral access tokens where supported.',
        'Implement monthly budget caps on your Anthropic workspace.'
      ],
      safeArchitectureExample: `const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });`
    },
    'stripe-secret-key': {
      title: 'Stripe Live Secret Key Leakage',
      threatLevel: 'Critical Financial & PCI Compliance Hazard',
      blastRadius: 'Complete programmatic control over customer balances, refunds, payouts, and card data queries.',
      impactDescription: 'A live Stripe secret key (sk_live_...) gives root access to your Stripe account. Malicious actors can execute unauthorized refunds, drain payouts to rogue bank accounts, or query customer transaction histories.',
      attackVector: 'Automated financial scraper bots targeting developers during prompt debugging.',
      immediateActions: [
        'Access Stripe Dashboard > Developers > API Keys immediately.',
        'Roll the affected secret key with an expiration window.',
        'Check Stripe Radar and balance logs for anomalous refund spikes or payout alterations.'
      ],
      longTermBestPractices: [
        'Use Stripe Restricted Keys (rk_live_...) scoped strictly to minimum required endpoints.',
        'Never expose secret keys on frontend or client apps; use Stripe Elements with publishable keys (pk_live_...).'
      ],
      safeArchitectureExample: `// Frontend:\nconst stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);\n// Backend only:\nconst stripe = new Stripe(process.env.STRIPE_SECRET_KEY);`
    },
    'aws-access-key-id': {
      title: 'AWS IAM Credential Exposure',
      threatLevel: 'High to Critical Cloud Takeover',
      blastRadius: 'Varies by IAM policy: can range from S3 bucket exfiltration to cryptojacking EC2 clusters.',
      impactDescription: 'Compromised AWS credentials are automatically seized by bots to launch GPU-based crypto mining instances, resulting in tens of thousands of dollars in compute bills overnight.',
      attackVector: 'Rapid public scans via GitHub search, Discord chats, and LLM logs.',
      immediateActions: [
        'Log into AWS IAM Console.',
        'Deactivate the access key ID under the associated IAM User.',
        'Check AWS CloudTrail Event History for recent API calls from unrecognized IP addresses.',
        'Delete the key permanently once confirmed inactive.'
      ],
      longTermBestPractices: [
        'Use AWS IAM Roles for EC2/ECS/Lambda instead of static long-lived credentials.',
        'Enforce AWS Organizations Service Control Policies (SCPs) preventing root or admin keys.',
        'Enable AWS GuardDuty for instant compromise alarms.'
      ],
      safeArchitectureExample: `// Use AWS SDK default credential provider chain:\nimport { S3Client } from "@aws-sdk/client-s3";\nconst s3 = new S3Client({}); // Automatically reads AWS_ACCESS_KEY_ID from env/IAM role`
    },
    'postgres-conn-string': {
      title: 'Database Connection String Exposure',
      threatLevel: 'Critical Data Breach & Ransomware Risk',
      blastRadius: 'Complete database dumping, table dropping, and SQL injection.',
      impactDescription: 'Contains database credentials, user credentials, hostname, port, and database name. Direct exposure enables remote database access if the database port is internet-facing.',
      attackVector: 'Port scanners connecting directly to exposed 5432/3306 database endpoints.',
      immediateActions: [
        'Change the database user password immediately using ALTER USER username WITH PASSWORD.',
        'Inspect database active connections (pg_stat_activity).',
        'Verify database firewall/VPC rules to guarantee 5432 is not accessible from 0.0.0.0/0.'
      ],
      longTermBestPractices: [
        'Place databases inside private subnets behind a VPN or SSH bastion.',
        'Use IAM database authentication or connection poolers (PgBouncer, Supabase Pooler).'
      ],
      safeArchitectureExample: `// DATABASE_URL=postgres://app_user:\${DB_PASSWORD}@db.internal:5432/production\nconst pool = new Pool({ connectionString: process.env.DATABASE_URL });`
    },
    'github-pat': {
      title: 'GitHub Personal Access Token Exposure',
      threatLevel: 'Critical Source Code & Supply Chain Risk',
      blastRadius: 'Access to private repositories, CI/CD Actions secrets, package publishing rights.',
      impactDescription: 'Enables attackers to clone private corporate repositories, inject malicious commits into release branches, or siphon GitHub Actions environment secrets.',
      attackVector: 'Automated token scanners scanning chat logs and open-source contributions.',
      immediateActions: [
        'Visit https://github.com/settings/tokens.',
        'Revoke the compromised token immediately.',
        'Audit organization audit logs for recent git clones or pushes using the token.'
      ],
      longTermBestPractices: [
        'Migrate to Fine-Grained Personal Access Tokens with minimal resource scoping and strict expiration.',
        'Enable GitHub Secret Scanning for automated push protection.'
      ],
      safeArchitectureExample: `// Use GitHub App credentials with short-lived tokens in automated workflows.`
    }
  };

  /**
   * Generates a comprehensive advisory for a specific detection without ever handling raw secrets.
   */
  public static generateAdvisory(detection: SecretDetection): SecurityAdvisory {
    const defaultInfo = SecurityAIAssistant.advisoryKnowledgeBase[detection.ruleId] || {};

    return {
      ruleId: detection.ruleId,
      category: detection.category,
      title: defaultInfo.title || `${detection.name} Exposure Analysis`,
      threatLevel: defaultInfo.threatLevel || (detection.severity === 'critical' ? 'Critical' : 'High'),
      blastRadius:
        defaultInfo.blastRadius ||
        'Potential exposure of backend infrastructure or sensitive service credentials.',
      impactDescription:
        defaultInfo.impactDescription || detection.explanation,
      attackVector:
        defaultInfo.attackVector ||
        'Third-party cloud storage, prompt data retention pipelines, or inadvertent disclosure.',
      immediateActions: defaultInfo.immediateActions || [
        detection.remediation,
        'Rotate credential in the vendor control panel.',
        'Check service logs for unauthorized queries during the exposure period.'
      ],
      longTermBestPractices: defaultInfo.longTermBestPractices || [
        'Store secrets exclusively in environment variables or cloud key vaults.',
        'Utilize pre-commit hooks and SecretSanitizer AI firewall in your browser.'
      ],
      safeArchitectureExample:
        defaultInfo.safeArchitectureExample ||
        '// Never hardcode credentials in source code or prompt inputs.'
    };
  }

  /**
   * Analyzes an array of detections and produces an aggregated risk assessment.
   */
  public static assessRiskPosture(detections: SecretDetection[]): {
    overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'CLEAN';
    summary: string;
    criticalCount: number;
    highCount: number;
    recommendedAction: string;
  } {
    if (detections.length === 0) {
      return {
        overallRisk: 'CLEAN',
        summary: 'No sensitive credentials or private tokens detected.',
        criticalCount: 0,
        highCount: 0,
        recommendedAction: 'Input is safe to submit.'
      };
    }

    const criticalCount = detections.filter((d) => d.severity === 'critical').length;
    const highCount = detections.filter((d) => d.severity === 'high').length;

    if (criticalCount > 0) {
      return {
        overallRisk: 'CRITICAL',
        summary: `Identified ${criticalCount} critical secret(s). Submitting this content exposes production assets to immediate compromise.`,
        criticalCount,
        highCount,
        recommendedAction: 'Mandatory sanitization required before proceeding.'
      };
    }

    if (highCount > 0) {
      return {
        overallRisk: 'HIGH',
        summary: `Identified ${highCount} high-risk secret(s). May contain active authorization tokens or internal addresses.`,
        criticalCount,
        highCount,
        recommendedAction: 'Review and sanitize recommended.'
      };
    }

    return {
      overallRisk: 'MEDIUM',
      summary: `Identified ${detections.length} sensitive informational item(s) (e.g. internal network traces or PII).`,
      criticalCount: 0,
      highCount: 0,
      recommendedAction: 'Confirm with your team privacy policy before submitting.'
    };
  }
}

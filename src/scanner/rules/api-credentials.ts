import { DetectionRule } from '../../types';
import { isHighEntropySecret } from '../entropy/shannon';

export const API_CREDENTIAL_RULES: DetectionRule[] = [
  {
    id: 'openai-api-key',
    name: 'OpenAI API Key',
    category: 'api_credential',
    severity: 'critical',
    pattern: /\b(?:sk-proj-[a-zA-Z0-9_\-]{48,}|sk-[a-zA-Z0-9]{48,}|sk-svcacct-[a-zA-Z0-9_\-]{48,})\b/g,
    placeholder: '[REDACTED_OPENAI_API_KEY]',
    explanation: 'Detected an active or formatted OpenAI API secret key.',
    remediation: 'Rotate this key immediately in the OpenAI Platform Dashboard under API Keys, and store it in an environment variable or secret manager.'
  },
  {
    id: 'anthropic-api-key',
    name: 'Anthropic Claude API Key',
    category: 'api_credential',
    severity: 'critical',
    pattern: /\bsk-ant-api03-[a-zA-Z0-9_\-]{80,105}\b/g,
    placeholder: '[REDACTED_ANTHROPIC_API_KEY]',
    explanation: 'Detected an Anthropic Claude API production access token.',
    remediation: 'Revoke and rotate this key in Anthropic Console. Do not commit or paste LLM API keys in public or shared prompts.'
  },
  {
    id: 'aws-access-key-id',
    name: 'AWS Access Key ID',
    category: 'api_credential',
    severity: 'high',
    pattern: /\b(?:AKIA|ASIA|AROA)[0-9A-Z]{16}\b/g,
    placeholder: '[REDACTED_AWS_ACCESS_KEY]',
    explanation: 'Identified an AWS IAM or STS Access Key ID.',
    remediation: 'Deactivate the key in AWS IAM Console. Verify CloudTrail for any unauthorized calls made with this access key.'
  },
  {
    id: 'aws-secret-access-key',
    name: 'AWS Secret Access Key',
    category: 'api_credential',
    severity: 'critical',
    pattern: /(?:aws_secret_access_key|aws_secret_key|aws_secret)\s*[:=]\s*["']?([a-zA-Z0-9/+=]{40})["']?/gi,
    placeholder: '[REDACTED_AWS_SECRET_KEY]',
    explanation: 'Identified an AWS Secret Access Key alongside configuration context.',
    remediation: 'Delete the exposed IAM credentials immediately and rotate via AWS CLI or IAM Console.'
  },
  {
    id: 'stripe-secret-key',
    name: 'Stripe Secret API Key',
    category: 'api_credential',
    severity: 'critical',
    pattern: /\b(?:sk|rk)_(?:live|test)_[0-9a-zA-Z]{24,99}\b/g,
    placeholder: '[REDACTED_STRIPE_SECRET]',
    explanation: 'Detected a Stripe secret or restricted processing key.',
    remediation: 'Roll the key immediately from Stripe Dashboard > Developers > API Keys. Unrestricted live keys allow full payment manipulation.'
  },
  {
    id: 'github-pat',
    name: 'GitHub Personal Access Token',
    category: 'api_credential',
    severity: 'critical',
    pattern: /\b(?:ghp_[a-zA-Z0-9]{36,40}|github_pat_[a-zA-Z0-9_]{82}|gho_[a-zA-Z0-9]{36,40}|ghs_[a-zA-Z0-9]{36,40}|ghr_[a-zA-Z0-9]{36,40})\b/g,
    placeholder: '[REDACTED_GITHUB_PAT]',
    explanation: 'Identified GitHub Personal Access Token or OAuth access token.',
    remediation: 'Revoke the token immediately at https://github.com/settings/tokens to prevent source code tampering or unauthorized commits.'
  },
  {
    id: 'gitlab-token',
    name: 'GitLab Personal Access Token',
    category: 'api_credential',
    severity: 'critical',
    pattern: /\bglpat-[0-9a-zA-Z_\-]{20,32}\b/g,
    placeholder: '[REDACTED_GITLAB_TOKEN]',
    explanation: 'Detected a GitLab personal, project, or group access token.',
    remediation: 'Revoke this access token in GitLab User Settings > Access Tokens.'
  },
  {
    id: 'google-api-key',
    name: 'Google Cloud / Maps API Key',
    category: 'api_credential',
    severity: 'high',
    pattern: /\bAIza[0-9A-Za-z_\-]{35}\b/g,
    placeholder: '[REDACTED_GOOGLE_API_KEY]',
    explanation: 'Detected a Google Cloud or Google Maps Platform API key.',
    remediation: 'Restrict key usage by HTTP referrers, IP addresses, or specific APIs in Google Cloud Console Credentials page.'
  },
  {
    id: 'slack-token',
    name: 'Slack Token',
    category: 'api_credential',
    severity: 'critical',
    pattern: /\bxox[baprs]-[0-9a-zA-Z]{10,48}(?:-[0-9a-zA-Z]{10,48})*\b/g,
    placeholder: '[REDACTED_SLACK_TOKEN]',
    explanation: 'Identified a Slack Bot, User, or Workspace token.',
    remediation: 'Revoke token in Slack API management console (api.slack.com/apps).'
  },
  {
    id: 'discord-bot-token',
    name: 'Discord Bot Token',
    category: 'api_credential',
    severity: 'critical',
    pattern: /\b[MN][A-Za-z\d]{23,26}\.[A-Za-z\d\-_]{6}\.[A-Za-z\d\-_]{27,38}\b/g,
    placeholder: '[REDACTED_DISCORD_BOT_TOKEN]',
    explanation: 'Detected a Discord Bot Authentication Token.',
    remediation: 'Regenerate token in Discord Developer Portal under Bot > Reset Token.'
  },
  {
    id: 'twilio-credentials',
    name: 'Twilio Account SID or Auth Token',
    category: 'api_credential',
    severity: 'high',
    pattern: /\b(?:AC[0-9a-fA-F]{32}|SK[0-9a-fA-F]{32})\b/g,
    placeholder: '[REDACTED_TWILIO_SID]',
    explanation: 'Identified a Twilio Account SID or API Key SID.',
    remediation: 'Check Twilio Console. Ensure secondary authentication token is also rotated.'
  },
  {
    id: 'sendgrid-api-key',
    name: 'SendGrid API Key',
    category: 'api_credential',
    severity: 'critical',
    pattern: /\bSG\.[a-zA-Z0-9_\-]{22}\.[a-zA-Z0-9_\-]{43}\b/g,
    placeholder: '[REDACTED_SENDGRID_KEY]',
    explanation: 'Detected a SendGrid Email API Key.',
    remediation: 'Revoke key in SendGrid Settings > API Keys to avoid malicious email spamming from your domain.'
  },
  {
    id: 'cloudflare-api-token',
    name: 'Cloudflare API Token',
    category: 'api_credential',
    severity: 'critical',
    pattern: /(?:cloudflare_api_token|cf_token|cloudflare_token)\s*[:=]\s*["']?([a-zA-Z0-9_\-]{40})["']?/gi,
    placeholder: '[REDACTED_CLOUDFLARE_TOKEN]',
    explanation: 'Detected a Cloudflare API Token context.',
    remediation: 'Roll this token in Cloudflare Dashboard > My Profile > API Tokens.'
  },
  {
    id: 'generic-api-key',
    name: 'Generic API Key / High Entropy Secret',
    category: 'api_credential',
    severity: 'high',
    pattern: /(?:api_?key|api_?secret|client_?secret|secret_?key|auth_?token|access_?token)\s*[:=]\s*["']?([a-zA-Z0-9_\-]{24,64})["']?/gi,
    placeholder: '[REDACTED_API_KEY]',
    explanation: 'Identified a sensitive configuration variable assigned a high-entropy secret string.',
    remediation: 'Extract credentials to a `.env` file excluded by `.gitignore` and load them via environment variables.',
    validator: (match: string) => {
      // Extract the candidate secret value from the match
      const valueMatch = match.match(/[:=]\s*["']?([a-zA-Z0-9_\-]{24,64})["']?/);
      if (!valueMatch || !valueMatch[1]) return false;
      return isHighEntropySecret(valueMatch[1], 3.5, 24);
    }
  }
];

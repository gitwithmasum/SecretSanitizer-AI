import { DetectionRule } from '../../types';

export const AUTH_SECRET_RULES: DetectionRule[] = [
  {
    id: 'jwt-token',
    name: 'JSON Web Token (JWT)',
    category: 'auth_secret',
    severity: 'high',
    pattern: /\beyJ[a-zA-Z0-9_\-]{10,}\.eyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}\b/g,
    placeholder: '[REDACTED_JWT_TOKEN]',
    explanation: 'Detected a signed JSON Web Token containing potentially sensitive user or session claims.',
    remediation: 'Never share active JWT tokens. Invalidate the session or wait for token expiry if leaked.'
  },
  {
    id: 'bearer-token',
    name: 'Bearer Authorization Header',
    category: 'auth_secret',
    severity: 'critical',
    pattern: /\bBearer\s+([a-zA-Z0-9._~+\/\-]{20,}={0,2})\b/gi,
    placeholder: 'Bearer [REDACTED_AUTH_TOKEN]',
    explanation: 'Detected HTTP Bearer authentication credentials.',
    remediation: 'Remove Authorization headers before sharing HTTP requests or curl commands with AI platforms.'
  },
  {
    id: 'basic-auth',
    name: 'Basic Authorization Header',
    category: 'auth_secret',
    severity: 'critical',
    pattern: /\bBasic\s+([a-zA-Z0-9+\/]{20,}={0,2})\b/gi,
    placeholder: 'Basic [REDACTED_BASIC_AUTH]',
    explanation: 'Detected HTTP Basic authentication header containing base64 encoded username and password.',
    remediation: 'Do not share basic authentication headers. Rotate underlying service account passwords.'
  },
  {
    id: 'hardcoded-password',
    name: 'Hardcoded Password in Code/Config',
    category: 'auth_secret',
    severity: 'high',
    pattern: /(?:password|passwd|pwd|db_pass|user_password)\s*[:=]\s*["']([^"'\s]{8,64})["']/gi,
    placeholder: '[REDACTED_PASSWORD]',
    explanation: 'Detected a hardcoded password variable or configuration entry.',
    remediation: 'Replace hardcoded passwords with environment variable references or a secrets manager.',
    validator: (match: string) => {
      const val = match.match(/[:=]\s*["']([^"'\s]{8,64})["']/);
      if (!val || !val[1]) return false;
      const pwd = val[1];
      // Filter out obvious placeholders
      if (/^(password|test|dummy|placeholder|changeme|admin|root|example)$/i.test(pwd)) {
        return false;
      }
      return true;
    }
  },
  {
    id: 'oauth-refresh-token',
    name: 'OAuth Refresh Token',
    category: 'auth_secret',
    severity: 'critical',
    pattern: /(?:refresh_token|refresh_secret)\s*[:=]\s*["']?([a-zA-Z0-9_\-\.]{30,80})["']?/gi,
    placeholder: '[REDACTED_REFRESH_TOKEN]',
    explanation: 'Detected an OAuth 2.0 refresh token capable of generating new access tokens.',
    remediation: 'Revoke the token family in your Identity Provider (IdP) dashboard.'
  }
];

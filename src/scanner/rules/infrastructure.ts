import { DetectionRule } from '../../types';

export const INFRASTRUCTURE_RULES: DetectionRule[] = [
  {
    id: 'postgres-conn-string',
    name: 'PostgreSQL Connection URI',
    category: 'infrastructure_secret',
    severity: 'critical',
    pattern: /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@[^/\s]+(?::\d+)?\/[^\s"']+/gi,
    placeholder: '[REDACTED_POSTGRES_URI]',
    explanation: 'Detected a full PostgreSQL database connection string including embedded password.',
    remediation: 'Do not paste live database connection strings. Use environment variables and restrict DB firewall rules.'
  },
  {
    id: 'mysql-conn-string',
    name: 'MySQL Connection URI',
    category: 'infrastructure_secret',
    severity: 'critical',
    pattern: /mysql:\/\/[^:\s]+:[^@\s]+@[^/\s]+(?::\d+)?\/[^\s"']+/gi,
    placeholder: '[REDACTED_MYSQL_URI]',
    explanation: 'Detected a MySQL database URI with plaintext authentication credentials.',
    remediation: 'Remove database credentials and sanitize hostname before requesting SQL assistance.'
  },
  {
    id: 'mongodb-conn-string',
    name: 'MongoDB Connection URI',
    category: 'infrastructure_secret',
    severity: 'critical',
    pattern: /mongodb(?:\+srv)?:\/\/[^:\s]+:[^@\s]+@[^/\s]+(?:\/[^\s"']*)?/gi,
    placeholder: '[REDACTED_MONGODB_URI]',
    explanation: 'Detected a MongoDB Atlas or server connection string with embedded credentials.',
    remediation: 'Rotate the database user password in MongoDB Atlas and restrict IP access lists.'
  },
  {
    id: 'redis-conn-string',
    name: 'Redis Connection URI',
    category: 'infrastructure_secret',
    severity: 'critical',
    pattern: /rediss?:\/\/(?:[^:\s]+:[^@\s]+@|:[^@\s]+@)[^/\s]+(?::\d+)?/gi,
    placeholder: '[REDACTED_REDIS_URI]',
    explanation: 'Detected a Redis URI containing authentication password.',
    remediation: 'Never share in-memory cache connection strings containing passwords.'
  },
  {
    id: 'ssh-private-key',
    name: 'Private SSH / OpenSSH Key',
    category: 'infrastructure_secret',
    severity: 'critical',
    pattern: /-----BEGIN (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----[\s\S]+?-----END (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/g,
    placeholder: '[REDACTED_SSH_PRIVATE_KEY]',
    explanation: 'Identified an unprotected private SSH key block.',
    remediation: 'Revoke and delete this key from server `~/.ssh/authorized_keys` and generate a new key pair immediately.'
  },
  {
    id: 'pem-private-key',
    name: 'TLS / PEM Private Key',
    category: 'infrastructure_secret',
    severity: 'critical',
    pattern: /-----BEGIN PRIVATE KEY-----[\s\S]+?-----END PRIVATE KEY-----/g,
    placeholder: '[REDACTED_PEM_PRIVATE_KEY]',
    explanation: 'Detected a PKCS#8 or standard PEM TLS private key block.',
    remediation: 'Re-issue SSL/TLS certificate and revoke compromised private key.'
  },
  {
    id: 'docker-registry-auth',
    name: 'Docker Registry Auth Secret',
    category: 'infrastructure_secret',
    severity: 'high',
    pattern: /"auth":\s*"([a-zA-Z0-9+/=]{24,})"/g,
    placeholder: '"auth": "[REDACTED_DOCKER_AUTH]"',
    explanation: 'Detected base64 Docker config authentication credentials.',
    remediation: 'Regenerate personal access token for your container registry (DockerHub, ECR, GCR).'
  },
  {
    id: 'kubernetes-secret-token',
    name: 'Kubernetes Service Account Token',
    category: 'infrastructure_secret',
    severity: 'critical',
    pattern: /(?:token:\s*["']?|bearer_token:\s*["']?)(eyJ[a-zA-Z0-9_\-]{20,}\.eyJ[a-zA-Z0-9_\-]{20,}\.[a-zA-Z0-9_\-]{20,})/gi,
    placeholder: 'token: "[REDACTED_K8S_TOKEN]"',
    explanation: 'Detected a Kubernetes service account bearer token.',
    remediation: 'Delete the ServiceAccount token secret in your cluster to invalidate access.'
  }
];

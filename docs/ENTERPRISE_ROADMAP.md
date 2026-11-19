# SecretSanitizer AI — Enterprise Architecture & Future Roadmap

This document outlines the architectural blueprint for scaling SecretSanitizer AI from individual developer workstations to centralized, enterprise-wide deployments across Fortune 500 engineering organizations.

---

## 1. Managed Policy Distribution Architecture

```
                       +---------------------------------------+
                       |      Enterprise Admin Console         |
                       |  (Central Security Policy Authority)  |
                       +---------------------------------------+
                                           |
                   +-----------------------+-----------------------+
                   | Signed Policy JWS                             | Signed Policy JWS
                   v                                               v
     +---------------------------+                   +---------------------------+
     | SecretSanitizer Chrome    |                   | SecretSanitizer VS Code   |
     | Extension Runtime         |                   | Extension Runtime         |
     | * Chrome Managed Storage  |                   | * Workspace Policy .json  |
     +---------------------------+                   +---------------------------+
```

### Key Pillars:
1. **Chrome Managed Storage (`chrome.storage.managed`)**:
   - Enables IT administrators to push signed enterprise policy schemas via Google Admin Console or MDM systems (Jamf, Intune, Kandji) without requiring developer manual configuration.
   - Enforces read-only enterprise rules that developers cannot disable or override.
2. **Cryptographic Policy Verification**:
   - Organization policies are distributed as JSON Web Signatures (JWS) signed by the company's enterprise security CA.
   - The local engine verifies the signature before applying mandatory redaction policies.

---

## 2. SIEM & Telemetry Forwarding (Opt-In & Anonymized)

For corporate SOC/SIEM integration (Splunk, Datadog, Sumo Logic, AWS Security Hub):

- **Zero Secret Invariant Maintained**: Log payloads contain strictly:
  - Masked Rule ID (`openai-api-key`, `stripe-secret-key`)
  - Severity Level (`CRITICAL`, `HIGH`)
  - Target Platform Hostname (`chatgpt.com`, `claude.ai`)
  - Organization Policy ID & User Hash (HMAC-SHA256 of employee corporate ID)
- **Batching & Egress Filtering**: Transmitted via client-side proxy using mTLS.

---

## 3. Advanced Contextual LLM Obfuscation (Phase 5 Roadmap)

1. **Reversible Pseudonymization for Code Reasoning**:
   - Session-bound token substitution where variable tokens like `API_KEY_1` and `USER_HASH_1` can be re-mapped locally when AI responses return, allowing developers to ask code-specific questions without exposing live credentials.
2. **Dynamic PII Differential Privacy**:
   - Synthetic data generation for database query examples (e.g., generating fake but syntactically valid customer records for SQL prompt optimization).

---

## 4. Air-Gapped & High-Security Environment Deployments

- Complete packaging as an offline CRX bundle and VSIX package.
- Compatibility with offline Chromium builds inside SCIFs and defense-grade air-gapped networks.

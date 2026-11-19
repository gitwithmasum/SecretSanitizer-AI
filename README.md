# SecretSanitizer AI 🛡️
### Next-Generation AI Privacy Firewall & Developer Security Platform
*(Available as a Production Chrome Extension Manifest V3 & VS Code Integration)*

![SecretSanitizer AI Security Score](https://img.shields.io/badge/Security%20Score-98%25-06B6D4?style=for-the-badge)
![Manifest](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-8B5CF6?style=for-the-badge)
![Engine](https://img.shields.io/badge/Scanning-100%25%20Local%20Zero--Egress-10B981?style=for-the-badge)
![Tests](https://img.shields.io/badge/Vitest-31%20Passed%20(100%25)-00F2FE?style=for-the-badge)

---

## 🌟 Executive Overview

**SecretSanitizer AI** is a production-oriented, privacy-first cybersecurity browser extension and developer defense platform engineered to detect, classify, sanitize, and intercept credentials, infrastructure URIs, sensitive tokens, and context-aware PII before they can accidentally leak to third-party AI interfaces, public repositories, or system clipboards.

### 🛡️ Non-Negotiable Privacy Guarantees
1. **100% Local Scanning**: Zero network egress. No code, prompt, or credential ever leaves your browser sandbox.
2. **Deterministic & Contextual Accuracy**: Multistage detection engine combining regex token heuristics, **Shannon Entropy analysis** ($H \ge 3.6$ to $4.5$), character set distributions, and proximity keyword boosting.
3. **Format-Preserving Sanitization**: Redacts sensitive values while strictly preserving code indentation, line breaks, variable names, JSON/YAML/SQL syntax, and formatting.
4. **Resilient AI Firewall Adapters**: Dedicated DOM hooks for **ChatGPT**, **Claude**, **Google Gemini**, **Microsoft Copilot**, **Perplexity**, and generic web inputs with **Shadow-DOM modal interception**.

---

## ⚡ Quick Start: Installation & Load Unpacked

### 1. Requirements
- Node.js (v18+ or v24+)
- Google Chrome, Brave, Arc, Edge, or any Chromium browser

### 2. Build the Extension
```bash
# Clone the repository
git clone https://github.com/your-org/SecretSanitizer.git
cd SecretSanitizer

# Install dependencies
npm install

# Run automated test suite
npm run test

# Build production bundle
npm run build
```

The production extension files will be output to the `dist/` directory:
- `dist/manifest.json` (Chrome Manifest V3)
- `dist/popup.html` (Cyber-themed Browser Action popup)
- `dist/dashboard.html` (Full-featured Security Dashboard SPA)
- `dist/background.js` (Service Worker)
- `dist/content.js` (Standalone IIFE Content Script)
- `dist/icons/` (16x16, 32x32, 48x48, 128x128 PNG icons)

### 3. Load into Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle the **"Developer mode"** switch in the top-right corner.
3. Click the **"Load unpacked"** button in the top-left toolbar.
4. Select the `dist/` folder inside your project directory (`SecretSanitizer/dist`).
5. SecretSanitizer AI is now active! Pin the extension to your toolbar.

---

## 🧩 Architectural Modules

```
src/
├── background/         # Manifest V3 service worker, context menus, action badge
├── content/            # Isolated world content script initializer
├── adapters/           # Modular website DOM adapters (ChatGPT, Claude, Gemini, Copilot, Perplexity, Generic)
├── firewall/           # AI Privacy Firewall controller & Shadow-DOM Security Review Modal
├── clipboard/          # Clipboard Guardian local copy interceptor & warning toasts
├── scanner/            # Detection engine, Shannon entropy analyzer, character distribution
│   ├── detectors/      # API credentials, auth secrets, infrastructure URIs, PII
│   ├── entropy/        # Mathematical Shannon entropy calculation & masking
│   └── rules/          # Built-in rules registry & ReDoS regex validation
├── sanitizer/          # Range-overlap resolver, format-preserving redaction, undo/redo manager
├── security/           # Local Security AI Assistant (offline remediation & blast-radius analysis)
├── enterprise/         # Enterprise policy evaluator, compliance reports (SOC 2, ISO 27001, GDPR)
├── storage/            # Type-safe Chrome Storage abstraction with zero raw secret retention
├── popup/              # Compact cyberpunk browser popup UI
├── dashboard/          # Comprehensive 9-module Security Dashboard SPA
│   ├── tabs/           # Overview, Code Scanner, AI Firewall, Clipboard, Findings, Logs, Rules, Enterprise, Settings
│   └── OnboardingModal # 7-step guided setup wizard with synthetic test scanner
└── types/              # Centralized TypeScript definitions
```

---

## 🎯 Supported Detectors & Signatures

| Category | Detectors & Signatures | Default Placeholder |
| :--- | :--- | :--- |
| **API Credentials** | OpenAI API Keys (`sk-proj-...`, `sk-...`), Anthropic Claude Keys (`sk-ant-api03-...`), AWS Access Key IDs (`AKIA...`), AWS Secret Keys, Stripe Secret & Restricted Keys (`sk_live_...`, `rk_live_...`), GitHub PAT (`ghp_...`, `github_pat_...`), GitLab Tokens (`glpat-...`), Google Cloud/Maps Keys (`AIza...`), Slack Tokens (`xoxb-...`), Discord Bot Tokens, Twilio SIDs, SendGrid Keys (`SG....`), Cloudflare Tokens, Generic High-Entropy API Keys | `[REDACTED_API_KEY]`, `[REDACTED_STRIPE_SECRET]`, `[REDACTED_AWS_KEY]` |
| **Authentication Secrets** | Signed JWT Tokens, Bearer Authorization Headers, Basic Authentication Headers, Hardcoded Passwords in config/connection strings, OAuth Refresh Tokens | `[REDACTED_JWT_TOKEN]`, `Bearer [REDACTED_AUTH_TOKEN]`, `[REDACTED_PASSWORD]` |
| **Infrastructure Secrets** | PostgreSQL Connection URIs (`postgres://...`), MySQL URIs (`mysql://...`), MongoDB Connection Strings (`mongodb+srv://...`), Redis URIs with Passwords, Private SSH Keys (`BEGIN RSA/OPENSSH PRIVATE KEY`), TLS/PEM Private Keys, Docker Registry Auth Secrets, Kubernetes Service Account Tokens | `[REDACTED_POSTGRES_URI]`, `[REDACTED_SSH_PRIVATE_KEY]`, `[REDACTED_MONGODB_URI]` |
| **PII & Business Information** | Credit Card Numbers (validated by **Luhn Algorithm Mod 10**), US Social Security Numbers (SSN), Internal RFC-1918 IP Addresses (`10.x`, `172.16-31.x`, `192.168.x`), Internal Enterprise Hostnames (`*.internal`, `*.corp`), Phone Numbers, Customer Emails | `[REDACTED_CREDIT_CARD]`, `[REDACTED_SSN]`, `[REDACTED_INTERNAL_IP]` |

---

## 🖥️ VS Code Extension Integration

The core scanner and sanitization engine is designed as a portable, decoupled module. The included `vscode-extension/` package provides:
- Instant file scanning: `SecretSanitizer: Scan Current File for Secrets`
- Selection redaction: `SecretSanitizer: Sanitize and Copy Selection`
- File preview diff: `SecretSanitizer: Sanitize Entire File (Preview Diff)`

---

## 🧪 Automated Testing

Run the full suite of unit, security, and edge-case regression tests with:
```bash
npm run test
```

### Verified Test Cases:
- ✅ Shannon entropy calculation on natural language, base64 tokens, and hex hashes.
- ✅ Detection of vendor-prefixed tokens (OpenAI, Anthropic, Stripe, AWS, GitHub, Slack, Discord).
- ✅ Validation of credit cards via the mathematical Luhn algorithm (rejecting false positives).
- ✅ Multi-secret document sanitization preserving indentation and variable names.
- ✅ JSON structure preservation during nested token replacement.
- ✅ Overlapping detection range resolution (prioritizing critical severity).
- ✅ ReDoS catastrophic backtracking prevention for custom regex patterns.
- ✅ Enterprise policy evaluation and compliance readiness reporting.

---

## 📄 License & Security
- **License**: MIT
- **Security Policy**: Zero raw secret logging. All sensitive data processed purely in client memory.

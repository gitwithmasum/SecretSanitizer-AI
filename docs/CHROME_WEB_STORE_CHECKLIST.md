# Chrome Web Store — Submission & Compliance Checklist

## 1. Single Purpose Policy Compliance
- [x] **Primary Purpose**: The extension has a single, clear purpose: intercepting and redacting sensitive credentials and PII from prompts and clipboards.
- [x] **Clear Title & Summary**: "SecretSanitizer AI — Privacy Firewall & Secret Scanner".
- [x] **Accurate Description**: Clearly describes local scanning, supported platforms (ChatGPT, Claude, Gemini, Copilot, Perplexity), and zero data egress.

## 2. Permissions Justification Audit
- [x] `storage`: "Stores user preferences, custom detection rules, and local security audit counts strictly on the device."
- [x] `activeTab`: "Detects whether the current tab is an AI chat interface to present the security review overlay."
- [x] `scripting`: "Injects local DOM interceptor hooks on supported AI platform prompt forms."
- [x] `contextMenus`: "Adds right-click shortcuts to sanitize selected code blocks and copy safe versions."
- [x] `clipboardWrite`: "Writes redacted code snippets to the system clipboard upon user confirmation."

## 3. Visual Assets Verification
- [x] Icon 16x16 PNG (`dist/icons/icon16.png`)
- [x] Icon 32x32 PNG (`dist/icons/icon32.png`)
- [x] Icon 48x48 PNG (`dist/icons/icon48.png`)
- [x] Icon 128x128 PNG (`dist/icons/icon128.png`)
- [x] High-contrast cyber-shield artwork adhering to Web Store visual guidelines.

## 4. Code Quality & Security Review
- [x] No `eval()`, `new Function()`, or dynamic remote code execution.
- [x] Manifest V3 compliant service worker architecture.
- [x] Strict Content Security Policy (`script-src 'self'; object-src 'self';`).
- [x] Shadow DOM encapsulation preventing CSS or script bleed into host pages.
- [x] Automated test suite passing with 100% success rate (Vitest).

## 5. Privacy & Data Use Declaration
- [x] Public Privacy Policy URL provided (`docs/PRIVACY_POLICY.md`).
- [x] Declared "Does not collect or transmit user data".
- [x] Declared "Does not sell user data to third parties".
- [x] Declared "Does not use data for creditworthiness or lending purposes".

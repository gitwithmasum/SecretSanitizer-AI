# SecretSanitizer AI — Security Architecture & Threat Model

## 1. Zero-Egress Architectural Model

The fundamental security principle of SecretSanitizer AI is **Air-Gapped Processing**. No sensitive tokens, prompt texts, code snippets, or clipboard payloads are ever transmitted outside the user's local browser runtime.

```
+-----------------------------------------------------------------------+
|                         CHROME EXTENSION SANDBOX                      |
|                                                                       |
|   +-------------------+       +-----------------------------------+   |
|   |   Host Webpage    | ----> |   AI Firewall Content Script      |   |
|   |  (e.g., ChatGPT)  |       |   (Isolated World Execution)      |   |
|   +-------------------+       +-----------------------------------+   |
|                                                 |                     |
|                                                 v                     |
|                               +-----------------------------------+   |
|                               |     Detection Engine (Local)      |   |
|                               |  * Shannon Entropy Analysis       |   |
|                               |  * Multistage Regex Signatures    |   |
|                               |  * Luhn Mod 10 Checksum           |   |
|                               +-----------------------------------+   |
|                                                 |                     |
|                                                 v                     |
|                               +-----------------------------------+   |
|                               |     Sanitization Engine (Local)   |   |
|                               |  * Overlap Resolution             |   |
|                               |  * Format-Preserving Redaction    |   |
|                               +-----------------------------------+   |
|                                                 |                     |
|                                                 v                     |
|                               +-----------------------------------+   |
|                               |   Shadow DOM Security Modal       |   |
|                               |  (Zero host style leakage)        |   |
|                               +-----------------------------------+   |
+-----------------------------------------------------------------------+
                                  |
                                  X  NO NETWORK EGRESS TO ANY API OR CLOUD
```

---

## 2. Mathematical Foundation: Shannon Entropy Analysis

To distinguish randomly generated secret tokens (e.g., AWS Secret Access Keys, Stripe live secrets, high-entropy API keys) from common identifiers, English text, and commit hashes, the engine calculates the Shannon entropy $H(S)$ of candidate strings:

$$H(S) = -\sum_{i=1}^{n} p(c_i) \log_2(p(c_i))$$

Where $p(c_i)$ represents the empirical probability frequency of character $c_i$ in string $S$ of length $L$.

### Standard Baselines:
- **Natural Language Text**: $2.2 \le H(S) \le 3.4$ bits/char.
- **Base64 Secrets & Cryptographic Keys**: $H(S) \ge 4.2$ bits/char.
- **Hexadecimal Hashes (SHA-1, MD5)**: Max entropy theoretical cap is $\log_2(16) = 4.0$.
- **UUIDs (RFC 4122)**: Filtered out using explicit canonical structure checks to prevent false alarms on non-secret GUIDs.

---

## 3. DOM Isolation via Shadow DOM

When an attempt to submit sensitive credentials to ChatGPT, Claude, or Gemini is intercepted, the `SecurityReviewModal` injects an isolated Shadow Root:

```typescript
const host = document.createElement('div');
host.id = 'secretsanitizer-modal-host';
const shadow = host.attachShadow({ mode: 'open' });
```

### Protection Characteristics:
1. **Host Style Immunity**: CSS reset and scoped stylesheet prevent host page rules (`tailwind`, `bootstrap`, `styled-components`) from corrupting the security modal layout.
2. **Reverse Script Isolation**: Host scripts cannot access private event handlers bound inside the closed shadow boundary.
3. **Z-Index Primacy**: `z-index: 2147483647` guarantees the review modal displays above all full-screen host viewports and modals.

---

## 4. ReDoS (Catastrophic Backtracking) Defense

User-defined custom rules are validated against nested quantifiers that cause exponential backtracking $O(2^n)$:

```typescript
const catastrophicBacktrackingRegex = /(\([^\)]*[\+\*][^\)]*\))[\+\*]|(\[[^\]]*[\+\*][^\]]*\])[\+\*]/;
```

Any pattern exhibiting constructs such as `(a+)+`, `([a-z0-9]+)*`, or `(.*)*` is rejected immediately during rule creation, protecting the browser thread from UI lockup.

---

## 5. Storage Security & Privacy Invariants

1. **Zero Raw Secret Persistence**: The `SecurityEvent` log stores only:
   - Event Timestamp
   - Domain Name
   - Detection Rule ID
   - Severity
   - Action Taken (`sanitized`, `blocked`, `bypassed`, `warned`)
   - Masked snippet representation (e.g., `sk-proj-...8aB9`)
2. **Ephemeral Replacement Mapping**: The original-to-sanitized dictionary exists strictly within in-memory closures during the active review session and is discarded when the tab closes.
3. **Data Erasure**: Users can execute complete zero-residue erasure via **Settings > Erase All Local Data**.

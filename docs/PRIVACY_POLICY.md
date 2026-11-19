# Privacy Policy — SecretSanitizer AI

*Effective Date: November 20, 2026*

**SecretSanitizer AI** ("we", "our", or "the Extension") was built from the ground up to protect user privacy. Our core mission is preventing unauthorized exposure of credentials and sensitive data. We believe security software should never become spyware.

---

## 1. Information We Collect
**We collect ZERO personal data, ZERO prompt contents, and ZERO credentials.**

Specifically:
- **No Remote Transmission**: The Extension does not maintain any backend API, telemetry endpoint, analytics server, or remote logging database.
- **No Raw Secret Retention**: When sensitive credentials (such as API keys, tokens, or connection strings) are identified, they are processed entirely in temporary device memory. They are never written to unencrypted permanent logs, synced to cloud servers, or transmitted off your machine.
- **Local Storage Only**: Any configuration preferences (such as your chosen protection mode, custom regex rules, and masked audit counts) are stored locally in your browser's `chrome.storage.local`.

---

## 2. Browser Permissions Justification

| Permission | Technical Purpose |
| :--- | :--- |
| `storage` | Required to save user preferences, custom detection patterns, and masked audit counters locally on your computer. |
| `activeTab` | Required to detect the active AI interface (e.g., ChatGPT, Claude) and enable the in-page security review dialog when credentials are submitted. |
| `scripting` | Required to inject the local content script firewall into supported AI domains. |
| `contextMenus` | Enables right-click context menu shortcuts ("SecretSanitizer: Sanitize Selection & Copy"). |
| `clipboardWrite` | Enables the Clipboard Guardian to write sanitized, redacted code to your clipboard when you explicitly request a sanitized copy. |
| `clipboardRead` (optional) | Used solely during user-initiated copy actions to inspect the selected text buffer locally for credentials before allowing it into the clipboard. |

---

## 3. Data Sovereignty & Deletion
You retain complete sovereignty over all data created within the Extension. You can permanently erase all stored settings, custom rules, and audit logs at any time by navigating to **Dashboard > Settings > Erase All Local Data**.

Uninstalling the Extension automatically removes all associated local storage data from your computer.

---

## 4. Contact & Compliance
If you have questions regarding this Privacy Policy or SecretSanitizer AI's security architecture, please contact our open-source security team via our repository issues page.

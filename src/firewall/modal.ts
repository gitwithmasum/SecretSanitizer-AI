import { SecretDetection, SanitizeResult } from '../types';

export interface ModalCallbacks {
  onSanitizeAndSubmit: (sanitizedText: string) => void;
  onBypassAndSubmit: () => void;
  onCancel: () => void;
}

export class SecurityReviewModal {
  private static hostElement: HTMLElement | null = null;

  public static show(
    sanitizeResult: SanitizeResult,
    callbacks: ModalCallbacks,
    allowBypass = true
  ): void {
    this.close();

    // Create host container
    const host = document.createElement('div');
    host.id = 'secretsanitizer-modal-host';
    host.style.position = 'fixed';
    host.style.zIndex = '2147483647';
    host.style.top = '0';
    host.style.left = '0';
    host.style.width = '100vw';
    host.style.height = '100vh';

    const shadow = host.attachShadow({ mode: 'open' });
    this.hostElement = host;

    // Build internal HTML & scoped CSS
    const style = document.createElement('style');
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .backdrop {
        position: fixed; inset: 0; background: rgba(5, 8, 15, 0.85); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center; padding: 20px;
      }
      .modal-card {
        background: #0B0F19; border: 1px solid #1E293B; border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(6, 182, 212, 0.2);
        max-width: 750px; width: 100%; max-height: 90vh; display: flex; flex-direction: column;
        color: #F8FAFC; overflow: hidden; animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes popIn {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
      }
      .header {
        padding: 20px 24px; border-bottom: 1px solid #1E293B; display: flex; align-items: center; justify-content: space-between;
        background: linear-gradient(180deg, #10172A 0%, #0B0F19 100%);
      }
      .title-box { display: flex; align-items: center; gap: 12px; }
      .shield-icon {
        width: 38px; height: 38px; border-radius: 10px; background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.3); display: flex; align-items: center; justify-content: center;
        color: #EF4444; font-size: 20px; font-weight: bold;
      }
      .title { font-size: 18px; font-weight: 700; color: #FFFFFF; }
      .subtitle { font-size: 13px; color: #94A3B8; margin-top: 2px; }
      .badge-count {
        background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4);
        color: #FCA5A5; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px;
      }
      .content { padding: 20px 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 18px; }
      .findings-list { display: flex; flex-direction: column; gap: 8px; }
      .finding-item {
        background: #111827; border: 1px solid #1F2937; border-radius: 8px; padding: 12px 14px;
        display: flex; align-items: center; justify-content: space-between;
      }
      .finding-info { display: flex; flex-direction: column; gap: 3px; }
      .finding-name { font-size: 13px; font-weight: 600; color: #E2E8F0; display: flex; align-items: center; gap: 8px; }
      .severity-pill {
        font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px;
      }
      .severity-critical { background: #7F1D1D; color: #FCA5A5; }
      .severity-high { background: #78350F; color: #FCD34D; }
      .severity-medium { background: #1E3A8A; color: #93C5FD; }
      .severity-low { background: #14532D; color: #86EFAC; }
      .masked-value { font-family: monospace; font-size: 12px; color: #38BDF8; background: #0B1120; padding: 2px 6px; border-radius: 4px; }
      .preview-box {
        background: #030712; border: 1px solid #1F2937; border-radius: 8px; padding: 14px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px; line-height: 1.5; color: #A5B4FC; max-height: 180px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;
      }
      .preview-label { font-size: 12px; font-weight: 600; color: #94A3B8; margin-bottom: 6px; display: flex; justify-content: space-between; }
      .footer {
        padding: 16px 24px; border-top: 1px solid #1E293B; background: #0B0F19;
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
      }
      .actions-right { display: flex; align-items: center; gap: 10px; }
      .btn {
        padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
        transition: all 0.15s ease; border: none; display: inline-flex; align-items: center; gap: 6px;
      }
      .btn-cancel { background: #1E293B; color: #94A3B8; }
      .btn-cancel:hover { background: #334155; color: #FFFFFF; }
      .btn-bypass { background: transparent; color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.4); }
      .btn-bypass:hover { background: rgba(239, 68, 68, 0.15); }
      .btn-sanitize {
        background: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%); color: #FFFFFF;
        box-shadow: 0 0 15px rgba(6, 182, 212, 0.4);
      }
      .btn-sanitize:hover { opacity: 0.92; transform: translateY(-1px); }
    `;

    const wrapper = document.createElement('div');
    wrapper.className = 'backdrop';

    const findingsHtml = sanitizeResult.detections
      .map(
        (d: SecretDetection) => `
        <div class="finding-item">
          <div class="finding-info">
            <div class="finding-name">
              <span>${d.name}</span>
              <span class="severity-pill severity-${d.severity}">${d.severity}</span>
            </div>
            <div style="font-size: 11px; color: #64748B;">Line ${d.line}, Col ${d.column} &bull; ${d.explanation}</div>
          </div>
          <div class="masked-value">${d.maskedValue}</div>
        </div>
      `
      )
      .join('');

    wrapper.innerHTML = `
      <div class="modal-card">
        <div class="header">
          <div class="title-box">
            <div class="shield-icon">&#128737;</div>
            <div>
              <div class="title">Secret Exposure Intercepted</div>
              <div class="subtitle">SecretSanitizer AI Firewall prevented credential leakage</div>
            </div>
          </div>
          <div class="badge-count">${sanitizeResult.stats.total} Secrets Detected</div>
        </div>

        <div class="content">
          <div>
            <div class="preview-label">
              <span>DETECTED SENSITIVE VALUES</span>
              <span style="color: #EF4444; font-size: 11px;">Local scan &bull; zero cloud egress</span>
            </div>
            <div class="findings-list">
              ${findingsHtml}
            </div>
          </div>

          <div>
            <div class="preview-label">
              <span>SANITIZED PREVIEW (Safe to submit)</span>
              <span style="color: #10B981; font-size: 11px;">Formatted & Structure Preserved</span>
            </div>
            <div class="preview-box">${this.escapeHtml(sanitizeResult.sanitized)}</div>
          </div>
        </div>

        <div class="footer">
          <button class="btn btn-cancel" id="ss-btn-cancel">Cancel Submission</button>
          <div class="actions-right">
            ${
              allowBypass
                ? '<button class="btn btn-bypass" id="ss-btn-bypass">One-Time Bypass</button>'
                : ''
            }
            <button class="btn btn-sanitize" id="ss-btn-sanitize">Sanitize & Submit</button>
          </div>
        </div>
      </div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(wrapper);
    document.body.appendChild(host);

    // Bind event handlers
    const btnCancel = shadow.getElementById('ss-btn-cancel');
    const btnSanitize = shadow.getElementById('ss-btn-sanitize');
    const btnBypass = shadow.getElementById('ss-btn-bypass');

    btnCancel?.addEventListener('click', () => {
      this.close();
      callbacks.onCancel();
    });

    btnSanitize?.addEventListener('click', () => {
      const sanitized = sanitizeResult.sanitized;
      this.close();
      callbacks.onSanitizeAndSubmit(sanitized);
    });

    btnBypass?.addEventListener('click', () => {
      if (
        confirm(
          'WARNING: You are about to submit unredacted credentials to an external AI platform. Are you sure you wish to proceed?'
        )
      ) {
        this.close();
        callbacks.onBypassAndSubmit();
      }
    });
  }

  public static close(): void {
    if (this.hostElement && this.hostElement.parentNode) {
      this.hostElement.parentNode.removeChild(this.hostElement);
    }
    this.hostElement = null;
  }

  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

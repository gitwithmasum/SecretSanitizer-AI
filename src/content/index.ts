import { AIWebsiteFirewall } from '../firewall/interceptor';
import { ClipboardGuardian } from '../clipboard/guardian';
import { AdapterRegistry } from '../adapters/registry';

(async () => {
  try {
    const firewall = new AIWebsiteFirewall();
    await firewall.init();

    const guardian = new ClipboardGuardian();
    await guardian.init();

    // Listen for extension commands or status checks from popup
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
        if (request.type === 'GET_PAGE_STATUS') {
          const adapter = AdapterRegistry.getAdapterForHost(window.location.hostname);
          const isSupported = adapter.id !== 'generic';
          const isInputFound = adapter.isAvailable();
          sendResponse({
            hostname: window.location.hostname,
            platformName: adapter.name,
            isSupported,
            isInputFound,
            degradedReason: adapter.getDegradedReason ? adapter.getDegradedReason() : null
          });
        }
        return true;
      });
    }
  } catch (err) {
    console.error('[SecretSanitizer AI] Content script initialization error:', err);
  }
})();

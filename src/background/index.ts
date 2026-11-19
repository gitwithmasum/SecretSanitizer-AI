import { StorageService } from '../storage';
import { DetectionEngine } from '../scanner/engine';
import { SanitizationEngine } from '../sanitizer/engine';

// Initialize extension on install or update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[SecretSanitizer AI] Extension installed/updated:', details.reason);
  const settings = await StorageService.getSettings();

  // Set initial badge
  updateBadge(settings.masterEnabled);

  // Setup Context Menus
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'ss-sanitize-selection',
      title: 'SecretSanitizer: Sanitize Selection & Copy',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'ss-open-dashboard',
      title: 'SecretSanitizer: Open Security Dashboard',
      contexts: ['action']
    });
  });

  // Open onboarding on first install
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html?tab=onboarding') });
  }
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'ss-open-dashboard') {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  } else if (info.menuItemId === 'ss-sanitize-selection' && info.selectionText && tab?.id) {
    const engine = new DetectionEngine();
    const detections = engine.scan(info.selectionText);
    const result = SanitizationEngine.sanitize(info.selectionText, detections);

    // Write sanitized text to clipboard via script injection
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (textToCopy: string, count: number) => {
        navigator.clipboard.writeText(textToCopy).then(() => {
          alert(`SecretSanitizer: Sanitized ${count} secret(s) and copied clean text to clipboard.`);
        });
      },
      args: [result.sanitized, detections.length]
    });
  }
});

// Update Action Badge
function updateBadge(enabled: boolean) {
  if (enabled) {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#06B6D4' }); // Electric Cyan
  } else {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#EF4444' }); // Red
  }
}

// Listen for messages from popup or dashboard
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'UPDATE_MASTER_STATUS') {
    updateBadge(message.enabled);
    sendResponse({ success: true });
  } else if (message.type === 'OPEN_DASHBOARD') {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    sendResponse({ success: true });
  }
  return true;
});

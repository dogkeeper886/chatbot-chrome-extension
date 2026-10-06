chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'send-selection',
    title: 'Send to Dify',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'send-selection') return;
  // Open the panel first: sidePanel.open must run within the click's user gesture.
  chrome.sidePanel.open({ windowId: tab.windowId });
  // The panel picks the text up when its chat box is ready.
  chrome.storage.session.set({ pendingText: `${info.selectionText}\n\nSource: ${info.pageUrl}` });
});

// dify-bridge.js runs in the Dify chat page, so "Send to Dify" can fill its chat box.
// Chrome can drop runtime registrations, as when the extension reloads, so register again
// each time the service worker starts, and whenever the ChatBot URL or granted addresses change.
let bridgeSync = Promise.resolve();
function syncBridge() {
  bridgeSync = bridgeSync.then(registerBridge).catch((error) => console.error(error));
}

async function registerBridge() {
  await chrome.scripting.unregisterContentScripts({ ids: ['dify-bridge'] }).catch(() => {});
  const { chatbotUrl } = await chrome.storage.sync.get('chatbotUrl');
  if (!chatbotUrl) return;
  const origins = [`${new URL(chatbotUrl).origin}/*`];
  if (!(await chrome.permissions.contains({ origins }))) return;
  await chrome.scripting.registerContentScripts([
    { id: 'dify-bridge', matches: origins, js: ['dify-bridge.js'], allFrames: true },
  ]);
  // A chat page that loaded before the registration has no bridge; let the panel reload it.
  chrome.runtime.sendMessage({ type: 'bridge-registered' }).catch(() => {});
}

syncBridge();
chrome.permissions.onAdded.addListener(syncBridge);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.chatbotUrl) syncBridge();
});

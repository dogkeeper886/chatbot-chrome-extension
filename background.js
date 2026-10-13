chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

function showUrlInTitle(chatbotUrl) {
  chrome.action.setTitle({
    title: chatbotUrl ? `Dify chatbot: ${chatbotUrl}` : 'Open the Dify chatbot',
  });
}

// Wakes the service worker at browser start so the title is set before the first click.
chrome.runtime.onStartup.addListener(() => {});
chrome.storage.sync.get('chatbotUrl', (result) => showUrlInTitle(result.chatbotUrl));
chrome.storage.onChanged.addListener((changes) => {
  if (changes.chatbotUrl) showUrlInTitle(changes.chatbotUrl.newValue);
});

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
  // A click inside the side panel has no tab, and the panel is open already.
  if (tab) chrome.sidePanel.open({ windowId: tab.windowId });
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
  if (area !== 'sync' || !changes.chatbotUrl) return;
  syncBridge();
  dropOldAccess(changes.chatbotUrl.oldValue, changes.chatbotUrl.newValue);
});

// Give up access to the earlier Dify address when the ChatBot URL moves to another host.
// A change of port alone keeps it, in case Chrome matches granted addresses without the port.
function dropOldAccess(oldUrl, newUrl) {
  if (!oldUrl) return;
  const site = ({ protocol, hostname }) => `${protocol}//${hostname}`;
  const old = new URL(oldUrl);
  if (newUrl && site(new URL(newUrl)) === site(old)) return;
  chrome.permissions
    .remove({ origins: [`${old.origin}/*`] })
    .catch((error) => console.error(error));
}

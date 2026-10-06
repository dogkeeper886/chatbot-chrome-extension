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
  chrome.sidePanel.open({ windowId: tab.windowId });
  // The panel picks the text up when its chat box is ready.
  chrome.storage.session.set({ pendingText: `${info.selectionText}\n\nSource: ${info.pageUrl}` });
});

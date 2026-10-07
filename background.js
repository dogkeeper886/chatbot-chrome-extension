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

const input = document.getElementById('chatbot-url');
const status = document.getElementById('status');

chrome.storage.sync.get('chatbotUrl', (result) => {
  input.value = result.chatbotUrl || '';
});

document.getElementById('save').addEventListener('click', async () => {
  const chatbotUrl = input.value.trim();
  if (!/^https?:\/\/\S+$/.test(chatbotUrl)) {
    status.textContent = 'Enter a URL that starts with http:// or https://.';
    return;
  }
  const origin = new URL(chatbotUrl).origin;
  // Ask first: Chrome allows a permission request only within the click.
  // The service worker registers dify-bridge.js once the address is granted.
  const granted = await chrome.permissions.request({ origins: [`${origin}/*`] });
  await chrome.storage.sync.set({ chatbotUrl });
  status.textContent = granted
    ? 'Saved.'
    : `Saved. Without access to ${origin}, Send to Dify cannot fill the chat box.`;
});

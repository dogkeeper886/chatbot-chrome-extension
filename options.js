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
  const granted = await chrome.permissions.request({ origins: [`${origin}/*`] });
  await chrome.storage.sync.set({ chatbotUrl });
  if (!granted) {
    status.textContent = `Saved. Without access to ${origin}, Send to Dify cannot fill the chat box.`;
    return;
  }
  await registerBridge(origin);
  status.textContent = 'Saved.';
});

// Runs dify-bridge.js in the Dify chat page, so "Send to Dify" can fill its chat box.
async function registerBridge(origin) {
  await chrome.scripting.unregisterContentScripts({ ids: ['dify-bridge'] }).catch(() => {});
  await chrome.scripting.registerContentScripts([
    {
      id: 'dify-bridge',
      matches: [`${origin}/*`],
      js: ['dify-bridge.js'],
      allFrames: true,
    },
  ]);
}

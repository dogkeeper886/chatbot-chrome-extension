const input = document.getElementById('chatbot-url');
const status = document.getElementById('status');

chrome.storage.sync.get('chatbotUrl', (result) => {
  input.value = result.chatbotUrl || '';
});

document.getElementById('save').addEventListener('click', () => {
  const chatbotUrl = input.value.trim();
  if (!/^https?:\/\/\S+$/.test(chatbotUrl)) {
    status.textContent = 'Enter a URL that starts with http:// or https://.';
    return;
  }
  chrome.storage.sync.set({ chatbotUrl }, () => {
    status.textContent = 'Saved.';
  });
});

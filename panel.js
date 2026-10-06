function show(chatbotUrl) {
  document.body.replaceChildren();
  if (!chatbotUrl) {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = 'Set the ChatBot URL';
    link.addEventListener('click', () => chrome.runtime.openOptionsPage());
    p.append(link, ' to open your Dify chatbot here.');
    document.body.append(p);
    return;
  }
  const iframe = document.createElement('iframe');
  iframe.src = chatbotUrl;
  iframe.allow = 'clipboard-write; microphone';
  document.body.append(iframe);
}

chrome.storage.sync.get('chatbotUrl', (result) => show(result.chatbotUrl));

chrome.storage.onChanged.addListener((changes) => {
  if (changes.chatbotUrl) show(changes.chatbotUrl.newValue);
});

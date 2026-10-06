let chatFrame = null;
let bridgeReady = false;
let fallbackTimer = null;

function show(chatbotUrl) {
  document.body.replaceChildren();
  chatFrame = null;
  bridgeReady = false;
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
  chatFrame = document.createElement('iframe');
  chatFrame.src = chatbotUrl;
  chatFrame.allow = 'clipboard-write; microphone';
  document.body.append(chatFrame);
}

// Text from "Send to Dify" waits in session storage until the chat box can take it.
async function deliverPendingText() {
  const { pendingText } = await chrome.storage.session.get('pendingText');
  if (!pendingText || !chatFrame) return;
  if (!bridgeReady) {
    // Without the bridge (no access to the Dify address yet), offer the text to copy.
    clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(() => {
      if (!bridgeReady) offerCopy(pendingText);
    }, 10000);
    return;
  }
  await chrome.storage.session.remove('pendingText');
  chatFrame.contentWindow.postMessage(
    { type: 'dify-bridge-insert', text: pendingText },
    new URL(chatFrame.src).origin,
  );
}

function offerCopy(text) {
  chrome.storage.session.remove('pendingText');
  document.getElementById('notice')?.remove();
  const notice = document.createElement('div');
  notice.id = 'notice';
  const copy = document.createElement('button');
  copy.textContent = 'Copy text';
  copy.addEventListener('click', async () => {
    await navigator.clipboard.writeText(text);
    notice.remove();
  });
  notice.append('Could not reach the chat box. Paste the text yourself.', copy);
  document.body.prepend(notice);
}

window.addEventListener('message', (event) => {
  if (!chatFrame || event.source !== chatFrame.contentWindow) return;
  if (event.data?.type === 'dify-bridge-ready') {
    bridgeReady = true;
    deliverPendingText();
  } else if (event.data?.type === 'dify-bridge-no-chat-box') {
    offerCopy(event.data.text);
  }
});

chrome.storage.sync.get('chatbotUrl', (result) => {
  show(result.chatbotUrl);
  deliverPendingText();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.chatbotUrl) show(changes.chatbotUrl.newValue);
  if (area === 'session' && changes.pendingText?.newValue) deliverPendingText();
});

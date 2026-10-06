// Runs in the Dify chat page. Acts only when the page is inside this extension's side panel.
const extensionOrigin = `chrome-extension://${chrome.runtime.id}`;

if (window.top !== window && location.ancestorOrigins[0] === extensionOrigin) {
  window.addEventListener('message', async (event) => {
    if (event.origin !== extensionOrigin || event.data?.type !== 'dify-bridge-insert') return;
    const filled = await fillChatBox(event.data.text);
    if (!filled) {
      window.parent.postMessage({ type: 'dify-bridge-no-chat-box', text: event.data.text }, extensionOrigin);
    }
  });
  window.parent.postMessage({ type: 'dify-bridge-ready' }, extensionOrigin);
}

// Dify renders the chat box after it loads, so wait up to 10 seconds for it.
async function fillChatBox(text) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const chatBox = [...document.querySelectorAll('textarea')]
      .filter((box) => !box.disabled && !box.readOnly && box.offsetParent !== null)
      .at(-1);
    if (chatBox) {
      // Dify's chat box is a controlled React textarea: set the value through the
      // native setter, then fire an input event so React updates its state.
      const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setValue.call(chatBox, chatBox.value ? `${chatBox.value}\n${text}` : text);
      chatBox.dispatchEvent(new Event('input', { bubbles: true }));
      chatBox.focus();
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

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

// The menu holds the skills in these groups.
const groups = [
  { id: 'word', title: 'Word level' },
  { id: 'sentence', title: 'Sentence level' },
  { id: 'paragraph', title: 'Paragraph level' },
];

// Each skill fills the chat box with its prompt, the selected text in place of {{query}}.
const skills = [
  {
    id: 'skill-affirmative',
    group: 'word',
    title: 'Rewrite negative to affirmative',
    prompt: 'Rewrite negative to affirmative form keeps same meaning for following paragraph:\n\n"{{query}}"',
  },
  {
    id: 'skill-strike',
    group: 'word',
    title: 'Strike through redundancy and bloat',
    prompt: 'Strike though redundancy and bloat for following paragraph:\n\n"{{query}}"',
  },
  {
    id: 'skill-emphasis',
    group: 'word',
    title: 'Bold subject, italic action',
    prompt: 'Bold subject, italic its action for phrases in following paragraph:\n\n"{{query}}"',
  },
  {
    id: 'skill-character',
    group: 'sentence',
    title: 'Central character as subject, action as verb',
    prompt: 'Central character in subject position, important action in the verb for following paragraph:\n\n"{{query}}"',
  },
  {
    id: 'skill-nominalization',
    group: 'paragraph',
    title: 'Use nominalizations effectively',
    prompt: 'Use nominalizations effectively for following paragraph:\n\n"{{query}}"',
  },
  {
    id: 'skill-cohesion',
    group: 'paragraph',
    title: 'Cohesion: old to new information',
    prompt: 'Create cohesion by organizing information across sentences from old to new for following paragraph:\n\n"{{query}}"',
  },
  {
    id: 'skill-coherence',
    group: 'paragraph',
    title: 'Coherence: consistent topics',
    prompt: 'Create coherence with consistent topics at start of sentences for following paragraph:\n\n"{{query}}"',
  },
  {
    id: 'skill-stress',
    group: 'sentence',
    title: 'Complexity in the stress position',
    prompt: 'Locate complexity at the end of sentences, in the stress position for following paragraph:\n\n"{{query}}"',
  },
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'send', title: 'Send to Dify', contexts: ['selection'] });
  chrome.contextMenus.create({
    id: 'send-selection',
    parentId: 'send',
    title: 'Selected text',
    contexts: ['selection'],
  });
  for (const { id, title } of groups) {
    chrome.contextMenus.create({ id, parentId: 'send', title, contexts: ['selection'] });
  }
  for (const { id, group, title } of skills) {
    chrome.contextMenus.create({ id, parentId: group, title, contexts: ['selection'] });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const skill = skills.find(({ id }) => id === info.menuItemId);
  if (!skill && info.menuItemId !== 'send-selection') return;
  // Open the panel first: sidePanel.open must run within the click's user gesture.
  // A click inside the side panel has no tab, and the panel is open already.
  if (tab) chrome.sidePanel.open({ windowId: tab.windowId });
  // The panel picks the text up when its chat box is ready.
  const pendingText = skill
    ? skill.prompt.replace('{{query}}', () => info.selectionText)
    : `${info.selectionText}\n\nSource: ${info.pageUrl}`;
  chrome.storage.session.set({ pendingText });
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

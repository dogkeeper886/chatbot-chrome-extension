# Chatbot Side Panel for Dify

Opens a [Dify](https://github.com/langgenius/dify) chatbot in Chrome's side panel, beside any page.

This fork continues [langgenius/chatbot-chrome-extension](https://github.com/langgenius/chatbot-chrome-extension), the "Dify Chatbot" extension that Dify's **Embed** dialog links to. That repository is archived. Its extension injects a chat bubble into each page, which causes the problems its users report: the bubble often does not appear, the chat window cannot be resized, and the page's styles can hide the chat's header.

This version shows the chatbot in Chrome's side panel instead. The panel belongs to the browser, not the page, so:

| Original problem | Side panel |
|---|---|
| The bubble often does not appear | No bubble: click the toolbar icon |
| Fixed size | Drag the panel's edge to resize it |
| Page styles and frames break the chat | The chat runs in its own panel, apart from the page |
| One chat window per page | The panel stays open across tabs and pages |

It needs Chrome 114 or later.

## Tested with

| Part | Version |
|---|---|
| Dify | 1.17.1, self-hosted with Docker Compose, served over `http://` |
| Dify app | An **Agent** app (Agents, BETA), with custom tools; ChatBot URL `http://<dify-host>/agent/<token>` |
| Chrome | 154 on Linux |

Chatbot and chatflow apps have ChatBot URLs of the form `/chatbot/<token>`. The extension shows any of these pages the same way, but only the Agent app has been tested.

## Set up

1. In Dify, open the app's **Embed** dialog, choose the Chrome extension, and copy the **ChatBot URL**. For an Agent app, the dialog is under **Access Point → Embed Into Site**.
2. In Chrome, open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and choose this folder.
3. Pin **Chatbot Side Panel for Dify** from the puzzle-piece menu, then click its icon. The first time, the side panel links to the settings page: paste the URL there and click **Save**. The panel loads the chatbot at once.

Hover over the icon to see the saved URL. To change it, right-click the icon and choose **Options**.

When you save the URL, Chrome asks to let the extension read and change data on your Dify address. Allow it for **Send to Dify**; the chatbot itself works without it. If you saved the URL before version 2.1.0, open **Options** and click **Save** once more to grant that access. When the URL moves to another host, the extension gives up its access to the earlier one.

## Send to Dify

Select text on any page, right-click it, and open **Send to Dify**. Choose **Selected text**, and the side panel opens with the text and its page URL in the chat box. Read it, edit it if needed, and press Enter: the extension never sends a message for you.

The same menu lists skills, under **Word level**, **Sentence level** and **Paragraph level**. A skill puts its prompt in the chat box, with the selected text in the prompt's `{{query}}` place:

| Level | Skill | Prompt |
|---|---|---|
| Word | **Rewrite negative to affirmative** | Rewrite negative to affirmative form keeps same meaning for following paragraph: |
| Word | **Strike through redundancy and bloat** | Strike though redundancy and bloat for following paragraph: |
| Word | **Bold subject, italic action** | Bold subject, italic its action for phrases in following paragraph: |
| Sentence | **Central character as subject, action as verb** | Central character in subject position, important action in the verb for following paragraph: |
| Sentence | **Complexity in the stress position** | Locate complexity at the end of sentences, in the stress position for following paragraph: |
| Paragraph | **Use nominalizations effectively** | Use nominalizations effectively for following paragraph: |
| Paragraph | **Cohesion: old to new information** | Create cohesion by organizing information across sentences from old to new for following paragraph: |
| Paragraph | **Coherence: consistent topics** | Create coherence with consistent topics at start of sentences for following paragraph: |

The skills are the `skills` list in `background.js`, and `groups` holds the three levels.

If the extension cannot reach the chat box, for example without access to the Dify address, the panel offers the text to copy instead.

## How it works

| File | Role |
|---|---|
| `manifest.json` | Manifest V3; permissions `sidePanel`, `storage`, `contextMenus` and `scripting`; the Dify address as an optional host permission |
| `background.js` | Opens the side panel when you click the icon; shows the saved ChatBot URL in the icon's tooltip; adds **Send to Dify** and its skills to the right-click menu; registers `dify-bridge.js` for the saved URL's address, and gives up access to an earlier one |
| `panel.html`, `panel.js` | The side panel: an iframe of the saved ChatBot URL; passes sent text to the chat page |
| `dify-bridge.js` | Runs in the Dify chat page inside the side panel, and fills its chat box |
| `options.html`, `options.js` | Saves the ChatBot URL in `chrome.storage.sync` under `chatbotUrl`, the original extension's key, and asks for access to its address |

Dify's chat pages can be shown in an iframe, so the extension needs no header rules.

Dify offers no way to put text in its chat box from outside: its `postMessage` messages only toggle the expand button. So `dify-bridge.js` runs in the chat page, as [insidebar-ai](https://github.com/xiaolai/insidebar-ai) does for other chat sites. A Dify server can have any address, so the script is registered at runtime with `chrome.scripting.registerContentScripts`, for the saved URL's address only. Chrome can drop such registrations, as when the extension reloads, so the service worker registers the script again each time it starts. It acts only inside this extension's side panel. Dify's chat box is a controlled React textarea, so the script sets its value through the native setter and fires an `input` event. It skips the hidden textarea that `react-textarea-autosize` adds to measure text height. The structure follows [chatgpt-panel-chrome-extension](https://github.com/PeterPorzuczek/chatgpt-panel-chrome-extension) (MIT).

## License

The code from the side panel rewrite onward is under the [MIT License](LICENSE). The upstream repository has no license, so the files in the commits before the rewrite remain with their original authors, listed in `AUTHORERS`. The rewrite contains none of that code.

This project is not affiliated with Dify or LangGenius.

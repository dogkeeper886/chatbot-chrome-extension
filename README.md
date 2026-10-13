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

## How it works

| File | Role |
|---|---|
| `manifest.json` | Manifest V3; permissions `sidePanel` and `storage` |
| `background.js` | Opens the side panel when you click the icon, and shows the saved ChatBot URL in the icon's tooltip |
| `panel.html`, `panel.js` | The side panel: an iframe of the saved ChatBot URL |
| `options.html`, `options.js` | Saves the ChatBot URL in `chrome.storage.sync` under `chatbotUrl`, the original extension's key |

Dify's chat pages can be shown in an iframe, so the extension needs no header rules and no host permissions. The structure follows [chatgpt-panel-chrome-extension](https://github.com/PeterPorzuczek/chatgpt-panel-chrome-extension) (MIT).

## License

The code from the side panel rewrite onward is under the [MIT License](LICENSE). The upstream repository has no license, so the files in the commits before the rewrite remain with their original authors, listed in `AUTHORERS`. The rewrite contains none of that code.

This project is not affiliated with Dify or LangGenius.

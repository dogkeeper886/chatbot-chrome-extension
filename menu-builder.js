// Builds the right-click menu from the menu folder, then closes its tab. The service worker
// opens this page when the extension installs or reloads: only a page can list the
// extension's own folders.
//
// - A folder is a submenu; a .md file is an item that fills the chat box with its text.
// - A number and a space before a name set the order and stay out of the title,
//   so "2 Word level" shows as "Word level". Names without a number sort by name.
// - In a file's text, {{query}} stands for the selected text and {{url}} for the page's address.
const readFolder = (folder) => new Promise((resolve, reject) => folder.createReader().readEntries(resolve, reject));

// Each item's id is its path, such as 'menu/Send to Dify/1 Selected text.md'.
async function addItems(folder, path, parentId) {
  const entries = (await readFolder(folder))
    .filter((entry) => entry.isDirectory || entry.name.endsWith('.md'))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
  for (const entry of entries) {
    const id = `${path}/${entry.name}`;
    const title = entry.name.replace(/^\d+ /, '').replace(/\.md$/, '');
    await new Promise((resolve) => chrome.contextMenus.create({ id, parentId, title, contexts: ['selection'] }, resolve));
    if (entry.isDirectory) await addItems(entry, id, id);
  }
}

chrome.runtime.getPackageDirectoryEntry((root) =>
  root.getDirectory('menu', {}, async (menu) => {
    await chrome.contextMenus.removeAll();
    await addItems(menu, 'menu');
    window.close();
  }),
);

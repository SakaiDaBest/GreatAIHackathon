console.log("AIvengers Extension Starting...");

// On install: add context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "aivengers-fact-check",
    title: "⚡ AIvengers Assemble! Fact-Check This",
    contexts: ["selection"]
  });
  console.log("AIvengers extension assembled and ready to fight fake news!");
});

// --- Helper: inject selected text into analyzer site ---
function injectAndAnalyze(tabId, text) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (selectedText) => {
      window.addEventListener("load", () => {
        const textarea = document.querySelector("#newsText");
        if (textarea) {
          textarea.value = selectedText;
        }
        const form = document.querySelector("#newsForm");
        if (form) {
          form.requestSubmit(); // auto-submit
        }
      });
    },
    args: [text]
  });
}

// --- Context Menu Handler (Right Click) ---
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "aivengers-fact-check" && info.selectionText) {
    const selectedText = info.selectionText.trim();

    if (selectedText.length > 0) {
      const websiteUrl = "https://d30hw8svzk5x6g.cloudfront.net/";

      // Open analyzer site
      chrome.tabs.create({ url: websiteUrl, active: true }, (newTab) => {
        injectAndAnalyze(newTab.id, selectedText);
      });

      // Analytics counter
      chrome.storage.local.get(['factsChecked'], (result) => {
        const count = (result.factsChecked || 0) + 1;
        chrome.storage.local.set({ factsChecked: count });
      });
    } else {
      // Badge error if no text
      chrome.action.setBadgeText({ text: "!", tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: "", tabId: tab.id });
      }, 2000);
    }
  }
});

// --- Keyboard Shortcut Handler (Ctrl+Shift+A) ---
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "fact-check-selection") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    try {
      // Get highlighted text from current page
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const selection = window.getSelection();
          return selection ? selection.toString().trim() : '';
        }
      });

      const selectedText = results[0].result;

      if (selectedText && selectedText.length > 0) {
        const websiteUrl = "https://d30hw8svzk5x6g.cloudfront.net/";

        // Open analyzer site
        chrome.tabs.create({ url: websiteUrl, active: true }, (newTab) => {
          injectAndAnalyze(newTab.id, selectedText);
        });

        // Analytics counter
        chrome.storage.local.get(['factsChecked'], (result) => {
          const count = (result.factsChecked || 0) + 1;
          chrome.storage.local.set({ factsChecked: count });
        });
      } else {
        // Badge error if no text
        chrome.action.setBadgeText({ text: "?", tabId: tab.id });
        setTimeout(() => {
          chrome.action.setBadgeText({ text: "", tabId: tab.id });
        }, 2000);
      }
    } catch (error) {
      console.error("AIvengers keyboard shortcut error:", error);
    }
  }
});

// --- Reset badge when tabs reload ---
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    chrome.action.setBadgeText({ text: "", tabId });
  }
});

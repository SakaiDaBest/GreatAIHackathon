
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item
  chrome.contextMenus.create({
    "id": "aivengers-analyze",
    "title": "⚡ AIvengers Assemble! Fact-Check This",
    "contexts": ["selection"]
  });
  
  console.log("AIvengers extension assembled and ready to fight fake news!");
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "aivengers-analyze" && info.selectionText) {
    // Inject content script to show popup
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: showAIvengersPopup,
      args: [info.selectionText]
    });
  }
});

// Function to be injected into the page
function showAIvengersPopup(selectedText) {
  // Create and show the analysis popup
  window.postMessage({
    type: 'AIVENGERS_ANALYZE',
    text: selectedText
  }, '*');
}
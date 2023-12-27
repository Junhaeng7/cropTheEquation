chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureTab") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      sendResponse({ dataUrl: dataUrl });
    });
    return true; // Important to keep the message channel open
  }
});

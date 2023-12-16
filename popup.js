document
  .getElementById("openScreenshotBox")
  .addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];
      chrome.tabs.captureVisibleTab(
        null,
        { format: "png" },
        function (dataUrl) {
          // Send this dataUrl to a content script to be displayed
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            code: 'showScreenshot("' + dataUrl + '");',
          });
        }
      );
    });
  });

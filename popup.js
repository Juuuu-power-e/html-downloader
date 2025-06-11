document.getElementById('downloadBtn').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractAndDownloadArticle
    });
  });
});

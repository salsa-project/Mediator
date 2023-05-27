// Popup script

// Function to handle the download button click event
function handleDownloadClick() {
  // Send a message to the content script to download the last message
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "initiateDownload" });
  });
}

// Add a click event listener to the download button
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("downloadButton").addEventListener("click", handleDownloadClick);
});

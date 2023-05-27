// This script gets injected into any opened page
// whose URL matches the pattern defined in the manifest
// (see "content_script" key).
// Several foreground scripts can be declared
// and injected into the same or different pages.

console.log("This prints to the console of the page (injected only if the page url matched)")


// Content script

// Function to download the last message
function downloadLastMessage() {
  // Retrieve the chat container element
  let chatContainer = document.querySelector("#__next > div.overflow-hidden.w-full.h-full.relative.flex.z-0 > div.relative.flex.h-full.max-w-full.flex-1.overflow-hidden > div > main > div.flex-1.overflow-hidden > div > div > div");

  // Retrieve the index of the last message
  let lastMessageIndex = chatContainer.childNodes.length - 2;

  // Retrieve the last message element
  let lastMessage = chatContainer.childNodes[lastMessageIndex];

  // Extract the message content
  let messageContent = lastMessage.textContent;

  // Perform the download action here with the extracted message content
  console.log("Download Last Message:", messageContent);
}

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "initiateDownload") {
    downloadLastMessage();
  }
});

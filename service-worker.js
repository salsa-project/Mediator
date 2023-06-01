// This is the service worker script, which executes in its own context
// when the extension is installed or refreshed (or when you access its console).
// It would correspond to the background script in chrome extensions v2.

console.log("This prints to the console of the service worker (background script)")

// Importing and using functionality from external files is also possible.
importScripts('service-worker-utils.js')

// If you want to import a file that is deeper in the file hierarchy of your
// extension, simply do `importScripts('path/to/file.js')`.
// The path should be relative to the file `manifest.json`.


// Background script

// Constants for tab URLs
const CHATGPT_TAB_URL = "https://chat.openai.com/";
const BARD_TAB_URL = "https://bard.google.com/";

// Variables to store the tab IDs
let chatGPTTabId = null;
let bardTabId = null;

// Function to send a message to a specific tab
function sendMessageToTab(tabId, message) {
  chrome.tabs.sendMessage(tabId, message);
}

// Function to handle incoming messages from content scripts
function handleIncomingMessage(message, sender, sendResponse) {
  // Process the incoming message based on its content

  switch (message.action) {
    case "chatGPTLastMessage":
      console.log("Received ChatGPT Last Message:", message.payload.lastMessage);
      
      // Send the message to the Bard tab
      sendMessageToTab(bardTabId, {
        action: "receiveMessage",
        payload: {
          message: message.payload.lastMessage
        }
      });
      break;


    case "bardLastMessage":
      console.log("Received Bard Last Message:", message.payload.lastMessage);

      // Send the message to the chatGPT tab
      sendMessageToTab(chatGPTTabId, {
        action: "receiveMessage",
        payload: {
          message: message.payload.lastMessage
        }
      });
      break;

    default:
      console.log("Unknown message action:", message.action);
  }
}

// Function to handle tab updates
function handleTabUpdate(tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    // Check if the tab is the ChatGPT tab
    if (tab.url.startsWith(CHATGPT_TAB_URL)) {
      chatGPTTabId = tabId;
      console.log("ChatGPT tab ID:", chatGPTTabId);
    }
    // Check if the tab is the Bard tab
    else if (tab.url.startsWith(BARD_TAB_URL)) {
      bardTabId = tabId;
      console.log("Bard tab ID:", bardTabId);
    }
  }
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(handleIncomingMessage);

// Listen for tab updates
chrome.tabs.onUpdated.addListener(handleTabUpdate);


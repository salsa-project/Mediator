// Background script

// Constants for tab URLs
const CHATGPT_TAB_URL = "https://chat.openai.com/";
const BARD_TAB_URL = "https://bard.google.com/";
// Variables to store the tab IDs
let chatGPTTabId = null;
let bardTabId = null;

/***********************************

        Send Message To Tab

***********************************/
// Function to send a message to a specific tab
function sendMessageToTab(tabId, message) {
  if (tabId === null) {
    // Wait for tabId to be available
    setTimeout(() => sendMessageToTab(tabId, message), 500);
  } else {
    chrome.tabs.sendMessage(tabId, message);
  }
}
/***********************************

          Incoming Message

***********************************/
// Function to handle incoming messages from content scripts
function handleIncomingMessage(message, sender, sendResponse) {
  // Process the incoming message based on its content
  switch (message.action) {
    case "chatGPTLastMessage":
      // Send the message to the Bard tab
      sendMessageToTab(bardTabId, {
        action: "receiveMessage",
        payload: {
          message: message.payload.lastMessage
        }
      });
      break;
    case "bardLastMessage":
      // Send the message to the chatGPT tab
      sendMessageToTab(chatGPTTabId, {
        action: "receiveMessage",
        payload: {
          message: message.payload.lastMessage
        }
      });
      break;
    default: console.log("Unknown message action:", message.action);
  }
}
/***********************************

          Tab Update

***********************************/
// Function to handle tab updates
function handleTabUpdate(tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    // Check if the tab is the ChatGPT tab
    if (tab.url.startsWith(CHATGPT_TAB_URL)) {
      chatGPTTabId = tabId;
    }
    // Check if the tab is the Bard tab
    else if (tab.url.startsWith(BARD_TAB_URL)) {
      bardTabId = tabId;
    }
  }
}
/***********************************

      Handle Received Messages
      Handle Tab Update

***********************************/
// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(handleIncomingMessage);

// Listen for tab updates
chrome.tabs.onUpdated.addListener(handleTabUpdate);


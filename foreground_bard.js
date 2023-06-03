/***********************************

        CHAT BODY CONTAINER
              DETECTOR

***********************************/
let chatBody = null;
let markdownsCounter = null;
let messagesLastCount = 0;

function startChatBodyObserver() {
  const chatBodyObserver = new MutationObserver((mutationsList, observer) => {
    chatBody = document.querySelector(".chat-history.ng-tns-c586583937-1.ng-star-inserted");
    if (chatBody) {
      observer.disconnect();
      recursiveUntilCount();
    }
  });
  
  chatBodyObserver.observe(document.body, { childList: true, subtree: true });
}
function recursiveUntilCount() {
  const intervalId = setInterval(() => {
    markdownsCounter= chatBody?.getElementsByClassName('markdown')?.length;
    // Check the condition
    if (markdownsCounter >= 0) {
      // Set messages counter initial state
      messagesLastCount = markdownsCounter;
      // Clear the interval to stop further executions
      clearInterval(intervalId);
    }
  }, 500); // Adjust the interval time as needed
}
startChatBodyObserver();

/***********************************

        New Message Detector

***********************************/
const checkForNewMessages = () => {
  markdownsCounter= chatBody?.getElementsByClassName('markdown')?.length;
  // Check if chat body is rendered or if there are new messages
  if (!chatBody) return;
  if(!markdownsCounter || !messagesLastCount) return;
  if (markdownsCounter === messagesLastCount) return;
  // Retrieve the last message
  const lastMessage = getLastMessage(chatBody);
  // Send the last message to the background script
  sendMessage("bardLastMessage", lastMessage);
  // Update messagesLastCount
  messagesLastCount = markdownsCounter;
};

// Call the checkForNewMessages function periodically
setInterval(checkForNewMessages, 500);

/***********************************

        GET LAST MESSAGE

***********************************/
// Function to retrieve the last message
function getLastMessage(chatBody) {
  const chatBodyMarkdowns = chatBody?.getElementsByClassName('markdown');
  const lastMessage = chatBodyMarkdowns[chatBodyMarkdowns.length - 1]?.textContent || "Bard Chat : Standard Message..";
  return lastMessage;
}

/***********************************

            SEND MESSAGE

***********************************/
function sendMessage(action, message){
  chrome.runtime.sendMessage({
    action: action,
    payload: {
      lastMessage: message,
    },
  });
}

/***********************************

        RECEIVE MESSAGE

***********************************/
// Function to handle receiving messages from the background script
function receiveMessage(message) {
  const receivedMessage = message.payload.message;
  console.log(receivedMessage)
}

/***********************************

      Handle Received Messages

***********************************/
// Add a listener for messages from the background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "receiveMessage") {
    receiveMessage(message);
  }
});

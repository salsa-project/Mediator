console.log("This prints to the console of Bard")

/***********************************

        CHAT BODY CONTAINER
              DETECTOR

***********************************/
// Create a new MutationObserver instance
const observer = new MutationObserver((mutationsList, observer) => {
  // Chat body container XPath
  const chatBodyXPath = '/html/body/chat-app/side-navigation/mat-sidenav-container/mat-sidenav-content/main/chat-window/div[1]/div[1]/div';
  const chatBody = document.evaluate(chatBodyXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  
  if (chatBody) {
    // Disconnect the observer once the element is rendered
    observer.disconnect();
    // Call the callback function when the chat body is rendered
    console.log(chatBody)
    callback(chatBody);
  }
});

// Start observing mutations on the document body
observer.observe(document.body, { childList: true, subtree: true });

/***********************************

        GET LAST MESSAGE

***********************************/
// Function to retrieve the last message
function getLastMessage(chatBody) {
  const chatBodyMarkdowns = chatBody.getElementsByClassName('markdown');
  const lastMessage = /*chatBodyMarkdowns[chatBodyMarkdowns.length-1].textContent ||*/ "Bard Chat: No Conversation Yet..";
  
  return lastMessage;
}

/***********************************

              CALLBACK

***********************************/
// Callback function to perform actions after the chat body is found
function callback(chatBody) {
  const result = getLastMessage(chatBody);
  console.log(result);
  
  // Send the last message to the background script
  chrome.runtime.sendMessage({
    action: "bardLastMessage",
    payload: {
      lastMessage: result
    }
  });
}

/***********************************

       RECEIVE MESSAGE FUNCTION              

***********************************/
// Function to handle receiving messages from ChatGPT
function receiveMessage(message) {
  const receivedMessage = message.payload.message;
  console.log("Received message from ChatGPT:", receivedMessage);
}

// Add a listener for messages from the background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "receiveMessage") {
    receiveMessage(message);
  }else if(message.action === "testMsg") {
    receiveMessage(message);
  }
});


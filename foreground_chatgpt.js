console.log("This prints to the console of chatGPT")


// Chat body container XPath
const chatBodyXPath = '//*[@id="__next"]/div[2]/div[2]/div/main/div[2]/div/div/div';
let chatBodyElement = null;
let messagesCounter  = 0;
/***********************************

        CHAT BODY CONTAINER
              DETECTOR

***********************************/
// Create a new MutationObserver instance
const chatBodyObserver = new MutationObserver((mutationsList, observer) => {
  chatBodyElement = document.evaluate(chatBodyXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (chatBodyElement) {
    // Disconnect the observer once the element is rendered
    observer.disconnect();
    // Call the callback function when the chat body is rendered
    callback(chatBodyElement);
  }
});

// Start observing mutations on the document body
chatBodyObserver.observe(document.body, { childList: true, subtree: true });

/***********************************

        GET LAST MESSAGE

***********************************/
// Function to retrieve the last message
function getLastMessage(chatBody) {
  const chatBodyMarkdowns = chatBody.getElementsByClassName('markdown');
  const lastMessage = chatBodyMarkdowns[chatBodyMarkdowns.length - 1].textContent || "Bard Chat: No Conversation Yet..";
  
  return lastMessage;
}

/***********************************

              CALLBACK

***********************************/
// Callback function to perform actions after the chat body is rendered
function callback(chatBody) {
  console.log(chatBody)
  /*
  const lastMessage = getLastMessage(chatBody);
  // Send the last message to the background script
  chrome.runtime.sendMessage({
    action: "chatGPTLastMessage",
    payload: {
      lastMessage: lastMessage
    }
  });
  */
}

/***********************************

       RECEIVE MESSAGE FUNCTION

***********************************/
// Function to handle receiving messages from the background script
function receiveMessage(message) {
  const receivedMessage = message.payload.message;
  console.log("Received message from background script:", receivedMessage);
}

// Add a listener for messages from the background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "receiveMessage") {
    receiveMessage(message);
  }
});

/***********************************

        New Message Detector

***********************************/
// Create a new MutationObserver instance
setInterval(()=>{
  if(chatBodyElement == null) return;
    console.log("chatBodyElement: ",chatBodyElement.childNodes.length)


}, 1000)





// =======================
//          SETUP
// =======================

// Variables initialization
let chatBody = null;
let textAreaPromptField = null;
let sendPromptBtn = null;

let isConversationOn = new ValueWatcher(false);
let lastMessage = new ValueWatcher('');

isConversationOn.onAfterSet= function(newVal){
  if(newVal){
    chrome.runtime.sendMessage({action: "readyForConversation", payload: {name: "bard", isReady: true}});
  }else{
    chrome.runtime.sendMessage({action: "readyForConversation", payload: {name: "bard", isReady: false}});
  }
}

// Define a callback function to be executed after the value of `lastMessage` is set
lastMessage.onAfterSet = function(newVal){
  // check conversation on/off
  isReadyForConversation(newVal)

  if(isConversationOn.getValue()) {
    console.log(newVal)
    // forward message to chatgpt
    //sendMessage("toChatGPT", newVal);
  }
  
}
// =======================
//       CHAT BODY
//   CONTAINER DETECTOR
// =======================

// Function to observe changes in the body and detect the chat body container
function bodyObserver(){
  const observer = new MutationObserver((mutationsList, observer) => {
    chatBody = document.querySelector('[data-test-id="chat-history-container"]');
    // Check if the chat body container is found and valid
    if(isElementValid(chatBody).html().check) {
      observer.disconnect();
      chatObserver(); // Call the chatObserver function
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
bodyObserver();

// =======================
//   New Message Detector
// =======================

// Function to observe changes in the chat body container and detect new messages
function chatObserver(){
  const observer = new MutationObserver((mutationsList, observer) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        const newChild = mutation.addedNodes[0];
        // Check if the newChild is a valid response with content
        if(newChild.childNodes.length != 3) return;
        setTimeout(()=>{
          // Get the last response markdown
          chatResponse = newChild.querySelector('.presented-response-container').getElementsByClassName('markdown');
          lastMessage.setValue(chatResponse[chatResponse.length-1].textContent)
        },200)

      }
    });
  });
  observer.observe(chatBody, { childList: true });
}

// =======================
//     SEND MESSAGE
// =======================

// Function to send a message to the background script
function sendMessage(action, message){
  chrome.runtime.sendMessage({
    action: action,
    payload: {
      lastMessage: message,
    },
  });
}


// =======================
//    Received Messages
// =======================
// Add a listener for messages from the background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log(message)
  switch (message.action) {
    case "setup":
      setupConversationHandler(message)
    break;

    case "fromChatGPT":
      sendPrompt(message.payload.message);
      console.log(message.payload.message);
    break;

    case "startFirst":
      sendPrompt(message.payload);
      console.log(message.payload);
      break;

    default: console.log("Something Went Wrong...........")
  }
});

// =======================
// RECEIVE MESSAGE HANDLERS
// =======================
// Function to handle receiving messages from the background script
function setupConversationHandler(message) {
  const receivedMessage = message.payload.message;
  // get bard rules only
  const rules = receivedMessage.setup.find((item) => item.name === "bard").rules;
  // extract data
  const topic = "Topic: " + receivedMessage.topic + "\n\n" || "Topic: Any Random Topic in ai and Web developement Field \n\n";
  const commonRules = rules[0];
  const roleRules = rules[1];
  // prompt it
  sendPrompt(`${topic} \n ${commonRules} \n ${roleRules}`)
  console.log(`${topic} \n ${commonRules} \n ${roleRules}`)
}

// =======================
// isReady sign check(<<..>>)
// =======================
function isReadyForConversation(message){
  // Define the regex pattern to check
  const startSentance = "mediator link me please";
  const endSentance = "mediator cut the link please";

  if (message.includes(startSentance)) {
    isConversationOn.setValue(true);
    console.log("The startSentance is found in the last message", isConversationOn.getValue());
  }
  if (message.includes(endSentance)) {
    isConversationOn.setValue(false);
    console.log("The endSentance is found in the last message", isConversationOn.getValue());
  }
}

// =======================
//      SEND PROMPT
// =======================
// Function to send a prompt to the chat input field
function sendPrompt(content){
  // Assign the textarea and send button elements
  textAreaPromptField = document.getElementsByTagName('textarea')[0];
  sendPromptBtn = document.getElementsByClassName("send-button-container")[0].getElementsByTagName('button')[0];
  emulatePaste(textAreaPromptField, content)
  sendPromptBtn.click();
  console.log('setup sent successfuly..')
}

// Function to emulate a paste operation into a textarea
function emulatePaste(textarea, content) {
  // FIX textarea
  // Set the selection range at the end of the textarea's content
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  // Insert the content at the current cursor position
  document.execCommand('insertText', false, content);
}

// =======================
//    is Element Valid
// =======================

// Function to check the validity and nature of an element
function isElementValid(element, expectedNature, checkArrayElements = false) {
  const validator = {
    check: false,
    message: '',
    array() {
      this.check = Array.isArray(element);
      this.message = 'Element is an array';
      return this;
    },
    undefined() {
      this.check = typeof element === 'undefined';
      this.message = 'Element is undefined';
      return this;
    },
    null() {
      this.check = element === null;
      this.message = 'Element is null';
      return this;
    },
    string() {
      this.check = typeof element === 'string';
      this.message ='Element is a string';
      return this;
    },
    number() {
      this.check = typeof element === 'number';
      this.message = 'Element is a number';
      return this;
    },
    object() {
      this.check = typeof element === 'object' && element !== null;
      this.message = 'Element is an object';
      return this;
    },
    boolean() {
      this.check = typeof element === 'boolean';
      this.message = 'Element is a boolean';
      return this;
    },
    html() {
      this.check = element instanceof HTMLElement;
      this.message = 'HTML element';
      return this;
    },
  };

  if (checkArrayElements && Array.isArray(element)) {
    for (const item of element) {
      if (item === undefined || item === null) {
        validator.check = true;
        validator.message = 'Element contains undefined or null values';
        return validator;
      }
    }
    validator.check = false;
    validator.message = 'All elements are defined and non-null';
    return validator;
  }

  if (expectedNature && typeof validator[expectedNature] === 'function') {
    return validator[expectedNature]();
  }

  validator.message = 'Unexpected nature';
  return validator;
}

// =======================
//     Value Watcher
// =======================

// Constructor function for watching changes in a value
function ValueWatcher(value) {
  this.onBeforeSet = function() {};
  this.onAfterSet = function() {};

  this.setValue = function(newVal) {
      this.onBeforeSet(value, newVal);
      value = newVal;
      this.onAfterSet(newVal);
  };

  this.getValue = function() {
    return value;
  };
}

// =======================
//     count Words
// =======================
// for bard max length is: 800~1000 words || 4000 character
function countWords(text) {
  // Remove leading and trailing whitespaces
  text = text.trim();

  // Split the string into words using whitespace as the delimiter
  const words = text.split(/\s+/);

  // Return the number of words
  return words.length;
}
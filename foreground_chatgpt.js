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
    chrome.runtime.sendMessage({action: "readyForConversation", payload: {name: "chatgpt", isReady: true}});
  }else{
    chrome.runtime.sendMessage({action: "readyForConversation", payload: {name: "chatgpt", isReady: false}});
  }
}

// Define a callback function to be executed after the value of `lastMessage` is set
lastMessage.onAfterSet = function(newVal){
  // check conversation on/off
  isReadyForConversation(newVal)

  if(isConversationOn.getValue()) {
    console.log(newVal)
    // forward message to BARD
    //sendMessage("toBard", newVal);
  }
  
}

// =======================
//       CHAT BODY
//   CONTAINER DETECTOR
// =======================

// Observer function to detect the presence of the chat body container in the DOM
function bodyObserver(){
  const observer = new MutationObserver((mutationsList, observer) => {
    // Look for the chat body container element
    chatBody = document.querySelector('.flex.flex-col.text-sm.dark\\:bg-gray-800');
    if(isElementValid(chatBody).html().check){
      observer.disconnect();
      // Once the chat body container is found, start observing new messages
      chatObserver();
    }
  });
  // Observe changes in the body of the document
  observer.observe(document.body, { childList: true, subtree: true });
}
// TODO > wake up body observer only after clicking on the addon/extension (its like: waking up/starting the extension)
// Call the bodyObserver function to start observing the chat body container
bodyObserver();

// =======================
//   New Message Detector
// =======================

// Observer function to detect new messages in the chat
function chatObserver(){
  const observer = new MutationObserver((mutationsList, observer) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Get the newly added child element (message)
        const newChild = mutation.addedNodes[0];
        // Check if the message has the "markdown" class
        const newChildMarkdown = newChild?.getElementsByClassName("markdown");
        if(!isElementValid(newChildMarkdown[0]).html().check) return;
        const isStreamDone = setInterval(()=>{
          // Check if the message is still being streamed (incomplete)
          if(newChildMarkdown[0].classList.contains('result-streaming')) return;
          clearInterval(isStreamDone)
          // Set the value of `lastMessage` to the content of the new message
          lastMessage.setValue(newChild?.getElementsByClassName("markdown")[0].textContent)
        },500)
      }
    });
  });
  // Observe changes in the chat body container
  observer.observe(chatBody, { childList: true });
}

// =======================
//     SEND MESSAGE
// =======================

// Function to send a message to the background script
function sendMessage(action, message) {
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
  switch (message.action) {
    case "setup":
      setupConversationHandler(message)
      break;

    case "fromBard":
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
  console.log(message)
  const receivedMessage = message.payload.message;
  // get chatgpt rules only
  const rules = receivedMessage.setup.find((item) => item.name === "chatgpt").rules;
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
  textAreaPromptField = document.getElementById('prompt-textarea');
  sendPromptBtn = document.querySelector('.absolute.p-1.rounded-md.md\\:bottom-3.md\\:p-2.md\\:right-3.dark\\:hover\\:bg-gray-900.dark\\:disabled\\:hover\\:bg-transparent.right-2.disabled\\:text-gray-400.enabled\\:bg-brand-purple.text-white.bottom-1\\.5.transition-colors.disabled\\:opacity-40');
  emulatePaste(textAreaPromptField, content)
  sendPromptBtn.click();
  console.log('setup sent successfuly..')
}

// Function to emulate a paste operation into a textarea
function emulatePaste(textarea, content) {
  // Set the selection range at the end of the textarea's content
  // FIX textarea
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
// Constructor function to watch for changes in a value
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
// for chatgpt3 max length is: 700~800 words
function countWords(text) {
  // Remove leading and trailing whitespaces
  text = text.trim();

  // Split the string into words using whitespace as the delimiter
  const words = text.split(/\s+/);

  // Return the number of words
  return words.length;
}

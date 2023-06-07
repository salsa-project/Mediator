// =======================
//          SETUP
// =======================

// Variables initialization
let chatBody = null;
let textAreaPromptField = null;
let sendPromptBtn = null;
let lastMessage = new ValueWatcher('');

// Define a callback function to be executed after the value of `lastMessage` is set
lastMessage.onAfterSet = function(newVal){
  console.log(newVal)
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
        // Assign the textarea and send button elements
        textAreaPromptField = document.getElementById('prompt-textarea');
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
//       RECEIVE MESSAGE
// =======================

// Function to handle receiving messages from the background script
function receiveMessage(message) {
  const receivedMessage = message.payload.message;
  console.log(receivedMessage)
}

// =======================
// Handle Received Messages
// =======================

// Add a listener for messages from the background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "receiveMessage") {
    receiveMessage(message);
  }
});

// =======================
//      SEND PROMPT
// =======================

// Function to send a prompt to the chat input field
function sendPrompt(content){
  sendPromptBtn = document.querySelector('.absolute.p-1.rounded-md.md\\:bottom-3.md\\:p-2.md\\:right-3.dark\\:hover\\:bg-gray-900.dark\\:disabled\\:hover\\:bg-transparent.right-2.disabled\\:text-gray-400.enabled\\:bg-brand-purple.text-white.bottom-1\\.5.transition-colors.disabled\\:opacity-40');
  emulatePaste(textAreaPromptField, content)
  sendPromptBtn.click();
}

// Function to emulate a paste operation into a textarea
function emulatePaste(textarea, content) {
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

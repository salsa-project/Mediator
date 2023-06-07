// =======================
//          SETUP
// =======================

// Variables initialization
let chatBody = null;
let textAreaPromptField = null;
let sendPromptBtn = null;
let lastMessage = new ValueWatcher('');

// Callback function executed after setting the lastMessage value
lastMessage.onAfterSet = function(newVal){
  console.log(newVal)
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
          // Assign the textarea and send button elements
          textAreaPromptField = document.getElementsByTagName('textarea')[0];
          sendPromptBtn = document.getElementsByClassName("send-button-container")[0].getElementsByTagName('button')[0];
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

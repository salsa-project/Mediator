/***********************************

                SETUP

***********************************/
const bardStandardMsg = 'Bard Chat : Standard Message..';
let chatBody = null;
let presentedResponseContainer = null;
let markdownsCounter = new ValueWatcher(0);
//TO REMOVE
let messagesLastCount = 0;

markdownsCounter.onAfterSet = function(){
  console.log('New Message Detected..')
}

/***********************************

        CHAT BODY CONTAINER
              DETECTOR

***********************************/
function startChatBodyObserver() {
  const chatBodyObserver = new MutationObserver((mutationsList, observer) => {
    chatBody = document.querySelector(".chat-history.ng-tns-c586583937-1.ng-star-inserted");
    if (isElementValid(chatBody).html().check) {
      observer.disconnect();
      recursiveUntilCount();
    }
  });
  chatBodyObserver.observe(document.body, { childList: true, subtree: true });
}
function recursiveUntilCount() {
    markdownsCounter.setValue(chatBody.getElementsByClassName('markdown').length);
    // Set messages counter initial state
    //TO REMOVE
    messagesLastCount = markdownsCounter; 
}
startChatBodyObserver();

/***********************************

        New Message Detector

***********************************/
const checkForNewMessages = () => {
  presentedResponseContainer = document.getElementsByClassName('presented-response-container');
  if(!presentedResponseContainer) return;
  markdownsCounter.setValue(presentedResponseContainer?.length);
  console.log(markdownsCounter.getValue())
  // Check if chat body is rendered or if there are new messages
  if (!chatBody) return;
  if(markdownsCounter == null || messagesLastCount == null) return;
  if (markdownsCounter === messagesLastCount) return;
  
  // Retrieve the last message
  const lastMessage = getLastMessage(presentedResponseContainer);
  console.log(lastMessage)
  if(lastMessage.includes(bardStandardMsg)) return;
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
function getLastMessage(presentedResponsesContainer) {
  const chatBodyMarkdowns = presentedResponsesContainer[presentedResponsesContainer.length-1]?.getElementsByClassName('markdown');
  const lastMessage = chatBodyMarkdowns[0]?.textContent || bardStandardMsg;
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


/***********************************

         is Element Valid

***********************************/
function isElementValid(element, expectedNature, checkArrayElements = false) {
  const validator = {
    check: false,
    log: '',
    array() {
      this.check = Array.isArray(element);
      this.log = console.log('Element is an array');
      return this;
    },
    undefined() {
      this.check = typeof element === 'undefined';
      this.log = console.log('Element is undefined');
      return this;
    },
    null() {
      this.check = element === null;
      this.log = console.log('Element is null');
      return this;
    },
    string() {
      this.check = typeof element === 'string';
      this.log = console.log('Element is a string');
      return this;
    },
    number() {
      this.check = typeof element === 'number';
      this.log = console.log('Element is a number');
      return this;
    },
    object() {
      this.check = typeof element === 'object' && element !== null;
      this.log = console.log('Element is an object');
      return this;
    },
    boolean() {
      this.check = typeof element === 'boolean';
      this.log = console.log('Element is a boolean');
      return this;
    },
    html() {
      this.check = element instanceof HTMLElement;
      this.log = console.log('HTML element');
      return this;
    },
  };

  if (checkArrayElements && Array.isArray(element)) {
    for (const item of element) {
      if (item === undefined || item === null) {
        validator.check = true;
        validator.log = console.log('Element contains undefined or null values');
        return validator;
      }
    }
    validator.check = false;
    validator.log = console.log('All elements are defined and non-null');
    return validator;
  }

  if (expectedNature && typeof validator[expectedNature] === 'function') {
    return validator[expectedNature]();
  }

  validator.log = console.log('Unexpected nature');
  return validator;
}

/***********************************

          Value Watcher

***********************************/
function ValueWatcher(value) {
  this.onBeforeSet = function() {};
  this.onAfterSet = function() {};

  this.setValue = function(newVal) {
    if (value !== newVal) {
      this.onBeforeSet(value, newVal);
      value = newVal;
      this.onAfterSet(newVal);
    } else {
      console.log('Old value is equal to new value. No need to set.');
    }
  };

  this.getValue = function() {
    return value;
  };
}
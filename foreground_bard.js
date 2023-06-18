// =======================
//          SETUP
// =======================

// Variables initialization
let chatBody = null;
let textAreaPromptField = null;
let sendPromptBtn = null;

let isReady = new ValueWatcher(false);
let isConversationOn = false;
let lastMessage = new ValueWatcher('');

isReady.onAfterSet= function(newVal){
  if(newVal){
    console.log('bard is ready..')
    chrome.runtime.sendMessage({action: "readyForConversation", payload: {name: "bard", isReady: true}});
  }else{
    chrome.runtime.sendMessage({action: "readyForConversation", payload: {name: "bard", isReady: false}});
  }
}

// Define a callback function to be executed after the value of `lastMessage` is set
lastMessage.onAfterSet = function(newVal){
  console.log('New Message Is Stored..')
  // check conversation on/off
  isReadyForConversation(newVal)
  console.log("isReady: "+isReady.getValue()+"isConversationOn: "+isConversationOn)
  if(isConversationOn) {
    console.log('Sending To Bard....');
    // forward message to BARD
    sendMessage("toChatGPT", newVal);
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
    if(isElementValid(chatBody, 'html')) {
      observer.disconnect();
      chatObserver(); // Call the chatObserver function
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

/*** DESIABLED ***/
//bodyObserver();

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

    case "whoStartFirst":
      isConversationOn = true;
      if(message.payload.engager === "bard"){
      sendPrompt(message.payload.prompt);
      console.log("Chatgpt will engage first", message.payload);
      }
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
}

// =======================
// isReady sign check(<<..>>)
// =======================
function isReadyForConversation(message){
  // Define the regex pattern to check
  const startSentance = "3652126526322";
  const endSentance = "3652000026322";
  if (message.includes(startSentance)) {
    isReady.setValue(true);
    console.log("The startSentance is found in the last message", isReady.getValue());
  }
  if (message.includes(endSentance)) {
    isReady.setValue(false);
    console.log("The endSentance is found in the last message", isReady.getValue());
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
    logEnabled: true,
    log(message, element) {
      if (this.logEnabled) {
        console.log(message, element);
      }
    },
    array() {
      this.check = Array.isArray(element);
      if (this.logEnabled) {
        this.log('Element is an array:', element);
        this.log('Result:', this.check);
      }
      return this.check;
    },
    undefined() {
      this.check = typeof element === 'undefined';
      if (this.logEnabled) {
        this.log('Element is undefined:', element);
        this.log('Result:', this.check);
      }
      return this.check;
    },
    null() {
      this.check = element === null;
      if (this.logEnabled) {
        this.log('Element is null:', element);
        this.log('Result:', this.check);
      }
      return this.check;
    },
    string() {
      this.check = typeof element === 'string';
      if (this.logEnabled) {
        this.log('Element is a string:', element);
        this.log('Result:', this.check);
      }
      return this.check;
    },
    number() {
      this.check = typeof element === 'number';
      if (this.logEnabled) {
        this.log('Element is a number:', element);
        this.log('Result:', this.check);
      }
      return this.check;
    },
    object() {
      this.check = typeof element === 'object' && element !== null;
      if (this.logEnabled) {
        this.log('Element is an object:', element);
        this.log('Result:', this.check);
      }
      return this.check;
    },
    boolean() {
      this.check = typeof element === 'boolean';
      if (this.logEnabled) {
        this.log('Element is a boolean:', element);
        this.log('Result:', this.check);
      }
      return this.check;
    },
    html() {
      this.check = element instanceof HTMLElement;
      if (this.logEnabled) {
        this.log('HTML element:', element);
        this.log('Result:', this.check);
      }
      return this.check;
    },
    checkArrayElements() {
      if (checkArrayElements && Array.isArray(element)) {
        for (const item of element) {
          if (item === undefined || item === null) {
            this.check = true;
            if (this.logEnabled) {
              this.log('Element contains undefined or null values:', element);
              this.log('Result:', this.check);
            }
            break;
          }
        }
      }
      return this.check;
    },
    checkExpectedNature() {
      if (expectedNature && typeof this[expectedNature] === 'function') {
        this[expectedNature]();
      } else {
        if (this.logEnabled) {
          this.log('Unexpected nature');
        }
      }
      return this.check;
    },
  };

  if (checkArrayElements) {
    return validator.checkArrayElements();
  } else {
    return validator.checkExpectedNature();
  }
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
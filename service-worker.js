// Background script

// Constants for tab URLs
const urlPatterns = {
  chatgpt: "https://chat.openai.com/",
  bard: "https://bard.google.com/"
}

// store the tab IDs
let tabID = {
  chatgpt: null,
  bard: null
}
// ready for conversation (this is used to determine who start first)
let isReady = {
  chatgpt : false,
  bard: false
}


/***********************************

          Incoming Message

***********************************/
// Function to handle incoming messages from content scripts
function handleIncomingMessage(message, sender, sendResponse) {
  // Process the incoming message based on its content
  switch (message.action) {
    // from popup.js
    case "checkTabs":
      checkTabs(message.services)
        .then((tabStatus) => {
          sendResponse({ tabStatus });
        })
        .catch((error) => {
          console.error("Error:", error);
          // Handle the error and send an appropriate response
          sendResponse({ error: "An error occurred while checking tabs" });
        });
      // Returning true indicates that sendResponse will be called asynchronously
      return true;
      break;

    // from popup.js
    case "conversationSetup":
      let msgSetup = message.convesationSetup;
      let msgExtra = message.convesationSetup.extraRules;
      let setup = {
        topic: msgSetup.topic, 
        setup:[ 
          {name: msgExtra[0].botName, rules: [msgSetup.commonRules, msgExtra[0].rules]},
          {name: msgExtra[1].botName, rules: [msgSetup.commonRules, msgExtra[1].rules]}
        ]
      };
      let fullMsg = {
        action: "setup",
        payload: {
          message: setup
        }
      };
      //TODO: change it to dynamic
      sendMessageToTab( tabID.chatgpt, fullMsg)
      sendMessageToTab( tabID.bard, fullMsg)
      break;

    case "readyForConversation":
      isReady[message.payload.name] = message.payload.isReady;
      // if both ready then start the conversation
      if(isReady.chatgpt && isReady.bard){
        // randomly choose one of them to start first
        let toss = tossCoin();
        let startFirst = toss === 1 ? "chatgpt" : "bard";
        console.log(startFirst)
        let result = {
          action: "whoStartFirst",
          payload: {
            engager: startFirst,
            prompt: "You've been chosen by the mediator",
          }
        }
        //TODO: change it to dynamic
        sendMessageToTab(tabID.chatgpt, result)
        sendMessageToTab(tabID.bard, result)
      }
      break;
    // from foreground_chatgpt.js
    case "toBard":
      // Send the message to the Bard tab
      sendMessageToTab(tabID.bard, {
        action: "fromChatGPT",
        payload: {
          message: message.payload.lastMessage,
        },
      });
      break;

    // from foreground_bard.js
    case "toChatGPT":
      // Send the message to the chatGPT tab
      sendMessageToTab(tabID.chatgpt, {
        action: "fromBard",
        payload: {
          message: message.payload.lastMessage,
        },
      });
      break;

    default:
      console.log("Unknown message action:", message.action);
  }
}
/***********************************

          check tabs

***********************************/
async function checkTabs(services) {
  const tabsToCheck = services.map((service) => {
    return {
      url: urlPatterns[service]+"*",
      isOpen: false,
    };
  });
  await Promise.all(
    tabsToCheck.map((tab) => {
      return new Promise((resolve) => {
        chrome.tabs.query({ url: tab.url }, (tabs) => {
          tab.isOpen = tabs && tabs.length > 0;
          resolve();
          if(!tab.isOpen) return;
          // get tab id
          if (tabs[0].url.includes(urlPatterns.chatgpt)) {
            tabID.chatgpt = tabs[0].id;
          }
          if (tabs[0].url.includes(urlPatterns.bard)) {
            tabID.bard = tabs[0].id;
          }
        });
      });
    })
  );
  return tabsToCheck;
}

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

      Handle Received Messages

***********************************/
// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(handleIncomingMessage);

/***********************************

              Others

***********************************/

//TODO: on after the conversation start and off when its done and error if something is wrong
chrome.action.setBadgeText({text: 'ON'});
chrome.action.setBadgeBackgroundColor({color: '#4688F1'});


function tossCoin() {
  return Math.floor(Math.random() * 2) + 1;
}
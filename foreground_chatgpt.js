let chatBody = null;
let markdownsCounter = null;
let messagesLastCount = 0;
let textAreaPromptField = null;
let sendPromptBtn = null;

/***********************************

        CHAT BODY CONTAINER
              DETECTOR

***********************************/
function startChatBodyObserver(){  
  // Create a new MutationObserver instance
  const chatBodyObserver = new MutationObserver((mutationsList, observer) => {
    chatBody = document.querySelector('.flex.flex-col.text-sm.dark\\:bg-gray-800');
    textAreaPromptField = document.getElementById('prompt-textarea');
    sendPromptBtn = document.querySelector('.absolute.p-1.rounded-md.md\\:bottom-3.md\\:p-2.md\\:right-3.dark\\:hover\\:bg-gray-900.dark\\:disabled\\:hover\\:bg-transparent.right-2.disabled\\:text-gray-400.enabled\\:bg-brand-purple.text-white.bottom-1\\.5.transition-colors.disabled\\:opacity-40');
    if (chatBody && sendPromptBtn && textAreaPromptField) {
      recursiveUntilCount()
      // Disconnect the observer once the element is rendered
      observer.disconnect();
    }
  });
  chatBodyObserver.observe(document.body, { childList: true, subtree: true });
}
function recursiveUntilCount() {
  const intervalId = setInterval(() => {
    markdownsCounter= chatBody?.getElementsByClassName('markdown')?.length;
    // Check the condition
    if (markdownsCounter) {
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
  if(!chatBody) return;
  if(markdownsCounter == null || messagesLastCount == null) return;
  if(markdownsCounter === messagesLastCount) return;
  const chatBodyBtnsContainer = document.querySelector(".h-full.flex.ml-1.md\\:w-full.md\\:m-auto.md\\:mb-2.gap-0.md\\:gap-2.justify-center");
  if(!(chatBodyBtnsContainer?.childNodes?.length)) return;

  // Check message cases such as (still writing, done writing..)
  let isWriteDone = checkTextCases(chatBodyBtnsContainer);
  if(isWriteDone){
    let lastMessage = getLastMessage(chatBody);
    sendMessage("chatGPTLastMessage", lastMessage);
    // Update messagesLastCount
    messagesLastCount = markdownsCounter;
  }
}
// Call the checkForNewMessages function periodically
setInterval(checkForNewMessages, 500);

/***********************************

        check Text Cases

***********************************/
function checkTextCases(chatBtns) {
  const writing_still = "Stop generating";
  const writing_done = "Regenerate response";
  const writing_continue = "Continue generating"
  let text = chatBtns?.textContent || "undefined";
  let isDoneWriting = false;

  switch (true) {
    case text.includes(writing_done):
      isDoneWriting = true;
      return isDoneWriting;
      console.log("Regenerate response ");
      break;
    case text.includes(writing_continue):
      console.log("Continue generating");
      break;
    case text.includes(writing_still):
      console.log("Stop generating");
      break;
    case text.includes("undefined"):
      console.log("undefined");
    break;
    default:
      console.log("No matching case");
      break;
  }
}
/***********************************

        GET LAST MESSAGE

***********************************/
// Function to retrieve the last message
function getLastMessage(chat) {
  const chatBodyMarkdowns = chat.getElementsByClassName('markdown');
  const lastMessage = chatBodyMarkdowns[chatBodyMarkdowns.length - 1]?.textContent || "ChatGPT Chat: Standard Message..";
  return lastMessage;
}

/***********************************

            SEND MESSAGE

***********************************/
function sendMessage(action, message) {
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

              SEND PROMPT

***********************************/
function sendPrompt(content){
  emulatePaste(textAreaPromptField, content)
  sendPromptBtn.click();
}
function emulatePaste(textarea, content) {
  // Set the selection range at the end of the textarea's content
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  // Insert the content at the current cursor position
  document.execCommand('insertText', false, content);
}



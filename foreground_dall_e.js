let formContainer = null;
let inputBox = null;
let sendPromptBtn = null;
let supriseMeBtn = null;
let tokenBalance = null;

let genWrappersContainer = null;

let isReadyForGen = new ValueWatcher(false);
let isPicsLoaded = new ValueWatcher(null);
// Create a set to store processed image URLs
const processedImageURLs = new Set();

isReadyForGen.onAfterSet = function(newVal){
  if(newVal){
    // send the prompt
    sendPrompt("old 1950s tools on a light purple background, retro futurism")
    // set isReadyForGen to true
    isReadyForGen.setValue(false)
    // check if is still generating
    const isGenerating = setInterval(()=>{
      // get pictures container
      genWrappersContainer = document.getElementById('mmComponent_images_as_1');
      //get all pictures
      const allPics = genWrappersContainer?.getElementsByTagName('a');
      // check for null/undefined or pics length
      if(isElementValid([genWrappersContainer, allPics], 'array', true) || allPics?.length < 4 ) return;
      clearInterval(isGenerating)

      // === SET LOADED PICS ===
      isPicsLoaded.setValue(allPics);
    }, 1000)
  }
}
isPicsLoaded.onAfterSet = function(newVal){
  // DOWNLOAD ALL PICTURES
  Array.from(newVal).forEach((picture, i) => {
    console.log(i)
    if(i === 4) return;
    // Picture link source
    let link = picture.getElementsByTagName('img')[0].getAttribute("src");
     // Check if the image URL has been processed before (this will prevent duplication in downloads)
    if (processedImageURLs.has(link)) return;
    // Mark the image URL as processed
    processedImageURLs.add(link);
    // check if link is string
    isElementValid(link, 'string');
    // refine/clean_up link
    let rescaledLink = removeDimensionLimit(link);

    // === DOWNLOAD PICTURE ===
    downloadPicture(rescaledLink)
  });
  // WE CAN GENERATE AGAIN
  if(Number(tokenBalance.textContent) > 10) isReadyForGen.setValue(true);
}

// =======================
//       CHAT BODY
//   CONTAINER DETECTOR
// =======================

// Observer function to detect the presence of the chat body container in the DOM
function bodyObserver(){
  const observer = new MutationObserver((mutationsList, observer) => {
    // Look for the chat body container element
    formContainer = document.getElementById('giscope');
    if(isElementValid(formContainer, 'html')){
      // assign elements
      tokenBalance = document.getElementById('token_bal');
      inputBox = document.getElementById('sb_form_q');
      sendPromptBtn = document.getElementById('create_btn_c');
      supriseMeBtn = document.getElementById('surprise-me');
      // check for null or undefined element
      if(isElementValid([tokenBalance, inputBox, sendPromptBtn, supriseMeBtn], 'array', true)) return;
      observer.disconnect();

      // === NOTIFY THAT WE CAN START GENERATE PICS ===
      isReadyForGen.setValue(true)
    }
  });
  // Observe changes in the body of the document
  observer.observe(document.body, { childList: true, subtree: true });
}
// Call the bodyObserver function to start observing the chat body container
bodyObserver();


// =======================
//      SEND PROMPT
// =======================

// Function to send a prompt to the chat input field
function sendPrompt(content){
  inputBox.value = content;
  sendPromptBtn.click();
  // clear input
  inputBox.value = "";
}

// =======================
// pic size limit remover
// =======================
function removeDimensionLimit(link) {
  // Regex pattern to match the dimension parameters (w=..., h=...)
  const pattern = /([&?])w=\d+&h=\d+/;

  // Replace the dimension parameters with an empty string
  const newLink = link.replace(pattern, '$1');

  return newLink;
}

// =======================
//    Download Picture
// =======================
function downloadPicture(url, folderName='dall_e_pics') {
  const filename = generateRandomFilename();

  const fileDetails = {
    filename: filename,
    url: url,
    folderName: folderName + "/"
  };
  chrome.runtime.sendMessage({action: "downloadPicDall_e", payload: fileDetails});
}
function generateRandomFilename() {
  // Generate a random UUID-like string as the filename
  return 'image_' + Math.random().toString(36).substring(2, 10) + '.jpg';
}


// =======================
//    is Element Valid
// =======================
// Function to check the validity and nature of an element
function isElementValid(element, expectedNature, checkArrayElements = false) {
  const validator = {
    check: false,
    logEnabled: false,
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

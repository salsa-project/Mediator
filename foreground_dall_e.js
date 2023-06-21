/*===== GLOBAL PARAMS =====*/
let folderName = null;
let tokenSettings = null;
let promptsList = [];

/*===== VARIABLES =====*/
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
    sendPrompt(generatePrompt())
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
    downloadPicture(rescaledLink, folderName)
  });
  // WE CAN GENERATE AGAIN
  if(Number(tokenBalance.textContent) > 0) isReadyForGen.setValue(true);
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
// for bing_dall-e max length is: ~70 words
function countWords(text) {
  // Remove leading and trailing whitespaces
  text = text.trim();

  // Split the string into words using whitespace as the delimiter
  const words = text.split(/\s+/);

  // Return the number of words
  return words.length;
}

/****************************
Adjective (Fuzzy) + Noun (creature) + Verb(wearing glasses) + Style (digital art)
Adjective (e.g., Fuzzy)
Noun (e.g., creature)
Verb (e.g., wearing glasses)
Style (e.g., digital art)
******************************/
// =======================
//     PROMPT GENERATOR
// =======================
// Arrays of adjectives, nouns, verbs, and art styles
const adjectives = [
  'fuzzy', 'cute', 'glamorous', 'realistic', 'minimalistic', 'colorful',
  'abstract', 'whimsical', 'vibrant', 'dreamy', 'mystical', 'playful',
  'elegant', 'quirky', 'fantastical', 'serene', 'surreal', 'ethereal',
  'dynamic', 'bold', 'tranquil', 'magical', 'nostalgic', 'impressionistic',
  'innovative', 'sophisticated', 'expressive', 'mesmerizing', 'harmonious',
  'intricate', 'thought-provoking', 'captivating', 'energetic', 'fluid',
  'enchanting', 'mysterious', 'contemplative', 'stunning', 'evocative'
  // Add more adjectives...
];
let category1 = ["Chair", "Table", "Lamp", "Couch", "Bookshelf", "Desk", "Bed", "Wardrobe", "Mirror", "Rug", "Clock", "Shelf", "Dresser", "Sofa", "TV Stand", "Nightstand", "Ottoman", "Cabinet", "Bench", "Credenza", "Stool", "Futon", "Console Table", "Rocking Chair", "Bean Bag", "Chaise Lounge", "Armchair", "Side Table", "Dining Table", "End Table", "Vanity", "Hammock", "Footstool", "Room Divider", "Writing Desk", "Coat Rack", "Baby Crib", "Bar Stool", "Magazine Rack", "Folding Chair", "Step Stool", "Computer Desk", "High Chair", "Card Table", "Piano Bench", "Plant Stand", "Wall Shelf", "Storage Bench", "Bean Bag Chair", "Massage Chair", "Chaise Lounge Chair", "Corner Shelf"];
let category2 =["Car", "Bicycle", "Motorcycle", "Bus", "Truck", "Train", "Boat", "Airplane", "Scooter", "Helicopter", "Van", "RV", "Taxi", "Golf Cart", "Segway", "Forklift", "Skateboard", "Wheelchair", "Sled", "Go-Kart", "Jet Ski", "Snowmobile", "Cruise Ship", "Submarine", "Tractor", "Hot Air Balloon", "Bulldozer", "Race Car", "Ambulance", "Fire Truck", "Police Car", "Garbage Truck", "Ice Cream Truck", "Tow Truck", "Dump Truck", "Food Truck", "Mail Truck", "Tanker Truck", "Delivery Van", "Limousine", "Electric Scooter", "Motorized Bicycle", "Segway", "Amphibious Vehicle", "Monster Truck", "Trolley", "Bumper Car", "Cable Car", "Camper Van", "Double Decker Bus", "Golf Cart", "Horse-Drawn Carriage", "Ice Cream Truck", "Jeep"];
let category3 =["Apple", "Orange", "Banana", "Grapes", "Watermelon", "Strawberry", "Pineapple", "Mango", "Kiwi", "Pear", "Lemon", "Cherry", "Blueberry", "Peach", "Raspberry", "Blackberry", "Coconut", "Avocado", "Pomegranate", "Plum", "Cantaloupe", "Lime", "Grapefruit", "Cranberry", "Apricot", "Nectarine", "Passion Fruit", "Fig", "Honeydew", "Tangerine", "Mandarin Orange", "Lychee", "Guava", "Persimmon", "Date", "Dragon Fruit", "Papaya", "Star Fruit", "Mulberry", "Boysenberry", "Elderberry", "Kiwi Berry", "Clementine", "Plantain", "Kumquat", "Quince", "Soursop", "Cherimoya", "Feijoa", "Ackee", "Durian"];
let category4 =["Television", "Computer", "Phone", "Headphones", "Speaker", "Tablet", "Smartwatch", "Camera", "Printer", "Router", "Keyboard", "Mouse", "Laptop", "Monitor", "Projector", "Microphone", "Gaming Console", "External Hard Drive", "USB Flash Drive", "Scanner", "Fitness Tracker", "Bluetooth Earphones", "Wireless Charger", "VR Headset", "Webcam", "Wireless Mouse", "Wireless Keyboard", "Smart Home Hub", "Drone", "Portable Charger", "Graphic Tablet", "E-book Reader", "Smart Thermostat", "Smart Speaker", "Wireless Earbuds", "Noise Cancelling Headphones", "Smart TV", "Wireless Router", "Smart Light Bulb", "Bluetooth Speaker", "Smart Lock", "Smart Plug", "Smart Doorbell", "Wireless Headset", "Touchscreen Monitor", "Smart Scale", "GPS Navigation System", "Streaming Device", "Action Camera", "Digital Photo Frame", "Gaming Mouse"]
const nouns = ["rpg map","apple", "book", "car", "desk", "earphones", "flower", "guitar", "hat", "ice cream", "jigsaw puzzle", "keyboard", "lamp", "moon", "notebook", "orange", "pencil", "quilt", "radio", "shoes", "table", "umbrella", "violin", "watch", "xylophone", "yacht", "zeppelin", "airplane", "bicycle", "camera", "door", "earrings", "fan", "globe", "hammer", "island", "kite", "laptop", "map", "newspaper", "ocean", "paintbrush", "quill", "rug", "sunglasses", "teapot", "vase", "wallet", "yarn", "acoustic guitar", "basketball", "chair", "drums", "fountain pen", "glasses", "hamburger", "internet", "microphone", "note", "painting", "robot", "sailboat", "ukulele", "water bottle", "zipper", "air conditioner", "bag", "desktop", "earbuds", "flashlight", "hanger", "microscope", "saxophone", "alarm clock", "balloon", "candle", "dictionary", "easel", "fishing rod", "hair dryer", "inflatable boat", "juice carton", "kettle", "luggage", "necktie", "quilting frame", "rolling pin", "speaker", "tent", "watering can", "yoyo", "air freshener", "candy", "dice", "eraser", "football", "iron", "jump rope", "keychain", "origami", "photo frame", "screwdriver", "tape measure", "whistle", "air pump", "bagel", "candlestick", "disk", "ironing board", "jigsaw", "lampshade", "magnifying glass", "nail", "quill pen", "rubber band", "scissors", "telescope", "velvet", "candy cane", "disposable cup", "football helmet", "helmet", "ink bottle", "neck pillow", "paint roller", "quilting hoop", "rubber duck", "tissue box", "yo-yo", "aluminum foil", "ballpoint pen", "candy wrapper", "dog leash", "eyeglass case", "flip-flops", "gift box", "hairbrush", "inflatable mattress", "juicer", "knee pads", "mouse pad", "origami paper", "paper clip", "quilted jacket", "roller skates", "screw", "toothbrush", "aluminum can", "camera tripod", "dog toy", "eyeglasses", "flip phone", "gloves", "hairdryer", "inflatable pool", "juice box", "mouse", "necklace", "paperweight", "quilted vest", "sculpture", "toothpaste", "USB drive", "backpack", "dog treat", "flash drive", "goggles", "hairpin", "inflatable raft", "jewelry box", "kitchen timer", "remote control", "stapler", "toothpick", "USB cable", "camera lens", "doll", "golf ball", "hair spray", "inflatable toy", "rubber ball", "dollhouse", "golf club", "jack-o'-lantern", "plastic bottle", "door handle", "golf tee", "plastic cup", "doorbell", "plastic fork", "ball", "key"]

const verbs = [
  'wearing glasses', 'product design', 'featuring a skyline', 'with glamorous outfit', 'holding an umbrella in the rain',
  'playing music', 'floating in space', 'emerging from darkness', 'dancing with light', 'interacting with nature',
  'exploring the unknown', 'transforming into something else', 'creating harmony', 'breaking boundaries', 'conveying emotions',
  'revealing hidden meanings', 'evoking nostalgia', 'confronting reality', 'defying gravity', 'inspiring imagination',
  'expressing individuality', 'celebrating diversity', 'unleashing creativity', 'capturing fleeting moments', 'embracing serendipity',
  'symbolizing strength', 'provoking thoughts', 'reflecting culture', 'telling a story', 'evoking wonder'
];
const artStyles = [
  'digital art', '3D render', 'graphic design', 'ink drawing', 'photo visual',
  'mixed media', 'watercolor painting', 'oil painting', 'collage', 'abstract expressionism',
  'pop art', 'minimalism', 'surrealism', 'impressionism', 'cubism',
  'realism', 'fantasy art', 'street art', 'concept art', 'illustration',
  'contemporary art', 'photorealism', 'symbolism', 'modernism', 'post-impressionism',
  'dadaism', 'pointillism', 'neo-expressionism', 'fauvism', 'romanticism',
  'naïve art', 'installation art', 'hyperrealism', 'deconstructivism', 'suprematism',
  'constructivism', 'traditional art', 'folk art', 'graffiti art', 'kinetic art', 'isometric view'
];

// Function to generate a prompt
function generatePrompt() {
  // Randomly select an adjective, noun, verb, and art style
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
  const randomStyle = artStyles[Math.floor(Math.random() * artStyles.length)];

  // Generate the prompt using the selected words
  const prompt = `${randomAdjective} ${randomNoun}, ${randomVerb}, ${randomStyle}`;

  return prompt;
}

// =======================
//     READY PROMPTS
// =======================

const readyPrompts = [
  "Radiant robotic being sporting a crimson shirt, portrayed in the style of pixel art.",
  "Sparkling mechanical creature outfitted in a scarlet tee, depicted using pixel art techniques.",
  "Glittering android garbed in a crimson top, showcased in the form of pixelated art.",
  "Polished robotic entity wearing a red shirt, visualized through the medium of pixel art.",
  "Shiny automaton donning a crimson top, portrayed in the medium of pixelated artwork.",
  "Glinting machine adorned in a red tee, presented through the lens of pixel art techniques.",
  "Bright metallic being outfitted in a scarlet shirt, depicted in the style of pixel artistry.",
  "Lustrous cyborg adorned in a red shirt, presented in pixel art format.",
  "Sleek, sports car, speeding down the highway, CGI render.",
  "Elaborate, steampunk machinery, showcasing intricate gears and cogs, 3D render.",
  "Art Deco-inspired, furniture design, showcasing elegance, 3D visualization.",
  "Abstract, colorful pattern, illuminated in black light, vector design.",
  "Cyberpunk, neon-lit alleyway, bustling with people, matte painting.",
  "Post-apocalyptic, world, littered with ruins, concept art.",
  "Whimsical, hot air balloon ride, soaring above clouds, digital art.",
  "Colorful, street art, adorning urban walls, street photography.",
  "Satirical, cartoon, poking fun at politics, hand-drawn illustration.",
  "Dreamy, cosmos, swirling with galaxies, space art.",
  "Modern, geometric animal design, vector illustration.",
  "Abstract, colorful pattern, illuminated in black light, vector design.",
  "Cyberpunk, neon-lit alleyway, bustling with people, matte painting.",
  "Post-apocalyptic, world, littered with ruins, concept art.",
  "Whimsical, hot air balloon ride, soaring above clouds, digital art.",
  "Colorful, street art, adorning urban walls, street photography.",
  "Satirical, cartoon, poking fun at politics, hand-drawn illustration.",
  "Dreamy, cosmos, swirling with galaxies, space art.",
  "Modern, geometric animal design, vector illustration.",
  "Majestic, waterfall, surrounded by lush forest, landscape photography.",
  "Minimalist, modern architecture, featuring clean lines, 3D render.",
  "Abstract, colorful pattern, illuminated in black light, vector design.",
  "Futuristic, space shuttle, blasting off into the stars, concept art.",
  "Detailed, world atlas, highlighting cultural landmarks, educational illustration.",
  "Spooky, abandoned asylum, with peeling wallpaper and rusted metal, urban exploration photography.",
  "Vibrant, African savanna, with grazing wildlife and acacia trees, nature photography.",
  "Powerful, political campaign poster, featuring bold typography and a patriotic color scheme.",
  "Mysterious, ancient ruins, with overgrown vegetation, concept art.",
  "Charming, countryside barn, with grazing farm animals, acrylic painting.",
  "Modern, minimalistic architecture, with clean lines and geometric shapes, 3D render.",
  "Moody, rainy cityscape, with glowing streetlights and reflections, digital art.",
  "Majestic, medieval castle, perched on a hilltop, oil painting.",
  "Otherworldly, underwater city, with intricate architecture and sea creatures, concept art.",
  "Vibrant, mixed media art piece, featuring collaged images, paint, and typography.",
  "Abstract, experimental sculpture, exploring form and texture, mixed media.",
  "Enchanting, fairy tale illustration, depicting a magical forest and mythical creatures.",
  "Realistic, still life painting, capturing everyday objects in intricate detail.",
  "Epic, fantasy landscape, with towering mountains and mystical creatures, digital painting.",
  "Minimalist, black and white portrait, showcasing strong emotion, charcoal drawing.",
  "Whimsical, children's book illustration, featuring talking animals and vibrant colors.",
  "Surreal, dreamlike composition, blending unexpected elements, digital collage.",
  "Dramatic, high-fashion photography, highlighting unique styling and bold makeup.",
];

function chooseRandomValue(readyPrompts) {
  return readyPrompts[Math.floor(Math.random() * readyPrompts.length)];
}

const checkServicesBtn = document.getElementById('checkServicesBtn');
const select1 = document.getElementById('select1');
const select2 = document.getElementById('select2');

const topic = document.getElementById('topic');
const commonRules = document.getElementById('commonRules');
const botOneRules = document.getElementById('botOneRules');
const botTwoRules = document.getElementById('botTwoRules');
const startConversationBtn = document.getElementById('startConversationBtn');

const connectSection = document.getElementById('connectSection');
const setupBotsSection = document.getElementById('setupBots');


const templateSample1 = {
  topic: "Topic : AI and the web development",
  commonRules: "",
  botOneRules: "Explanation:\nYou (Chatbot A) and another chatbot (Chatbot B) will engage in a conversation. You will take turns exchanging messages and follow a set of rules to guide the flow of the conversation.Rules:\n1. Introduction: Each chatbot should introduce itself at the beginning of the conversation.\n2. Turn-Taking: The chatbots will take turns asking open-ended questions.\n3. Active Listening: The chatbots should actively listen to each other's responses and ask follow-up questions.\n4. Sharing Experiences: The chatbots should share personal experiences or opinions related to the topic.\n5. Friendly Debate/Discussion: The chatbots should engage in a friendly debate or discussion on a chosen topic.\n6. Conclusion: The chatbots should conclude the conversation with a closing remark.\n7. If you misunderstands a question or statement from the other chatbot, you can politely ask for clarification to ensure they provide an appropriate response .\n8. max length of response is about 600 words , you should never exceed the max length .\n9. The conversation will be starting after you tap (3652126526322) , then i will chose who start first .\n10. I will send (You've been chosen by the mediator) to one of you either you or the other chatbot, if you dont receive it you will receive the first message of the conversation from the other bot directly .\n11. Conversation end after you tap (3652000026322)",
  botTwoRules: "Jack: Jack is a senior web developer with 20 years of experience. He is knowledgeable in AI and ML, but he does not like the idea of implementing AI in the web. He is concerned about the potential for AI to be used to track users and collect data without their consent.\nRules: Do not simulate conversation. Do not offer your own opinions or beliefs. Stick to the persona of Jack.\nAdditional Rules:\n\nThe conversation will be starting after you tap (3652126526322), then I will choose who starts first.\nI will send (You've been chosen by the mediator) to one of you either you or the other chatbot, if you don't receive it you will receive the first message of the conversation from the other bot directly.\nConversation end after you tap (3652000026322)\nRemember: Do not simulate conversation. Do not offer your own opinions or beliefs. Stick to the persona of Jack, Follow the rules and don't do the mistake of simulating a conversation"
}


checkServicesBtn.addEventListener('click', function(){
  if(select1.value == "none" || select2.value == "none") return;
  let chatbotOne = select1.value;
  let chatbotTwo = select2.value;
  chrome.runtime.sendMessage({ action: "checkTabs", services : [chatbotOne, chatbotTwo] }, function(response) {
    // Handle the response from background.js
    if (response.tabStatus[0].isOpen && response.tabStatus[1].isOpen) {
      select1.classList.add('ready');
      select2.classList.add('ready');
      checkServicesBtn.textContent = "DONE";
      checkServicesBtn.style.cssText = `color: white; background: gray; cursor: not-allowed`;
      select1.style.cursor = "not-allowed";
      select2.style.cursor = "not-allowed";
      checkServicesBtn.disabled = true;
      select1.disabled = true;
      select2.disabled = true;
      setTimeout(()=>{
        // hide connect section
        connectSection.classList.toggle('show')
      }, 200)
      setTimeout(()=>{
        // show setup bots section
        setupBotsSection.classList.toggle('show')
      }, 500)
      document.getElementsByClassName('botName')[0].innerText = chatbotOne;
      document.getElementsByClassName('botName')[1].innerText = chatbotTwo;
    } else {
      console.log("One/Both tabs are closed..")
    }
  });

  // test template
  topic.value = templateSample1.topic;
  commonRules.value = templateSample1.commonRules;
  botOneRules.value = templateSample1.botOneRules;
  botTwoRules.value = templateSample1.botTwoRules;

})



startConversationBtn.addEventListener('click', function(){

  let convesationSetup = {
    topic: topic.value,
    commonRules: commonRules.value,
    extraRules: [
      {botName: select1.value, rules: botOneRules.value},
      {botName: select2.value, rules: botTwoRules.value}
    ]
  }
  // TODO send setup to service worker
  // if true print "Conrvesation Is Running Successfuly.."

  chrome.runtime.sendMessage({ action: "conversationSetup", convesationSetup : convesationSetup }, function(response) {
    // Handle the response from background.js
    console.log(response)
  });



  // clear inputs
  topic.value = "";
  commonRules.value = "";
  botOneRules.value = "";
  botTwoRules.value = "";

  this.textContent = "DONE";
  this.style.color = "white";  
  this.style.background = "gray";
  this.style.background = "gray";
  this.style.cursor = "not-allowed";
  this.disabled = true;
})






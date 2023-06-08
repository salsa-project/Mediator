const checkServicesBtn = document.getElementById('checkServicesBtn');
const select1 = document.getElementById('select1');
const select2 = document.getElementById('select2');

const topic = document.getElementById('topic');
const commonRules = document.getElementById('commonRules');
const botOneRules = document.getElementById('botOneRules');
const botTwoRules = document.getElementById('botTwoRules');
const startConversationBtn = document.getElementById('startConversationBtn');

checkServicesBtn.addEventListener('click', function(){
  if(select1.value == "none" || select2.value == "none") return;
  let chatbotOne = select1.value;
  let chatbotTwo = select2.value;
  // TODO send chatbots to service-worker , wait for response true/false


  if(true){
    select1.classList.add('ready');
    select2.classList.add('ready');
     
  }
  this.textContent = "DONE";
  this.style.color = "white";  
  this.style.background = "gray";
  this.style.cursor = "not-allowed";
  select1.style.cursor = "not-allowed";
  select2.style.cursor = "not-allowed";
  this.disabled = true;
  select1.disabled = true;
  select2.disabled = true;
})



startConversationBtn.addEventListener('click', function(){

  let convesationSetup = {
    topic: topic.value,
    commonRules: commonRules.value,
    botOneRules: botOneRules.value,
    botTwoRules: botTwoRules.value
  }
  console.log(convesationSetup)
  // TODO send setup to service worker
  // if true print "Conrvesation Is Running Successfuly.."

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
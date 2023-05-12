/* 
hosted at https://vercel.com/mnaumann79/codex with GitHub credentials
https://codex-self.vercel.app/
*/
import bot from './assets/bot.svg';
import user from './assets/user.svg';
// import bot from './assets/bot.svg'

import * as marked from 'marked';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

let loadInterval;

function loader(element) {
  // '...'
  element.textContent = "I'm thinking";

  loadInterval = setInterval(() => {
    element.textContent += '.';

    if (element.textContent === "I'm thinking......") {
      element.textContent = "I'm thinking";
    }
  }, 300);
}

function typeText(element, text) {
  let index = 0;

  // let markdownText = md.render(text);
  // console.log(markdownText);

  let interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 20);
}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId) {
  // const markdownValue = md.render(value);
  // console.log(markdownValue);
  // const markdownValue = value;
  // const sanitizedValue = DOMPurify.sanitize(markdownValue);

  return `    
      <div class="wrapper ${isAi && 'ai'}">
        <div class="chat">
          <div class="profile">
            <img 
              src="${isAi ? bot : user}" 
              alt="${isAi ? 'bot' : 'user'}" 
            />
          </div>
          <div class="message" id="${uniqueId}">${value}</div>
        </div>
      </div>
    `;
}

let conversation = [
  {
    role: 'system',
    content:
      'The following is a conversation with an AI assistant named Winston. The assistant is helpful, creative, clever, and very friendly. The assistant uses markdown output whenever possible.\n',
  },
];

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  //user's chatstrip
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'));

  form.reset();

  //bot's chatstripe
  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, ' ', uniqueId);

  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);

  // loader(messageDiv);

  // Create an EventSource instance to open a streaming connection
  // const source = new EventSource(
  //   `https://codex-nk5p.onrender.com/chat?userMessage=${encodeURIComponent(
  //     data.get('prompt')
  //   )}&conversation=${encodeURIComponent(JSON.stringify(conversation))}`
  // );
  const source = new EventSource(
    `http://localhost:5000/chat?userMessage=${encodeURIComponent(
      data.get('prompt')
    )}&conversation=${encodeURIComponent(JSON.stringify(conversation))}`
  );

  messageDiv.innerHTML = '';

  source.onmessage = async function (event) {
    clearInterval(loadInterval);
    // console.log(event);
    const data = JSON.parse(event.data);

    console.log('Received data:', data.botResponse);
    // const parsedData = data.botResponse.trim();
    const parsedData = data.botResponse;

    // typeText(messageDiv, parsedData);

    if (parsedData) {
      messageDiv.innerHTML = messageDiv.innerHTML + parsedData;
    }

    conversation = data.conversation;
    console.log(conversation);
  };

  source.onerror = function (err) {
    clearInterval(loadInterval);
    messageDiv.innerHTML = 'Something went wrong';
    console.log(err);
    // alert(err);
  };
};

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    handleSubmit(e);
  }
});

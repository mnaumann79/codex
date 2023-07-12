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

const model = 'gpt-4';

let conversation = [
  {
    role: 'system',
    content:
      'The following is a conversation with an AI assistant named Winston. The assistant is helpful, creative, clever, and very friendly. The assistant uses markdown output whenever possible.\n',
  },
];

// const serverUrl = 'http://localhost:5000';
// const serverUrl = 'https://codexbackend-1-z0677692.deta.app';
// const serverUrl = 'https://tiny-blue-elephant-ring.cyclic.app';
const serverUrl = 'https://codex-nk5p.onrender.com';

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

const sendInitialData = async () => {
  // console.log(`the document was reloaded`);
  const initialData = {
    conversation: conversation, // Include the conversation array here
    model: model, // Include the model name here
  };

  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initialData),
  };

  try {
    const response = await fetch(
      // 'https://mushy-crab-khakis.cyclic.app/initial-data',
      // 'http://localhost:5000/initial-data',
      `${serverUrl}/initial-data`,
      requestOptions
    );
    if (response.ok) {
      console.log('Initial data sent successfully');
      // Handle success scenario
    } else {
      console.error('Error sending initial data:', response.status);
      // Handle error scenario
    }
  } catch (error) {
    console.error('Error sending initial data:', error);
    // Handle error scenario
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();
  const start = new Date();

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
  // console.log(model);

  const source = new EventSource(
    `${serverUrl}/chat?model=${encodeURIComponent(model)}
      &userMessage=${encodeURIComponent(data.get('prompt'))}`
  );

  messageDiv.innerHTML = '';

  source.onmessage = async function (event) {
    const end = new Date();
    console.log(`time to respond: ${(end - start) / 1000} s`);
    clearInterval(loadInterval);
    const data = JSON.parse(event.data);

    if (data.botResponse) {
      const parsedData = data.botResponse;
      // console.log('Received data:', parsedData);
      messageDiv.innerHTML = messageDiv.innerHTML + parsedData;
    }

    if (data.conversation) {
      conversation = data.conversation;
      console.log(conversation[0]);
    }
  };

  source.onerror = function (err) {
    clearInterval(loadInterval);
    // messageDiv.innerHTML = `${err.type}`;
    // console.log(err.type);
    source.close();
  };
};

document.addEventListener('DOMContentLoaded', sendInitialData);

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    handleSubmit(e);
  }
});

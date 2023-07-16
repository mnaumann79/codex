/* 
hosted at https://vercel.com/mnaumann79/codex with GitHub credentials
https://codex-self.vercel.app/
*/
import bot from './assets/bot.svg';
import user from './assets/user.svg';
// import bot from './assets/bot.svg'
// const { v4: uuid } = require('uuid');
import { v4 as uuid } from 'uuid';
import * as marked from 'marked';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

let loadInterval;

const model = 'gpt-4';

let conversation = JSON.parse(localStorage.getItem('conversation')) || [
  {
    role: 'system',
    content:
      'The following is a conversation with an AI assistant named Winston. The assistant is helpful, creative, clever, and very friendly. The assistant uses markdown output whenever possible.\n',
  },
];

const serverUrl = 'http://localhost:5000';
// const serverUrl = 'https://codexbackend-1-z0677692.deta.app';
// const serverUrl = 'https://tiny-blue-elephant-ring.cyclic.app';
// const serverUrl = 'https://codex-nk5p.onrender.com';

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

const chatStripe = (isAi, value, uniqueId) => {
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
};

const handleSubmit = async (e) => {
  e.preventDefault();
  conversation.push({ role: 'user', content: e.target.value });

  // const start = new Date();

  const data = new FormData(form);

  //user's chatstrip
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'));
  form.reset();

  //bot's chatstripe
  const uniqueId = uuid();
  chatContainer.innerHTML += chatStripe(true, ' ', uniqueId);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);

  loader(messageDiv);

  const response = await fetch(`${serverUrl}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation: conversation, // Include the conversation array here
      model: model, // Include the model name here
    }),
  });

  const eventSource = new EventSource(`${serverUrl}/chat`);

  if (typeof EventSource !== 'undefined') {
    // console.log('success');
  } else {
    console.log('something is wrong with the EventSource');
  }

  messageDiv.innerHTML = '';
  eventSource.onmessage = (e) => {
    clearInterval(loadInterval);
    const eventData = JSON.parse(e.data);
    // console.log(eventData.botResponse);
    if (eventData.botResponse) {
      messageDiv.innerHTML += eventData.botResponse;
    }
    if (eventData.message) {
      messageDiv.innerHTML += eventData.message;
    }
  };

  eventSource.onerror = (err) => {
    const assitantMessage = {
      role: 'assistant',
      content: messageDiv.innerHTML,
    };
    conversation.push(assitantMessage);
    localStorage.setItem('conversation', JSON.stringify(conversation));
    eventSource.close();
  };
};
// window.onload()
document.addEventListener('DOMContentLoaded', () => {
  //user's chatstrip
  conversation
    .filter((message) => message.role !== 'system')
    .forEach((message) => {
      // const renderedMessage = md.render(message.content);
      const renderedMessage = message.content;
      message.role === 'user'
        ? (chatContainer.innerHTML += chatStripe(false, renderedMessage))
        : (chatContainer.innerHTML += chatStripe(
            true,
            renderedMessage,
            uuid()
          ));
    });
});

// });
const button = document.getElementById('reset');
button.addEventListener('click', () => {
  localStorage.removeItem('conversation');
  conversation = [
    {
      role: 'system',
      content:
        'The following is a conversation with an AI assistant named Winston. The assistant is helpful, creative, clever, and very friendly. The assistant uses markdown output whenever possible.\n',
    },
  ];
});
form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    handleSubmit(e);
  }
  if (e.key === 'ArrowUp') {
    const textArea = document.getElementsByTagName('textarea');
    // data.value = 'you pressed ArrowUp';
    textArea.textArea = 'you pressed ArrowDown';
    // console.log(data.get('prompt'));
  }
});

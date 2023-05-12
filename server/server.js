/* 
hosted at https://render.com; connected with GitHub
https://www.youtube.com/watch?v=2FeymQoKvrk&ab_channel=JavaScriptMastery
*/

import express, { response } from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
// import { Configuration, OpenAIApi } from 'openai';

// import { TextDecoder } from 'util';

// Only for testing purposes, do not use in production
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

dotenv.config();

// console.log(process.env.OPENAI_API_KEY);

// const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
// const openai = new OpenAIApi(configuration);

async function generateResponse(messages, sendSse) {
  try {
    const response = await fetch(process.env.OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        // model: 'gpt-4',
        messages: messages,
        max_tokens: 100,
        stream: true, //for the streaming purpose
      }),
      // signal, //ES2015 short-hand syntax
    });

    // const data = await response.json();
    // console.log(data);
    if (!response.ok) {
      throw new Error(
        `OpenAI API responded with status code ${response.status}`
      );
    }
    // const decoder = new TextDecoder('utf8');

    let chunks = [];
    for await (let chunk of response.body) {
      chunks.push(chunk);
    }
    let chunk = Buffer.concat(chunks).toString(); // Convert Buffer to string

    const lines = chunk.split('\n');
    const parsedLines = lines
      .map((line) => line.replace(/^data: /, '').trim()) // Remove the "data: " prefix
      .filter((line) => line !== '' && line !== '[DONE]') // Remove empty lines and "[DONE]"
      .map((line) => JSON.parse(line)); // Parse the JSON string
    // console.log(parsedLines);

    let id = 0;
    let assistantContent = '';
    const responseId = Date.now();

    for (const parsedLine of parsedLines) {
      const { choices } = parsedLine;
      const { delta } = choices[0];
      const { content } = delta;
      if (content) {
        // resultText.innerText += content;
        const botResponse = content;
        assistantContent += botResponse;
        sendSse(responseId, { botResponse });
      }
    }
    console.log(assistantContent);
    // let conversation = [];
    messages.push({
      role: 'assistant',
      content: `${assistantContent}`,
    });
    const conversation = messages;

    console.log(conversation);
    sendSse(responseId, { conversation });
    // console.log(messages);

    // Check if the response contains the message content
    // return data.choices[0].message.content;
    // return 'Wait for it!';
  } catch (error) {
    console.log('Error:', error);
  }
}

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from Codex',
  });
});

app.get('/chat', async (req, res) => {
  try {
    // console.log(req.query);
    const userMessage = req.query.userMessage;
    const conversation = JSON.parse(req.query.conversation);

    conversation.push({ role: 'user', content: userMessage });

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Function to send a server-sent event
    const sendSse = (id, data) => {
      res.write(`id: ${id}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    await generateResponse(conversation, sendSse);
    // res.end();
    // conversation.push({ role: 'assistant', content: botResponse });

    // sendSse(responseId, { botResponse, conversation });
    // res.status(200).send({ botResponse, conversation });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port http://localhost:5000');
});

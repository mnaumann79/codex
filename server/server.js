/* 
hosted at https://render.com; connected with GitHub
https://www.youtube.com/watch?v=2FeymQoKvrk&ab_channel=JavaScriptMastery
*/

import express from 'express';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import cors from 'cors';

// Only for testing purposes, do not use in production
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

dotenv.config();
// console.log(process.env.OPENAI_API_KEY);

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
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API responded with status code ${response.status}`
      );
    }

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

    let assistantContent = '';
    const responseId = Date.now();

    for (const parsedLine of parsedLines) {
      const { choices } = parsedLine;
      const { delta } = choices[0];
      const { content } = delta;
      if (content) {
        const botResponse = content;
        // console.log(`Content: ${botResponse}`);
        assistantContent += botResponse;
        sendSse(responseId, { botResponse });
      }
    }

    // console.log(assistantContent);
    messages.push({
      role: 'assistant',
      content: `${assistantContent}`,
    });
    const conversation = messages;
    // console.log(conversation);

    sendSse(responseId, { conversation });
  } catch (error) {
    console.log('Error:', error);
  }
}

const app = express();
app.use(cors());
app.use(express.json());

//check if the server is live
app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from Codex',
  });
});

app.get('/chat', async (req, res) => {
  try {
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
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port http://localhost:5000');
});

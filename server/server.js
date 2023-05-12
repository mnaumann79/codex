/* 
hosted at https://render.com; connected with GitHub
https://www.youtube.com/watch?v=2FeymQoKvrk&ab_channel=JavaScriptMastery
*/

import express from 'express';
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

async function generateResponse(messages) {
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

    for (const parsedLine of parsedLines) {
      const { choices } = parsedLine;
      const { delta } = choices[0];
      const { content } = delta;
      if (content) {
        // resultText.innerText += content;
        console.log(content);
      }
    }

    // Check if the response contains the message content
    // return data.choices[0].message.content;
    return 'Wait for it!';
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

app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.userMessage;
    const conversation = req.body.conversation;

    conversation.push({ role: 'user', content: userMessage });

    const botResponse = await generateResponse(conversation);

    conversation.push({ role: 'assistant', content: botResponse });

    res.status(200).send({ botResponse, conversation });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port http://localhost:5000');
});

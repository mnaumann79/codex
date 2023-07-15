/* 
hosted at https://render.com; connected with GitHub
https://www.youtube.com/watch?v=2FeymQoKvrk&ab_channel=JavaScriptMastery
*/

import express from 'express';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Transform } from 'stream';
import { log } from 'console';

// import { OpenAIApi, Configuration } from 'openai';

// const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
// const openai = new OpenAIApi(configuration);

// Only for testing purposes, do not use in production
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

dotenv.config();
// console.log(process.env.OPENAI_API_URL);

const generateResponse = async (model, conversation, res) => {
  try {
    // console.log(model);

    // const response = {};
    // switch (model) {
    //   case 'gpt-4':
    const response = await fetch(process.env.OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        // model: 'gpt-3.5-turbo',
        model: 'gpt-4',
        messages: conversation,
        max_tokens: 500,
        stream: true, //for the streaming purpose
      }),
    });

    let assistantContent = '';
    // const responseId = Date.now();

    if (!response.ok) {
      throw new Error(
        `OpenAI API responded with status code ${response.status}`
      );
    }

    await new Promise((resolve, reject) => {
      response.body
        .pipe(
          new Transform({
            transform(chunk, encoding, callback) {
              const lines = chunk.toString().split('\n');
              const parsedLines = lines
                .map((line) => line.replace(/^data: /, '').trim()) // Remove the "data: " prefix
                .filter((line) => line !== '' && line !== '[DONE]') // Remove empty lines and "[DONE]"
                .map((line) => JSON.parse(line)); // Parse the JSON string
              // console.log(parsedLines);
              parsedLines.forEach((parsedLine) => {
                const { choices } = parsedLine;
                const { delta } = choices[0];
                const { content } = delta;

                if (content) {
                  const botResponse = content;
                  // console.log(`Content: ${botResponse}`);
                  // const endTime = Date.now();
                  // console.log(`That took ${(endTime - responseId) / 1000} s: ${botResponse}`);
                  assistantContent += botResponse;
                  res.write(`data: ${JSON.stringify({ botResponse })}\n\n`);
                }
              });
              callback();
            },
          })
        )
        .on('data', () => {
          // Consume the data to trigger the 'end' event
        })
        .on('end', () => {
          // check the time for the response

          conversation.push({
            role: 'assistant',
            content: `${assistantContent}`,
          });
          // console.log(conversation)
          // res.write(`data: ${JSON.stringify({ conversation })}\n\n`);
          res.end();
          resolve();
        })
        .on('error', () => {
          console.log('Error:', err);
          reject(err);
        });
    });
  } catch (error) {
    // console.log('Error:', error);
  }
};

// set up a count variable to count the number of fetch requests since the reboot
// let count = 0;

const app = express();
app.use(cors());
app.use(express.json());
// app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); // Add express.urlencoded() middleware

// Add the following middleware to handle CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

const conversation = [];
let model = [];

app.post('/initial-data', async (req, res) => {
  try {
    const data = req.body; // Access the sent data
    conversation.push(...data.conversation);
    model = data.model;
    console.log(typeof(model));
    // Process the data and perform necessary operations

    // Send a response back if needed
    // res.send('Data received successfully');
    res.sendStatus(200);
  } catch (err) {
    console.log(err.message);
  }
});

app.post('/chat', async (req, res) => {
  try {
    const response = await fetch(process.env.OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        // model: 'gpt-3.5-turbo',
        model: model,
        messages: conversation,
        max_tokens: 100,
        stream: true, //for the streaming purpose
      }),
    });

    if (!response.ok) {
      // if the request was not successful, parse the error
      const error = await response.json();

      // log the error for debugging purposes
      console.error('OpenAI API Error:', error);

      // return an error response to the client
      return res.json({ status: 'error', data: null });
    }

    let chunks = [];
    for await (let chunk of response.body) {
      chunks.push(chunk);
    }

    let chunk = Buffer.concat(chunks).toString(); // Convert Buffer to string

    // console.log(chunk);
    const lines = chunk.split('\n');
    const parsedLines = lines
      .map((line) => line.replace(/^data: /, '').trim()) // Remove the "data: " prefix
      .filter((line) => line !== '' && line !== '[DONE]') // Remove empty lines and "[DONE]"
      .map((line) => JSON.parse(line)); // Parse the JSON string

    // const responseId = Date.now();
    let assistantContent = [];

    for (const parsedLine of parsedLines) {
      const { choices } = parsedLine;
      const { delta } = choices[0];
      const { content } = delta;
      if (content) {
        const botResponse = content;
        // console.log(`Content: ${botResponse}`);
        assistantContent.push(botResponse);
      }
    }
    console.log(assistantContent);
    // const data = await response.json();
    // const answer = data?.choices?.[0]?.message?.content;
    // // console.log(res.json({ status: 'success', data: answer }));
    // return res.json({ status: 'success', data: answer });
    // res.sendStatus();
  } catch (err) {
    console.log('an error was caught');
  }
});

// app.post('/chat', async (req, res) => {
//   try {
//     const model = req.query.model;
//     const userMessage = req.query.userMessage;
//     // const conversation = JSON.parse(req.query.conversation);
//     // console.log(req.query);
//     // console.log(userMessage);

//     conversation.push({ role: 'user', content: userMessage });

//     // Set headers for SSE
//     res.setHeader('Content-Type', 'text/event-stream');
//     res.setHeader('Cache-Control', 'no-cache');
//     res.setHeader('Connection', 'keep-alive');
//     console.log(conversation);

//     await generateResponse(model, conversation, res);
//     // console.log(conversation);
//   } catch (error) {
//     // console.log(error);
//     res.status(500).send({ error });
//   }
// });

app.listen(5000, () => {
  console.log('Server is listening');
});

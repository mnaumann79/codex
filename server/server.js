/* 
hosted at https://render.com; connected with GitHub
https://www.youtube.com/watch?v=2FeymQoKvrk&ab_channel=JavaScriptMastery
*/

import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';

// Only for testing purposes, do not use in production
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

dotenv.config();

// console.log(process.env.OPENAI_API_KEY);

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from Codex',
  });
});

// app.post('/', async (req, res) => {
//   try {
//     const prompt = req.body.prompt;

//     const response = await openai.createChatCompletion({
//       model: 'gpt-3.5-turbo',
//       // messages: [{"role":"user", "content": "Hello World"}],
//       messages: [{ role: 'user', content: `${prompt}` }],
//       // prompt: `${prompt}`,
//       // prompt:
//       //   "The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n\nHuman: Hello, who are you?\nAI: I am an AI created by OpenAI. How can I help you today?\nHuman: I'd like to cancel my subscription.\nAI:",
//       temperature: 0.01,
//       max_tokens: 3000,
//       top_p: 1,
//       frequency_penalty: 0.0,
//       presence_penalty: 0.6,
//       stop: [' Human:', ' AI:'],
//     });

//     // console.log(response.data.choices[0].message.content);
//     // console.log(response.model);

//     res.status(200).send({
//       bot: response.data.choices[0].message.content,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({ error });
//   }
// });

async function generateResponse(messages) {
  console.log(messages);
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      // model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    // Check if the response contains the message content
    return response.data.choices[0].message.content;
  } catch (error) {
    console.log('Error:', error);
  }
}

app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.userMessage;
    const conversation = req.body.conversation;

    conversation.push({ role: 'user', content: userMessage });

    const botResponse = await generateResponse(conversation);

    conversation.push({ role: 'assistant', content: botResponse });

    // console.log(
    //   'Sending botResponse:',
    //   botResponse,
    //   'and conversation:',
    //   conversation
    // );

    res.status(200).send({ botResponse, conversation });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port http://localhost:5000');
});

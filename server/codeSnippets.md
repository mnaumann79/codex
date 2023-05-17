##### initial streaming function
```js
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

  for (const parsedLine of parsedLines) {
    const { choices } = parsedLine;
    const { delta } = choices[0];
    const { content } = delta;
    if (content) {
      const botResponse = content;
      // console.log(`Content: ${botResponse}`);
      // assistantContent += botResponse;
      sendSse(responseId, { botResponse });
    }
  }
messages.push({
  role: 'assistant',
  content: `${assistantContent}`,
});
const conversation = messages;
// console.log(messages);

sendSse(responseId, { conversation });
```

##### check if the server is live
```js

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from Codex',
  });
});
```

Sure, you can use the `markdown-it` library to render the bot's response in markdown format. First, you need to install the library using npm or yarn:

```
npm install markdown-it
```

or

```
yarn add markdown-it
```

Then, you need to import the library and create an instance of it:

```javascript
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();
```

Finally, you can use the `render` method of the `md` instance to render the bot's response in markdown format:

```javascript
if (response.ok) {
  const data = await response.json();
  const parsedData = data.botResponse.trim();
  const messageHtml = md.render(parsedData);
  typeText(messageDiv, messageHtml);
  conversation = data.conversation;
  console.log(conversation);
}
```

This will render the bot's response in markdown format and display it in the chat window


render the output with the marked library
bot
Sure thing! To use the marked library, you'll need to include it in your HTML file. Here's an example of how you can use it in your chatStripe function:

```javascript
function chatStripe(isAi, value, uniqueId) {
  const markdownValue = marked(value);
  
  return `    
      <div class="wrapper ${isAi && 'ai'}">
        <div class="chat">
          <div class="profile">
            <img 
              src="${isAi ? bot : user}" 
              alt="${isAi ? 'bot' : 'user'}" 
            />
          </div>
          <div class="message" id="${uniqueId}">${markdownValue}</div>
        </div>
      </div>
    `;
}
```

This will convert the `value` parameter to HTML using the marked library and display it in the chat message.
user
how do I include it in the html file
bot
You can include the marked library in your HTML file by adding the following script tag to your `head` section:

```html
<head>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
```

This will load the latest version of the marked library from the jsDelivr CDN. You can also download the library and host it locally if you prefer.
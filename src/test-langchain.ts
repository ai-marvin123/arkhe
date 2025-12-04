import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';

// 1. Initialize the model
const model = new ChatOpenAI({
  model: 'gpt-4.1-mini',
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
});

// 2. Create a prompt template
const prompt = PromptTemplate.fromTemplate(`
You are a friendly assistant.
User said: "{input}"
Here's the history of the chat: "{chat_history}"
Reply in ONE short sentence.
`);

// 3. Create memory
const memory = new InMemoryChatMessageHistory();

// 4. Run function
async function run(message: string) {
  console.log('User:', message);

  await memory.addUserMessage(message);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  // console.log(memory);
  const history = await memory.getMessages();
  console.log(history);

  const response = await chain.invoke({
    chat_history: history,
    input: message,
  });

  console.log('AI:', response);

  // Save AI response to memory
  await memory.addAIMessage(response);
}

//
// CLI input: node test-langchain.ts "Hello"
//
// const userInput = process.argv.slice(2).join(" ") || "Hello!";

async function chatting() {
  const userInput1 = 'My name is John.';

  await run(userInput1);

  const userInput2 = 'Whats my name?';

  await run(userInput2);
}

chatting();

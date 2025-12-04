import dotenv from 'dotenv';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';

dotenv.config();

async function testLangChainWithHistory() {
  console.log('🚀 Starting Memory Test...');

  // 1. SETUP MODEL
  const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash-lite',
    temperature: 0.7,
    apiKey: process.env.GOOGLE_API_KEY,
  });

  // 2. SETUP MEMORY
  const history = new InMemoryChatMessageHistory();

  // 3. SETUP PROMPT
  const prompt = ChatPromptTemplate.fromMessages([
    // A. System Message
    ['system', 'You are a helpful assistant. You speak very briefly.'],

    // B. Placeholder
    new MessagesPlaceholder('chat_history'),

    // C. User Message
    ['human', '{input}'],
  ]);

  // 4. CREATE CHAIN
  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  // TURN 1:

  console.log('\n--- Turn 1 ---');
  const input1 = 'Hi, my name is John Wick.';

  await history.addUserMessage(input1);

  const currentHistory1 = await history.getMessages();

  const response1 = await chain.invoke({
    chat_history: currentHistory1,
    input: input1,
  });

  console.log(`User: ${input1}`);
  console.log(`AI:   ${response1}`);

  await history.addAIMessage(response1);

  // 🔄 TURN 2

  console.log('\n--- Turn 2 ---');
  const input2 = 'What is my name?';

  await history.addUserMessage(input2);
  const currentHistory2 = await history.getMessages();

  const response2 = await chain.invoke({
    chat_history: currentHistory2,
    input: input2,
  });

  console.log(`User: ${input2}`);
  console.log(`AI:   ${response2}`);

  await history.addAIMessage(response2);
}

testLangChainWithHistory();

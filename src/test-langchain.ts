import dotenv from 'dotenv';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';

dotenv.config();

async function testLangChain() {
  console.log('🚀 Starting LangChain Test...');

  const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash-lite', // Or "gpt-3.5-turbo" if using OpenAI
    temperature: 0.7,
    apiKey: process.env.GOOGLE_API_KEY, // Ensure you have this in .env
  });

  const prompt = PromptTemplate.fromTemplate(
    'Tell me a very short joke about {topic}.'
  );

  // THE CHAIN (Pipe)

  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  console.log('🤖 Asking AI...');

  // invoke() triggers the chain. We pass the data for {topic}.
  const response = await chain.invoke({ topic: 'Programmers' });

  console.log('✅ AI Response:');
  console.log(response);
}

testLangChain();

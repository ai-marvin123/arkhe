// src/mocks/chatMocks.ts
// import { AiResponsePayload } from '../types';

export const MOCK_GREETING = {
  type: 'TEXT',
  message:
    'Hello! I am your Architecture Assistant. Describe a project (e.g., "React with Redux") and I will generate the folder structure for you.',
  data: undefined,
};

export const MOCK_CLARIFICATION = {
  type: 'TEXT',
  message:
    'I understood you want a backend structure, but could you specify the framework? (e.g., Express, NestJS, or Fastify?)',
  data: undefined,
};

export const MOCK_LONG_EXPLANATION = {
  type: 'TEXT',
  message:
    'I have analyzed your request. A Clean Architecture typically divides the project into 4 layers: Entities, Use Cases, Controllers, and Frameworks. Since you asked for a simple version, I will combine Entities and Use Cases into a single "Core" folder in the next step.',
  data: undefined,
};

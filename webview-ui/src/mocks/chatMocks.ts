import type { AiPayload } from '../types';

export const simpleChatMock: AiPayload = {
  type: 'TEXT' as const,
  message: 'This is a chat mock response.',
};

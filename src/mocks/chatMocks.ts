import type { AiResponsePayload } from "../types";

export const simpleChatMock: AiResponsePayload = {
  type: "TEXT" as const,
  message: "This is a chat mock response.",
};

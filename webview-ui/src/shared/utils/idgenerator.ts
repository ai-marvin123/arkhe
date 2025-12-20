// Generate session id UUID random
const sessionId = crypto.randomUUID();
console.log(`Session ID is ${sessionId}`);

//generate unique ID for rendered components
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

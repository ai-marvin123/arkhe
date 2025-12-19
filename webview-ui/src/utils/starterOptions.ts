export const STARTER_OPTIONS = [
  {
    id: 'starter_web',
    label: '🌐 Web Application',
    prompt:
      'Create a full-stack web architecture with a React frontend, Node.js API, and a PostgreSQL database. Show the data flow between them.',
  },
  {
    id: 'starter_mobile',
    label: '📱 Mobile App',
    prompt:
      'Design a mobile app infrastructure using Flutter, Firebase Authentication, and a Cloud Firestore database.',
  },
  {
    id: 'starter_auth',
    label: '🔐 Auth Sequence',
    prompt:
      'Generate a sequence diagram for a modern OAuth2 login flow including the authorization code exchange.',
  },
];

export const createStarterAction = (prompt: string) => ({
  type: 'send_starterOption' as const,
  payload: prompt,
});

// src/mocks/diagramMocks.ts
// import { AiResponsePayload } from '../types';

export const MOCK_REACT_ARCH = {
  type: 'DIAGRAM',
  message: 'Here is the basic React + Vite structure you requested.',
  data: {
    mermaidSyntax: `graph TD;
      root(root/)-->src(src/);
      src-->components(components/);
      src-->App(App.tsx);
      components-->Button(Button.tsx);`,
    jsonStructure: {
      nodes: [
        { id: 'root', label: 'root', type: 'FOLDER', level: 0, path: '/' },
        {
          id: 'src',
          label: 'src',
          type: 'FOLDER',
          level: 1,
          path: '/src',
          parentId: 'root',
        },
        {
          id: 'components',
          label: 'components',
          type: 'FOLDER',
          level: 2,
          path: '/src/components',
          parentId: 'src',
        },
        {
          id: 'App',
          label: 'App.tsx',
          type: 'FILE',
          level: 2,
          path: '/src/App.tsx',
          parentId: 'src',
        },
        {
          id: 'Button',
          label: 'Button.tsx',
          type: 'FILE',
          level: 3,
          path: '/src/components/Button.tsx',
          parentId: 'components',
        },
      ],
      edges: [
        { source: 'root', target: 'src' },
        { source: 'src', target: 'components' },
        { source: 'src', target: 'App' },
        { source: 'components', target: 'Button' },
      ],
    },
  },
};

export const MOCK_NESTJS_ARCH = {
  type: 'DIAGRAM',
  message: 'I have generated a scalable NestJS architecture with Modules.',
  data: {
    mermaidSyntax: `graph TD;
      root(root/)-->src(src/);
      src-->main(main.ts);
      src-->modules(modules/);
      modules-->users(users/);
      users-->controller(user.controller.ts);
      users-->service(user.service.ts);`,
    jsonStructure: {
      nodes: [
        { id: 'root', label: 'root', type: 'FOLDER', level: 0, path: '/' },
        {
          id: 'src',
          label: 'src',
          type: 'FOLDER',
          level: 1,
          path: '/src',
          parentId: 'root',
        },
        {
          id: 'main',
          label: 'main.ts',
          type: 'FILE',
          level: 2,
          path: '/src/main.ts',
          parentId: 'src',
        },
        {
          id: 'modules',
          label: 'modules',
          type: 'FOLDER',
          level: 2,
          path: '/src/modules',
          parentId: 'src',
        },
        {
          id: 'users',
          label: 'users',
          type: 'FOLDER',
          level: 3,
          path: '/src/modules/users',
          parentId: 'modules',
        },
        {
          id: 'controller',
          label: 'user.controller.ts',
          type: 'FILE',
          level: 4,
          path: '/src/modules/users/user.controller.ts',
          parentId: 'users',
        },
        {
          id: 'service',
          label: 'user.service.ts',
          type: 'FILE',
          level: 4,
          path: '/src/modules/users/user.service.ts',
          parentId: 'users',
        },
      ],
      edges: [
        { source: 'root', target: 'src' },
        { source: 'src', target: 'main' },
        { source: 'src', target: 'modules' },
        { source: 'modules', target: 'users' },
        { source: 'users', target: 'controller' },
        { source: 'users', target: 'service' },
      ],
    },
  },
};

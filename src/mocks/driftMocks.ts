const MOCK_ALL_MATCHED = {
  command: 'AI_RESPONSE',
  payload: {
    type: 'ALL_MATCHED',
    message: 'Perfect Sync! Every file in your plan exists in the repository.',
  },
};

const MOCK_MISSING_DIAGRAM = {
  command: 'AI_RESPONSE',
  payload: {
    type: 'MISSING_DIAGRAM',
    message:
      "Analysis: High drift detected in 'src/auth'. It seems you deleted the Auth module and 'legacy-utils.ts'.\n\nSuggestion: Sync to remove these nodes from your plan.",
    data: {
      mermaidSyntax:
        'graph TD; src(src)-->src/app.ts(app.ts); src(src)-->src/controllers(controllers); src/controllers(controllers)-->src/controllers/UserController.ts(UserController.ts); src/controllers(controllers)-->src/controllers/ProductController.ts(ProductController.ts); src(src)-->src/services(services); src/services(services)-->src/services/UserService.ts(UserService.ts); src(src)-->src/auth(auth); src/auth(auth)-->src/auth/AuthService.ts(AuthService.ts); src/auth(auth)-->src/auth/AuthController.ts(AuthController.ts); src/services(services)-->src/utils/legacy-utils.ts(legacy-utils.ts);',
      jsonStructure: {
        nodes: [
          // --- MATCHED NODES ---
          {
            id: 'src',
            label: 'src',
            type: 'FOLDER',
            level: 0,
            path: 'src',
            parentId: null,
            status: 'MATCHED',
          },
          {
            id: 'src/app.ts',
            label: 'app.ts',
            type: 'FILE',
            level: 1,
            path: 'src/app.ts',
            parentId: 'src',
            status: 'MATCHED',
          },

          {
            id: 'src/controllers',
            label: 'controllers',
            type: 'FOLDER',
            level: 1,
            path: 'src/controllers',
            parentId: 'src',
            status: 'MATCHED',
          },
          {
            id: 'src/controllers/UserController.ts',
            label: 'UserController.ts',
            type: 'FILE',
            level: 2,
            path: 'src/controllers/UserController.ts',
            parentId: 'src/controllers',
            status: 'MATCHED',
          },
          {
            id: 'src/controllers/ProductController.ts',
            label: 'ProductController.ts',
            type: 'FILE',
            level: 2,
            path: 'src/controllers/ProductController.ts',
            parentId: 'src/controllers',
            status: 'MATCHED',
          },

          {
            id: 'src/services',
            label: 'services',
            type: 'FOLDER',
            level: 1,
            path: 'src/services',
            parentId: 'src',
            status: 'MATCHED',
          },
          {
            id: 'src/services/UserService.ts',
            label: 'UserService.ts',
            type: 'FILE',
            level: 2,
            path: 'src/services/UserService.ts',
            parentId: 'src/services',
            status: 'MATCHED',
          },

          // --- MISSING NODES ---
          {
            id: 'src/auth',
            label: 'auth',
            type: 'FOLDER',
            level: 1,
            path: 'src/auth',
            parentId: 'src',
            status: 'MISSING',
          },
          {
            id: 'src/auth/AuthService.ts',
            label: 'AuthService.ts',
            type: 'FILE',
            level: 2,
            path: 'src/auth/AuthService.ts',
            parentId: 'src/auth',
            status: 'MISSING',
          },
          {
            id: 'src/auth/AuthController.ts',
            label: 'AuthController.ts',
            type: 'FILE',
            level: 2,
            path: 'src/auth/AuthController.ts',
            parentId: 'src/auth',
            status: 'MISSING',
          },

          {
            id: 'src/utils/legacy-utils.ts',
            label: 'legacy-utils.ts',
            type: 'FILE',
            level: 2,
            path: 'src/utils/legacy-utils.ts',
            parentId: 'src/services',
            status: 'MISSING',
          },
        ],
        edges: [
          { source: 'src', target: 'src/app.ts' },
          { source: 'src', target: 'src/controllers' },
          {
            source: 'src/controllers',
            target: 'src/controllers/UserController.ts',
          },
          {
            source: 'src/controllers',
            target: 'src/controllers/ProductController.ts',
          },
          { source: 'src', target: 'src/services' },
          { source: 'src/services', target: 'src/services/UserService.ts' },

          { source: 'src', target: 'src/auth' },
          { source: 'src/auth', target: 'src/auth/AuthService.ts' },
          { source: 'src/auth', target: 'src/auth/AuthController.ts' },
          { source: 'src/services', target: 'src/utils/legacy-utils.ts' },
        ],
      },
    },
  },
};

const MOCK_UNTRACKED_DIAGRAM = {
  command: 'AI_RESPONSE',
  payload: {
    type: 'UNTRACKED_DIAGRAM',
    message:
      "New files detected! We found a new 'orders' module and some config files. Run Sync to add them.",
    data: {
      mermaidSyntax:
        'graph TD; jest.config.js(jest.config.js); src(src)-->src/app.ts(app.ts); src(src)-->src/controllers(controllers); src/controllers(controllers)-->src/controllers/UserController.ts(UserController.ts); src(src)-->src/orders(orders); src/orders(orders)-->src/orders/OrderService.ts(OrderService.ts); src/orders(orders)-->src/orders/OrderController.ts(OrderController.ts); src/orders(orders)-->src/orders/dto(dto); src/orders/dto(dto)-->src/orders/dto/create-order.dto.ts(create-order.dto.ts);',
      jsonStructure: {
        nodes: [
          // --- MATCHED NODES ---
          {
            id: 'src',
            label: 'src',
            type: 'FOLDER',
            level: 0,
            path: 'src',
            parentId: null,
            status: 'MATCHED',
          },
          {
            id: 'src/app.ts',
            label: 'app.ts',
            type: 'FILE',
            level: 1,
            path: 'src/app.ts',
            parentId: 'src',
            status: 'MATCHED',
          },

          {
            id: 'src/controllers',
            label: 'controllers',
            type: 'FOLDER',
            level: 1,
            path: 'src/controllers',
            parentId: 'src',
            status: 'MATCHED',
          },
          {
            id: 'src/controllers/UserController.ts',
            label: 'UserController.ts',
            type: 'FILE',
            level: 2,
            path: 'src/controllers/UserController.ts',
            parentId: 'src/controllers',
            status: 'MATCHED',
          },

          // --- UNTRACKED NODES ---
          {
            id: 'jest.config.js',
            label: 'jest.config.js',
            type: 'FILE',
            level: 0,
            path: 'jest.config.js',
            parentId: null,
            status: 'UNTRACKED',
          },

          {
            id: 'src/orders',
            label: 'orders',
            type: 'FOLDER',
            level: 1,
            path: 'src/orders',
            parentId: 'src',
            status: 'UNTRACKED',
          },
          {
            id: 'src/orders/OrderService.ts',
            label: 'OrderService.ts',
            type: 'FILE',
            level: 2,
            path: 'src/orders/OrderService.ts',
            parentId: 'src/orders',
            status: 'UNTRACKED',
          },
          {
            id: 'src/orders/OrderController.ts',
            label: 'OrderController.ts',
            type: 'FILE',
            level: 2,
            path: 'src/orders/OrderController.ts',
            parentId: 'src/orders',
            status: 'UNTRACKED',
          },
          {
            id: 'src/orders/dto',
            label: 'dto',
            type: 'FOLDER',
            level: 2,
            path: 'src/orders/dto',
            parentId: 'src/orders',
            status: 'UNTRACKED',
          },
          {
            id: 'src/orders/dto/create-order.dto.ts',
            label: 'create-order.dto.ts',
            type: 'FILE',
            level: 3,
            path: 'src/orders/dto/create-order.dto.ts',
            parentId: 'src/orders/dto',
            status: 'UNTRACKED',
          },
        ],
        edges: [
          { source: 'src', target: 'src/app.ts' },
          { source: 'src', target: 'src/controllers' },
          {
            source: 'src/controllers',
            target: 'src/controllers/UserController.ts',
          },

          { source: 'src', target: 'src/orders' },
          { source: 'src/orders', target: 'src/orders/OrderService.ts' },
          { source: 'src/orders', target: 'src/orders/OrderController.ts' },
          { source: 'src/orders', target: 'src/orders/dto' },
          {
            source: 'src/orders/dto',
            target: 'src/orders/dto/create-order.dto.ts',
          },
        ],
      },
    },
  },
};

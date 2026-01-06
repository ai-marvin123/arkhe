<div align="center">
  <img src="icon.png" alt="Arkhe Logo" width="128" />
  <h1>Arkhe - AI Architect</h1>
  <p><strong>Visualize. Collaborate. Evolve.</strong></p>
  <p>An AI-powered VS Code extension that turns your ideas into structured architecture diagrams and keeps them in sync with your codebase.</p>

  <p>
    <a href="https://github.com/ai-marvin123/arkhe/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/ai-marvin123/arkhe?style=flat-square" alt="License" />
    </a>
    <a href="https://github.com/ai-marvin123/arkhe/issues">
      <img src="https://img.shields.io/github/issues/ai-marvin123/arkhe?style=flat-square" alt="Open Issues" />
    </a>
    <a href="https://github.com/ai-marvin123/arkhe/pulls">
      <img src="https://img.shields.io/github/issues-pr/ai-marvin123/arkhe?style=flat-square" alt="PRs Welcome" />
    </a>
    <a href="https://www.typescriptlang.org/">
      <img src="https://img.shields.io/badge/Made%20with-TypeScript-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    </a>
  </p>
</div>

---

## 📖 About

**Arkhe** bridges the gap between conceptual design and physical implementation. It lives directly inside VS Code and uses advanced LLMs to help you visualize abstract ideas into concrete folder structures, render them as interactive Mermaid diagrams, and monitor the "drift" between your planned architecture and the actual file system.

Whether you are starting a new project or refactoring an existing one, Arkhe ensures your documentation and code never fall out of step.

## ✨ Key Features

- **🧠 AI-Powered Design**: Describe your stack (e.g., "Next.js with Prisma and tRPC") and get a best-practice folder structure generated instantly.
- **📊 Instant Visualization**: See your architecture as an interactive **Mermaid.js** graph before you write a single line of code.
- **🔍 Drift Detection**: Arkhe compares your architectural plan (`.repoplan.json`) against your actual file system to highlight missing or untracked files.
- **🔄 Guided Sync**: A step-by-step wizard to resolve differences—update your plan or scaffold the missing files.
- **🔒 Secure**: Your keys are stored safely using VS Code's native SecretStorage.

## 🛠 Tech Stack

We use modern web technologies to build a seamless extension experience:

- **Extension Host**: TypeScript
- **UI**: React, Vite, Tailwind CSS (Webview)
- **AI Orchestration**: LangChain.js
- **Diagramming**: Mermaid.js
- **State Management**: Zustand / Context API

## � Getting Started (Local Development)

Want to contribute or build it locally? Follow these steps:

### Prerequisites

- Node.js (v18+)
- npm or pnpm
- VS Code

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/ai-marvin123/arkhe.git
    cd arkhe
    ```

2.  **Install dependencies**

    ```bash
    npm install
    # Install webview dependencies
    cd webview-ui && npm install && cd ..
    ```

3.  **Run in Debug Mode**
    - Open the project in VS Code.
    - Press `F5` to launch the **Extension Development Host**.
    - In the new window, run the command `Arkhe: Open Chat`.

### Building the VSIX

To create a distributable `.vsix` file:

```bash
npm run vscode:prepublish
npx vsce package
```

## 🤝 Contributing

We love contributions! Whether it's a bug fix, new feature, or documentation improvement.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ by the Arkhe Team.</sub>
</div>

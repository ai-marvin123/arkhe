# Arkhe - AI Architect

> **Visualize. Collaborate. Evolve.**
>
> An AI-powered VS Code extension that turns your ideas into structured architecture diagrams and keeps them in sync with your codebase.

**Arkhe** is your intelligent architectural companion living directly inside VS Code. It bridges the gap between conceptual design and physical implementation.

## Overview

Arkhe helps you visualize abstract ideas into concrete folder structures using AI, renders them instanly as interactive Mermaid diagrams, and monitors the "drift" between your planned architecture and the actual file system.

### Why Arkhe?

- **Visualize** abstract ideas immediately.
- **Render** structures as interactive diagrams.
- **Monitor** drift between plan and code.
- **Sync** changes seamlessly.

---

## Key Features

### 1. AI-Powered Architecture Design

_Stop drawing boxes manually._

- **Chat Interface**: Describe your project idea in plain English (e.g., "A React app with Redux and a Python Flask backend").
- **Intelligent Generation**: Uses advanced LLMs to generate best-practice folder and file structures.
- **Structured Output**: Consistent and parsable architecture definitions.

### 2. Instant Visualization

_See your code before you write it._

- **Auto-Rendering**: Instantly renders proposed structure as a Mermaid graph.
- **Interactive Nodes**: Clear differentiation between Folders and Files.
- **Visual Feedback**: Immediate validation of your architecture.

### 3. Drift Detection & Management

_Keep your plan and reality aligned._

- **Smart Comparison**: Compares your saved plan (`.repoplan.json`) against actual files.
- **Status Indicators**:
  - ✅ **MATCHED**: Files exist in plan and disk.
  - ❌ **MISSING**: Planned but not created.
  - ⚠️ **UNTRACKED**: On disk but not in plan.
- **AI Analysis**: Explains _why_ drift occurred and suggests fixes.

### 4. Guided Synchronization Flow

_Resolve conflicts with confidence._

- **Interactive Resolution**: Step-by-step wizard for drift resolution.
- **Sync to Actual**: One-click update to match file system.
- **Keep Plan**: Preserve your architectural vision.

### 5. Secure & Developer-Centric

- **Local Execution**: File scanning and rendering happen locally.
- **Secret Storage**: API keys stored securely via VS Code SecretStorage.
- **Workspace Aware**: Respects `.gitignore`.

---

## How to Use

1.  **Open Arkhe**:

    - Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
    - Run **"Arkhe: Open Chat"**.

2.  **Design**:

    - Type your architecture idea (e.g., "Create a DDD-based Node.js API with Auth users").
    - Watch Arkhe generate the plan and visualize it.

3.  **Manage**:
    - view the generated Mermaid diagram.
    - Save the plan to track it.
    - As you code, check Arkhe to see if your file structure drifts from the plan.

---

## Configuration

Arkhe uses the VS Code Secret Storage for your API keys to ensure security.

1.  When prompted, enter your OpenAI API Key.
2.  Arkhe will securely store it for future sessions.

## Technical Stack

Arkhe is built with:

- **VS Code API** & **TypeScript**
- **React**, **Vite**, **Tailwind CSS** (Webview)
- **LangChain.js** (AI Orchestration)
- **Mermaid.js** (Diagramming)

## Contributing & Support

Found a bug or have a feature request? strictly [Open an issue](https://github.com/ai-marvin123/arkhe/issues) on our GitHub repository.

**Enjoy building with Arkhe!**

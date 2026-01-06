# Arkhe - AI Architect

> **Visualize. Collaborate. Evolve.**
> An AI-powered VS Code extension that turns your ideas into structured architecture diagrams and keeps them in sync with your codebase.

## 🚀 Overview

**Arkhe** is your intelligent architectural companion living directly inside VS Code. It bridges the gap between conceptual design and physical implementation by allowing developers to:

1.  **Visualize** abstract ideas into concrete folder structures using AI.
2.  **Render** these structures instantly as interactive Mermaid diagrams.
3.  **Monitor** the "drift" between the planned architecture and the actual file system.
4.  **Sync** changes seamlessly to ensuring your documentation and code never fall out of step.

---

## 🌟 Key Features

### 1. 🧠 AI-Powered Architecture Design

_Stop drawing boxes manually._

- **Chat Interface**: Describe your project idea in plain English (e.g., "A React app with Redux and a Python Flask backend").
- **Intelligent Generation**: Arkhe uses advanced LLMs (OpenAI GPT-4o-mini supported) to generate a complete, best-practice folder and file structure.
- **Structured Output**: AI responses are strictly formatted as JSON, ensuring consistent and parsable architecture definitions every time.

### 2. 📊 Instant Visualization (Mermaid.js)

_See your code before you write it._

- **Auto-Rendering**: As soon as the AI proposes a structure, Arkhe renders it as a clean, easy-to-read Mermaid graph.
- **Interactive Nodes**: Differentiate clearly between Folders (containers) and Files (leaf nodes).
- **Visual Feedback**: Immediate visual validation of the proposed architecture.

### 3. 🔍 Drift Detection & Management

_Keep your plan and reality aligned._

- **Smart Comparison**: Arkhe compares your saved architectural plan (`.repoplan.json`) against the actual files on your disk.
- **Smart Categorization**:
  - ✅ **MATCHED**: Files that exist in both plan and disk.
  - ❌ **MISSING**: Files planned but not yet created (or deleted).
  - ⚠️ **UNTRACKED**: Files on disk that weren't in the original plan.
- **AI Analysis**: Ask the AI to analyze _why_ drift occurred and suggest fixes (e.g., "It looks like you renamed `utils` to `helpers`").

### 4. 🔄 Guided Synchronization Flow

_Resolve conflicts with confidence._

- **Interactive Resolution**: A step-by-step wizard guides you when drift is detected.
- **Sync to Actual**: One-click update to make your diagram match the current file system.
- **Keep Plan**: Choose to preserve your architectural vision in the diagram.

### 5. 🔒 Secure & Developer-Centric

- **Local Execution**: File scanning and diagram rendering happen locally on your machine.
- **Secret Storage**: API keys are stored securely using VS Code's native SecretStorage API, not in plain text configs.
- **Workspace Aware**: Automatically respects `.gitignore` rules to keep your diagrams clean and relevant.

---

## 🛠 Technical Architecture

### Tech Stack

- **Extension Host**: TypeScript, VS Code API
- **Webview UI**: React, Vite, Tailwind CSS
- **AI Orchestration**: LangChain.js
- **Diagramming**: Mermaid.js

### Core Services (`src/services`)

1.  **`AiService`**: Manages the LLM lifecycle, prompt engineering (System Prompts), and JSON validation (Zod schemas). It handles the conversion of natural language -> JSON -> Mermaid Syntax.
2.  **`FileService`**: The bridge to the file system. Recursively scans directories, filters ignored files, and reads/writes the `.repoplan.json` state file.
3.  **`DriftService`**: The logic engine for comparison. It computes the set difference between the "Plan Graph" and "Disk Graph" to identify drifted nodes.
4.  **`ConfigManager`**: Centralized singleton for handling configuration scopes (Global vs Workspace) and secure secret retrieval.

### Data Flow

1.  **User Prompt** → `AiService` (LangChain) → **JSON Structure**
2.  **JSON Structure** → `MermaidGenerator` → **Mermaid Syntax**
3.  **Frontend** renders Mermaid Syntax → **User Approval**
4.  **Save** → `FileService` writes to `.repoplan.json`
5.  **Drift Check** → `FileService` scans Disk → `DriftService` compares with `.repoplan.json` → **Frontend** displays Diff Status

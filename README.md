# Q-Wan Flow 🚀

A powerful, complete AI workflow builder platform specialized for Qwen and Wan models. Build, automate, and scale your AI ideas with a visual node-based editor.

## 🌟 Key Features

### Core Functionality
- **Node-Based Editor**: Drag-and-drop interface powered by React Flow.
- **Project Management**: Create, edit, delete, and organize your AI projects.
- **Sharing & Collaboration**: 
    - **Edit Mode**: Collaborate on workflows.
    - **View-Only Mode**: Share workflows where others can read nodes and comments but cannot modify structure.
- **Workflow Execution Engine**: Topological sort engine that executes nodes with proper dependency handling.

### Advanced Capabilities
- **Rich Node Library**:
    - **Qwen Text**: Specialized LLM generation.
    - **Wan Image (T2I/Edit)**: State-of-the-art image generation and editing.
    - **Wan Video (T2V/I2V/R2V)**: Comprehensive video generation tools.
    - **Text-to-Speech**: High-quality voice synthesis.
    - **Comment Nodes**: Collaborative notes with avatar support.
- **Asset Library**: Centralized management for your generated images, videos, and uploaded prompts.
- **Limits & Plans**: Built-in support for Free (limited projects/storage) and Pro (unlimited) user plans.

---

## 🏗️ Architecture

- **Backend**: FastAPI, PostgreSQL, SQLAlchemy (with PostgreSQL storage tracking).
- **Frontend**: React, Vite, TailwindCSS, DaisyUI (Premium Dark/Nebula themes).
- **Service**: Integrated with Alibaba Cloud DashScope (Qwen & Wan).

---

## 🚀 Quick Start (Production)

The fastest way to deploy is using **Docker Compose**.

1.  **Clone & Configure**:
    ```bash
    git clone https://github.com/your-repo/q-wanflow.git
    cd q-wanflow
    ```

2.  **Setup Environment**: Create a `.env` in the root (see `production_guide.md` for details).
    ```env
    DATABASE_URL=postgresql://user:pass@host:5432/db
    SECRET_KEY=your_secret
    BASE_URL=http://your-server-ip:8000
    ```

3.  **Launch app stack**:
    ```bash
    docker compose up --build -d
    ```

4.  **Optional infra stack** (only if you also want PostgreSQL from this repo):
    ```bash
    docker compose -f docker-compose.infra.yml up -d
    ```

For detailed production instructions, see [production_guide.md](./production_guide.md).

---

## 🛠️ Development Setup

### Backend Setup
1. Install dependencies: `pip install -r backend/requirements.txt`
2. Run database migration: `python backend/scripts/add_storage_column.py`
3. Start: `cd backend && uvicorn main:app --reload`

### Frontend Setup
1. Install dependencies: `cd frontend && npm install`
2. Start: `npm run dev`

---

## 📂 Project Structure

```
.
├── backend/            # FastAPI Application
│   ├── app/            # Core Logic, Models, Routes
│   ├── scripts/        # Database Migrations & Utilities
│   └── static/         # Uploaded Assets & Profile Pictures
├── frontend/           # React/Vite Application
│   ├── src/components/ # Reusable UI & Node Primitives
│   ├── src/page/       # Main Route Components
│   └── src/stores/     # Zustand State Management
├── docker-compose.yml        # App stack (backend + frontend)
└── docker-compose.infra.yml  # Optional infra stack (PostgreSQL)
```

---

## 🔒 Security & Privacy

- **JWT Authentication** + **Google OAuth** integration.
- **Port Forwarding**: Frontend serves through Nginx which proxies `/api` safely.
- **Encrypted Keys**: Service API keys are managed per-user in the secure database.

---

## 📜 License

MIT License. See [LICENSE](LICENSE) for more details.

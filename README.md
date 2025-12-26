# Custom AI Agent - Turborepo Monorepo

A monorepo containing a NestJS backend and Next.js frontend for chatting with a local Llama 3.2 model via Ollama.

## 🐳 Quick Start with Docker (Recommended)

The easiest way to run the entire application is with Docker. This will automatically set up Ollama, pull the model, and start both the backend and frontend.

### Prerequisites for Docker

- **Docker** and **Docker Compose** installed
- For GPU acceleration (optional): NVIDIA GPU with CUDA support

### Run with Docker

**For systems with NVIDIA GPU:**
```bash
docker compose up --build
```

**For CPU-only systems:**
```bash
docker compose -f docker-compose.cpu.yml up --build
```

That's it! 🎉 The application will:
1. Start Ollama
2. Automatically pull the configured model (default: `llama3.2:1b`)
3. Start the backend API
4. Start the frontend

Open [http://localhost:3000](http://localhost:3000) and start chatting!

### Using a Different Model

**Option 1: Using a `.env` file (Recommended)**

Create a `.env` file in the project root:

```bash
# .env
OLLAMA_MODEL=llama3.2:1b
```

Then simply run:
```bash
docker compose -f docker-compose.cpu.yml up --build
```

Change the model anytime by editing `.env`:
```bash
# .env
OLLAMA_MODEL=mistral
```

**Option 2: Command line**

```bash
# Use a different model
OLLAMA_MODEL=mistral docker compose -f docker-compose.cpu.yml up --build

# Or with llama3.2:3b
OLLAMA_MODEL=llama3.2:3b docker compose -f docker-compose.cpu.yml up --build
```

**Popular models to try:**
- `llama3.2:1b` - Fast, lightweight (default)
- `llama3.2:3b` - Better quality, still fast
- `mistral` - Great all-around model
- `codellama` - Optimized for code
- `phi3` - Microsoft's efficient model

### Stop the Containers

```bash
docker compose down

# To also remove the Ollama model data:
docker compose down -v
```

---

## 💻 Manual Setup (Development)

If you prefer to run the application manually without Docker:

### Prerequisites

1. **Node.js** >= 18
2. **pnpm** >= 9.x (`npm install -g pnpm`)
3. **Ollama** installed and running locally

### Setting up Ollama

1. Install Ollama from [ollama.com](https://ollama.com)
2. Pull the Llama 3.2 1B model:
   ```bash
   ollama pull llama3.2:1b
   ```
3. Make sure Ollama is running (it runs on `http://localhost:11434` by default)

## Project Structure

```
custom-ai-agent/
├── apps/
│   ├── backend/     # NestJS API (port 3001)
│   └── frontend/    # Next.js app (port 3000)
├── packages/
│   └── tsconfig/    # Shared TypeScript configs
├── turbo.json       # Turborepo pipeline
└── pnpm-workspace.yaml
```

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Development

Run both apps in development mode:

```bash
pnpm dev
```

Or run them separately:

```bash
# Run only backend
pnpm dev:backend

# Run only frontend
pnpm dev:frontend
```

### Build

```bash
pnpm build
```

## Usage

1. Ensure Ollama is running with the llama3.2:1b model
2. Start the development servers with `pnpm dev`
3. Open [http://localhost:3000](http://localhost:3000) in your browser
4. Start chatting with the AI!

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Next.js App    │────▶│  NestJS API     │────▶│  Ollama         │
│  (port 3000)    │     │  (port 3001)    │     │  (port 11434)   │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     Frontend              Backend              LLM Runtime
```

## API Endpoints

### POST /chat

Send a message to the AI and receive a response.

**Request:**
```json
{
  "message": "Hello, how are you?"
}
```

**Response:**
```json
{
  "response": "I'm doing well, thank you for asking! How can I help you today?"
}
```

### GET /chat/health

Check the health status of Ollama and the configured model.

**Response:**
```json
{
  "status": "online",
  "model": "llama3.2:1b",
  "message": "Ready"
}
```

## 🐳 Docker Architecture

When running with Docker, the following services are created:

| Service | Container Name | Port | Description |
|---------|---------------|------|-------------|
| `ollama` | ai-agent-ollama | 11434 | Ollama LLM runtime |
| `ollama-pull` | ai-agent-ollama-pull | - | One-time model puller |
| `backend` | ai-agent-backend | 3001 | NestJS API server |
| `frontend` | ai-agent-frontend | 3000 | Next.js web app |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_MODEL` | `llama3.2:1b` | The Ollama model to use |
| `OLLAMA_BASE_URL` | `http://ollama:11434` | Ollama API URL (Docker) |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend API URL for frontend |

## Troubleshooting

### Docker Issues

1. **Model download is slow**: The first run downloads the model (~1.3GB for llama3.2:1b). Be patient!

2. **GPU not detected**: If you have an NVIDIA GPU but it's not detected, ensure you have:
   - NVIDIA Container Toolkit installed
   - Latest NVIDIA drivers
   - Use `docker compose` (not `docker-compose`)

3. **Out of memory**: Try a smaller model:
   ```bash
   OLLAMA_MODEL=llama3.2:1b docker compose -f docker-compose.cpu.yml up --build
   ```

4. **Port conflicts**: If ports 3000, 3001, or 11434 are in use, stop the conflicting services or modify the ports in `docker-compose.yml`.


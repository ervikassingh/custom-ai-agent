# Custom AI Agent - Turborepo Monorepo

A monorepo containing a NestJS backend and Next.js frontend for chatting with a local Llama 3.2 model via Ollama, with **RAG (Retrieval-Augmented Generation)** capabilities for context-aware responses.

## ✨ Features

- 🤖 **Local LLM** - Chat with Llama 3.2 via Ollama (no API keys needed)
- 🔍 **RAG Integration** - Context-aware responses using your own data
- 🗄️ **PostgreSQL** - Document storage and management
- 🎯 **Qdrant** - Vector database for semantic search
- ⏰ **Auto-sync** - Hourly cron job syncs documents to vector DB
- 🐳 **Docker Ready** - One command to run everything

## 🐳 Quick Start with Docker (Recommended)

The easiest way to run the entire application is with Docker. This will automatically set up Ollama, PostgreSQL, Qdrant, pull the models, and start both the backend and frontend.

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
1. Start PostgreSQL database
2. Start Qdrant vector database
3. Start Ollama
4. Automatically pull the LLM model (default: `llama3.2:1b`)
5. Automatically pull the embedding model (`nomic-embed-text`)
6. Seed sample documents into PostgreSQL
7. Start the backend API
8. Start the frontend

Open [http://localhost:3000](http://localhost:3000) and start chatting!

### Sync Documents to Vector DB

After startup, trigger a sync to index documents for RAG:

```bash
# Full sync (all documents)
curl -X POST http://localhost:3001/rag/sync

# Check sync status
curl http://localhost:3001/rag/sync/status
```

### Using a Different Model

**Option 1: Using a `.env` file (Recommended)**

Create a `.env` file in the project root:

```bash
# .env
OLLAMA_MODEL=llama3.2:1b
EMBEDDING_MODEL=nomic-embed-text
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

# To also remove all data (PostgreSQL, Qdrant, Ollama models):
docker compose down -v
```

---

## 💻 Manual Setup (Development)

If you prefer to run the application manually without Docker:

### Prerequisites

1. **Node.js** >= 18
2. **pnpm** >= 9.x (`npm install -g pnpm`)
3. **Ollama** installed and running locally
4. **PostgreSQL** running locally
5. **Qdrant** running locally (optional, for RAG)

### Setting up Ollama

1. Install Ollama from [ollama.com](https://ollama.com)
2. Pull the required models:
   ```bash
   ollama pull llama3.2:1b
   ollama pull nomic-embed-text
   ```
3. Make sure Ollama is running (it runs on `http://localhost:11434` by default)

### Setting up PostgreSQL

Create a database for the application:
```bash
createdb ai_agent
```

### Setting up Qdrant

Run Qdrant locally:
```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

## Project Structure

```
custom-ai-agent/
├── apps/
│   ├── backend/          # NestJS API (port 3001)
│   │   └── src/
│   │       ├── chat/     # Chat module (LLM interaction)
│   │       ├── database/ # PostgreSQL entities & seeding
│   │       ├── embedding/# Embedding service (Ollama)
│   │       ├── qdrant/   # Vector database service
│   │       └── rag/      # RAG module (sync, search, scheduler)
│   └── frontend/         # Next.js app (port 3000)
├── packages/
│   └── tsconfig/         # Shared TypeScript configs
├── turbo.json            # Turborepo pipeline
└── pnpm-workspace.yaml
```

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Environment Variables

Create a `.env` file in `apps/backend/`:

```bash
# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
EMBEDDING_MODEL=nomic-embed-text

# PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=ai_agent

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=documents
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

1. Ensure Ollama, PostgreSQL, and Qdrant are running
2. Start the development servers with `pnpm dev`
3. Open [http://localhost:3000](http://localhost:3000) in your browser
4. Trigger a sync: `curl -X POST http://localhost:3001/rag/sync`
5. Start chatting with RAG-powered AI!

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Next.js App    │────▶│  NestJS API     │────▶│  Ollama         │
│  (port 3000)    │     │  (port 3001)    │     │  (port 11434)   │
│                 │◀────│                 │◀────│  - LLM          │
└─────────────────┘     └────────┬────────┘     │  - Embeddings   │
     Frontend                    │              └─────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
           ┌─────────────────┐       ┌─────────────────┐
           │  PostgreSQL     │       │  Qdrant         │
           │  (port 5432)    │       │  (port 6333)    │
           │  Documents      │──────▶│  Vectors        │
           └─────────────────┘       └─────────────────┘
              Source Data            Vector Search
```

### RAG Flow

1. **Ingestion**: Documents in PostgreSQL → Chunked → Embedded → Stored in Qdrant
2. **Query**: User question → Embedded → Qdrant similarity search → Top-k relevant chunks
3. **Generation**: Relevant context + question → Ollama LLM → Response

## API Endpoints

### Chat

#### POST /chat

Send a message to the AI and receive a RAG-augmented response.

**Request:**
```json
{
  "message": "What services do you offer?"
}
```

**Response:**
```json
{
  "response": "Based on the available information, I offer Web3 and blockchain development services including smart contract development, dApp development, and blockchain consulting..."
}
```

#### GET /chat/health

Check the health status of Ollama and the configured model.

**Response:**
```json
{
  "status": "online",
  "model": "llama3.2:1b",
  "message": "Ready"
}
```

### RAG Sync

#### POST /rag/sync

Trigger a full sync of all documents from PostgreSQL to Qdrant.

**Response:**
```json
{
  "success": true,
  "type": "full",
  "documentsSynced": 15,
  "chunksCreated": 23,
  "duration": 5420
}
```

#### POST /rag/sync/incremental

Trigger an incremental sync (only documents modified since last sync).

#### GET /rag/sync/status

Get the current sync status and statistics.

**Response:**
```json
{
  "isSyncing": false,
  "lastSync": {
    "type": "full",
    "status": "completed",
    "documentsSynced": 15,
    "completedAt": "2024-01-15T10:30:00Z"
  },
  "qdrantPointsCount": 23,
  "documentsCount": 15
}
```

#### POST /rag/search

Test RAG search (debug endpoint).

**Request:**
```json
{
  "query": "blockchain development",
  "limit": 5
}
```

## 🐳 Docker Architecture

When running with Docker, the following services are created:

| Service | Container Name | Port | Description |
|---------|---------------|------|-------------|
| `postgres` | ai-agent-postgres | 5432 | PostgreSQL database |
| `qdrant` | ai-agent-qdrant | 6333, 6334 | Qdrant vector database |
| `ollama` | ai-agent-ollama | 11434 | Ollama LLM runtime |
| `ollama-pull` | ai-agent-ollama-pull | - | One-time model puller |
| `backend` | ai-agent-backend | 3001 | NestJS API server |
| `frontend` | ai-agent-frontend | 3000 | Next.js web app |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_MODEL` | `llama3.2:1b` | The Ollama LLM model to use |
| `EMBEDDING_MODEL` | `nomic-embed-text` | The Ollama embedding model |
| `OLLAMA_BASE_URL` | `http://ollama:11434` | Ollama API URL (Docker) |
| `DATABASE_HOST` | `postgres` | PostgreSQL host |
| `DATABASE_PORT` | `5432` | PostgreSQL port |
| `DATABASE_USER` | `postgres` | PostgreSQL username |
| `DATABASE_PASSWORD` | `postgres` | PostgreSQL password |
| `DATABASE_NAME` | `ai_agent` | PostgreSQL database name |
| `QDRANT_URL` | `http://qdrant:6333` | Qdrant API URL |
| `QDRANT_COLLECTION` | `documents` | Qdrant collection name |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend API URL for frontend |

## 📝 Adding Your Own Data

The application comes with sample seed data. To add your own documents:

1. Edit `apps/backend/src/database/seeds/seed.service.ts`
2. Modify the `SAMPLE_DOCUMENTS` array with your content
3. Restart the application or call the force-seed endpoint
4. Trigger a sync: `curl -X POST http://localhost:3001/rag/sync`

### Document Structure

```typescript
{
  title: 'Document Title',
  content: 'Full text content to be embedded and searched...',
  category: 'faq', // Optional: for filtering
  metadata: { type: 'faq', priority: 'high' } // Optional: extra data
}
```

## Troubleshooting

### Docker Issues

1. **Model download is slow**: The first run downloads models (~1.3GB for llama3.2:1b, ~275MB for nomic-embed-text). Be patient!

2. **GPU not detected**: If you have an NVIDIA GPU but it's not detected, ensure you have:
   - NVIDIA Container Toolkit installed
   - Latest NVIDIA drivers
   - Use `docker compose` (not `docker-compose`)

3. **Out of memory**: Try a smaller model:
   ```bash
   OLLAMA_MODEL=llama3.2:1b docker compose -f docker-compose.cpu.yml up --build
   ```

4. **Port conflicts**: If ports 3000, 3001, 5432, 6333, or 11434 are in use, stop the conflicting services or modify the ports in `docker-compose.yml`.

5. **Database connection issues**: Ensure PostgreSQL is healthy before backend starts. The Docker Compose healthchecks handle this automatically.

### RAG Issues

1. **No context in responses**: Make sure you've run the sync:
   ```bash
   curl -X POST http://localhost:3001/rag/sync
   ```

2. **Embedding errors**: Ensure the embedding model is pulled:
   ```bash
   ollama pull nomic-embed-text
   ```

3. **Check sync status**:
   ```bash
   curl http://localhost:3001/rag/sync/status
   ```

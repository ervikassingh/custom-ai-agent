# Custom AI Agent - Turborepo Monorepo

A monorepo containing a NestJS backend and Next.js frontend for chatting with a local Llama 3.2 model via Ollama.

## Prerequisites

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


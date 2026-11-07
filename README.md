# 📚 Technical Documentation Support Copilot — Vector RAG

> A semantic search assistant that answers developer and product-support questions grounded in your own uploaded documentation — with cited passage evidence.

---

## 🌍 Overview

Upload your API references, product manuals, SDK guides, release notes, configuration instructions, and troubleshooting guides. Ask questions such as _"How do I rotate an API key?"_ and receive answers grounded in retrieved passages with citations.

The assistant:
- **Declines** out-of-scope questions not covered by uploaded documentation
- **Cites** exact source passages with relevance scores
- **Demonstrates** semantic retrieval — finding conceptually relevant text even when it doesn't repeat the exact wording of the question

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router) + React 19 + TypeScript, lucide-react icons, responsive CSS |
| **Backend** | FastAPI + Uvicorn (Python 3.12) |
| **Vector Store** | PostgreSQL 16 + pgvector |
| **Embeddings & Chat** | OpenAI API (`text-embedding-3-small` / `gpt-4o-mini`) |
| **Document Parsing** | pypdf, python-docx |
| **Containerization** | Docker Compose (db + backend + frontend) |

---

## 📁 Folder Structure

```text
technical-documentation-support-copilot/
├── backend/                     # 🐍 FastAPI service (API + RAG pipeline)
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py              # Endpoints, chunking, embeddings, pgvector search, LLM call
│   ├── Dockerfile               # Python 3.12 image running uvicorn on :8000
│   └── requirements.txt         # Python dependencies
│
├── frontend/                    # ⚛️ Next.js 16 web app (UI)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout + metadata
│   │   │   ├── page.tsx         # Main chat workspace (state, chat, upload flow)
│   │   │   └── globals.css      # Design system + responsive styles
│   │   ├── components/
│   │   │   ├── Sidebar.tsx      # Document library, drag & drop upload, model info
│   │   │   └── ChatMessage.tsx  # Message bubbles, citation badges, source cards
│   │   └── lib/
│   │       └── api.ts           # Typed API client for the backend
│   ├── next.config.mjs          # Proxies /api/* → backend
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile               # Multi-stage Node 22 build, serves on :3000
│
├── uploads/                     # Uploaded source files (git-ignored, mounted into backend)
├── docker-compose.yml           # Orchestrates db, backend, frontend
├── .env.example                 # Environment variable template
└── README.md
```

---

## 🏛️ Architecture

### System Overview

```mermaid
flowchart LR
    User(["👤 User (Browser)"])

    subgraph FE["Frontend — Next.js 16 :3000"]
        UI["Chat Workspace + Sidebar"]
        Proxy["/api/* rewrite proxy"]
    end

    subgraph BE["Backend — FastAPI :8000"]
        API["REST Endpoints"]
        Parse["Text Extraction (pypdf / python-docx)"]
        Chunk["Chunker (900 words, 140 overlap)"]
        Retr["Retriever (cosine similarity)"]
        Prompt["Scoped Prompt Builder"]
    end

    subgraph DB["PostgreSQL 16 + pgvector :5433"]
        Docs[("documents")]
        Chunks[("chunks + vector(1536)")]
    end

    subgraph OAI["OpenAI API"]
        Emb["text-embedding-3-small"]
        LLM["gpt-4o-mini"]
    end

    User --> UI --> Proxy --> API
    API --> Parse --> Chunk --> Emb
    Emb --> Chunks
    API --> Docs
    API --> Retr --> Chunks
    Retr --> Prompt --> LLM --> API
```

### Ingestion Pipeline (Indexing)

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FE as Next.js Frontend
    participant BE as FastAPI Backend
    participant OAI as OpenAI Embeddings
    participant PG as Postgres + pgvector

    U->>FE: Drop / select file (PDF, DOCX, MD, TXT, CSV)
    FE->>BE: POST /api/documents (multipart)
    BE->>BE: Save to uploads/, extract text
    BE->>BE: Split into overlapping chunks (900 / 140 words)
    BE->>OAI: embeddings.create(chunks)
    OAI-->>BE: 1536-dim vectors
    BE->>PG: INSERT documents + chunks(content, embedding)
    BE-->>FE: { id, name, chunks }
    FE-->>U: "Indexed N passages"
```

### Query Pipeline (Retrieval-Augmented Generation)

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FE as Next.js Frontend
    participant BE as FastAPI Backend
    participant OAI as OpenAI
    participant PG as Postgres + pgvector

    U->>FE: Ask question
    FE->>BE: POST /api/chat { question, top_k }
    BE->>OAI: Embed question
    OAI-->>BE: Query vector
    BE->>PG: ORDER BY embedding <=> query LIMIT top_k
    PG-->>BE: Top-K chunks + cosine scores
    BE->>BE: Build context with [Source N] labels + scoped system prompt
    BE->>OAI: chat.completions (gpt-4o-mini, temperature 0)
    OAI-->>BE: Grounded answer with citations
    BE-->>FE: { answer, sources[] }
    FE-->>U: Answer + citation badges + source cards with scores
```

---

## ⚙️ How It Works

1. Documents are uploaded and parsed (PDF, DOCX, TXT, Markdown, CSV)
2. Text is split into overlapping chunks (900 words, 140-word overlap)
3. Chunks are embedded and stored in pgvector
4. At query time, the question is embedded and nearest-neighbour chunks are retrieved (cosine distance `<=>`)
5. Retrieved chunks are passed to the chat model with strict scoping instructions
6. The answer is returned with source citations and relevance scores

---

## 🚀 Run Locally

### Prerequisites
- Docker + Docker Compose
- OpenAI API key with available credits

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/shivang17d/Technical-Documentation-Support-Copilot.git
cd Technical-Documentation-Support-Copilot

# 2. Set up environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 3. Start all services
docker compose up --build
```

| Service | URL |
|---------|-----|
| **Frontend (App UI)** | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Interactive API Docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5433 |

### Running without Docker (development)

```bash
# Database only
docker compose up -d db

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DATABASE_URL=postgresql://rag:rag@localhost:5433/vector_rag uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev   # http://localhost:3000
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check — app, database and model status |
| `GET` | `/api/documents` | List all indexed documents (with chunk counts) |
| `POST` | `/api/documents` | Upload a document (`multipart/form-data`, field: `file`) |
| `DELETE` | `/api/documents/{id}` | Remove a document and its chunks |
| `POST` | `/api/chat` | Ask a question — body: `{ "question": "...", "top_k": 5 }` |
| `GET` | `/docs` | Interactive Swagger UI |

---

## 🏗️ Design Notes

- **Chunking** — simple word window (900 words, 140-word overlap); tune for your corpus
- **Embeddings** — stored at a fixed configured dimension; changing embedding models requires rebuilding the index
- **Scoped answers** — the system prompt strictly limits the assistant to technical documentation support and instructs it not to guess when evidence is insufficient
- **Frontend proxy** — Next.js rewrites `/api/*` to the backend, so the browser talks to a single origin
- **For production** — add auth, quotas, malware scanning, encrypted object storage, DB migrations, observability, backups, an ANN index (HNSW/IVFFlat), and a background job queue

---

## 📄 License

MIT

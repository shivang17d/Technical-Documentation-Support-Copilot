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
| **Backend** | FastAPI + Uvicorn |
| **Vector Store** | PostgreSQL 16 + pgvector |
| **Embeddings & Chat** | OpenAI API (`text-embedding-3-small` / `gpt-4o-mini`) |
| **Document Parsing** | pypdf, python-docx |
| **Frontend** | Vanilla JS + CSS (served by FastAPI) |
| **Containerization** | Docker Compose |
| **Runtime** | Python 3.12 |

---

## ⚙️ Implementation

Standalone document Q&A app using **FastAPI**, **PostgreSQL/pgvector**, and a browser UI served by the API.

**How it works:**
1. Documents are uploaded and parsed (PDF, DOCX, TXT, Markdown, CSV)
2. Text is split into overlapping chunks (900 words, 140-word overlap)
3. Chunks are embedded and stored in pgvector
4. At query time, the question is embedded and nearest-neighbour chunks are retrieved
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
| App UI | http://localhost:8000 |
| Interactive API Docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5433 |

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check — app + database status |
| `GET` | `/api/documents` | List all indexed documents |
| `POST` | `/api/documents` | Upload a document (`multipart/form-data`, field: `file`) |
| `DELETE` | `/api/documents/{id}` | Remove a document and its chunks |
| `POST` | `/api/chat` | Ask a question — body: `{ "question": "...", "top_k": 5 }` |
| `GET` | `/docs` | Interactive Swagger UI |

---

## 🏗️ Design Notes

- **Chunking** — simple word window (900 words, 140-word overlap); tune for your corpus
- **Embeddings** — stored at a fixed configured dimension; changing embedding models requires rebuilding the index
- **Scoped answers** — the system prompt strictly limits the assistant to technical documentation support and instructs it not to guess when evidence is insufficient
- **For production** — add auth, quotas, malware scanning, encrypted object storage, DB migrations, observability, backups, and a background job queue

---

## 📄 License

MIT

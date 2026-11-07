"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Menu, MessagesSquare, RotateCcw } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ChatMessage, { type Message } from "@/components/ChatMessage";
import { api, type DocumentItem, type Health } from "@/lib/api";

const STARTERS = [
  { label: "Authentication", text: "How do I rotate an API key?" },
  { label: "Configuration", text: "What environment variables are required for setup?" },
  { label: "Troubleshooting", text: "How do I resolve a connection timeout error?" },
  { label: "Release notes", text: "What changed in the latest release?" },
];

type Status = { kind: "info" | "success" | "error"; text: string };

const uid = () => Math.random().toString(36).slice(2);

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [status, setStatus] = useState<Status>({
    kind: "info",
    text: "Upload docs, then ask product and developer-support questions.",
  });
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [topK, setTopK] = useState(5);
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const refresh = useCallback(async () => {
    try {
      setDocuments(await api.listDocuments());
    } catch {
      setStatus({ kind: "error", text: "Database unavailable. Start the backend with Docker Compose." });
    }
  }, []);

  useEffect(() => {
    refresh();
    api
      .health()
      .then((h) => {
        setHealth(h);
        if (h.status === "ok" && !h.openai_configured) {
          setStatus({ kind: "error", text: "Set OPENAI_API_KEY in .env to enable embeddings and chat." });
        }
      })
      .catch(() => setHealth({ status: "degraded" }));
  }, [refresh]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, [input]);

  const handleUpload = async (file: File) => {
    const MAX_MB = 20;
    if (file.size > MAX_MB * 1024 * 1024) {
      setStatus({
        kind: "error",
        text: `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB — the upload limit is ${MAX_MB} MB.`,
      });
      return;
    }
    setUploading(true);
    setStatus({ kind: "info", text: `Indexing ${file.name}…` });
    try {
      const r = await api.upload(file);
      setStatus({ kind: "success", text: `Indexed ${r.chunks} passage${r.chunks === 1 ? "" : "s"} from ${r.name}` });
      await refresh();
    } catch (e) {
      setStatus({ kind: "error", text: (e as Error).message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.remove(id);
      setStatus({ kind: "info", text: "Document removed." });
    } catch (e) {
      setStatus({ kind: "error", text: (e as Error).message });
    }
    refresh();
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || sending) return;
    setInput("");
    setSending(true);
    const pendingId = uid();
    setMessages((m) => [
      ...m,
      { id: uid(), role: "user", text: q },
      { id: pendingId, role: "assistant", text: "", loading: true },
    ]);
    try {
      const r = await api.chat(q, topK);
      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingId ? { id: pendingId, role: "assistant", text: r.answer, sources: r.sources } : msg
        )
      );
    } catch (e) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingId
            ? { id: pendingId, role: "assistant", text: (e as Error).message, error: true }
            : msg
        )
      );
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const healthy = health?.status === "ok";

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        documents={documents}
        health={health}
        status={status}
        uploading={uploading}
        onUpload={handleUpload}
        onDelete={handleDelete}
      />

      <main className="workspace">
        <header className="workspace-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
              <Menu size={18} />
            </button>
            <div className="header-titles">
              <span className="eyebrow">Technical documentation support</span>
              <h2>Find answers in product docs</h2>
            </div>
          </div>
          <div className="header-controls">
            <label className="topk-control" title="Number of passages retrieved per question">
              Top-K
              <select value={topK} onChange={(e) => setTopK(Number(e.target.value))}>
                {[3, 5, 8, 12].map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
            {messages.length > 0 && (
              <button className="clear-btn" onClick={() => setMessages([])}>
                <RotateCcw size={13} />
                <span className="hide-mobile">Clear</span>
              </button>
            )}
            <span className={`health-pill ${healthy ? "" : "degraded"}`}>
              <i className="health-dot" />
              <span>{health === null ? "Checking…" : healthy ? "Connected" : "Degraded"}</span>
            </span>
          </div>
        </header>

        <div className="chat-scroll" ref={scrollRef}>
          <div className="chat-container">
            {messages.length === 0 ? (
              <div className="hero-empty">
                <div className="hero-badge">
                  <MessagesSquare size={24} />
                </div>
                <h3>Ask a product or developer question</h3>
                <p>
                  Answers are grounded in your uploaded documentation using semantic vector search, with
                  cited source passages and relevance scores.
                </p>
                <div className="starter-grid">
                  {STARTERS.map((s) => (
                    <button key={s.text} className="starter-card" onClick={() => send(s.text)}>
                      <span className="starter-card-label">{s.label}</span>
                      <span className="starter-card-text">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((m) => (
                  <ChatMessage key={m.id} message={m} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="composer-wrap">
          <div className="composer-inner">
            <form
              className="composer-form"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <textarea
                ref={textareaRef}
                className="composer-textarea"
                rows={1}
                placeholder="How do I configure this API?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
              />
              <button className="composer-send-btn" type="submit" disabled={!input.trim() || sending}>
                <ArrowUp size={18} />
              </button>
            </form>
            <div className="composer-Subbar">
              <span>Enter to send · Shift + Enter for a new line</span>
              <span className="hide-mobile">
                {documents.length} doc{documents.length === 1 ? "" : "s"} indexed
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


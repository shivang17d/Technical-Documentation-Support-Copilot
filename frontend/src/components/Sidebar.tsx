"use client";

import { useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import type { DocumentItem, Health } from "@/lib/api";

type Status = { kind: "info" | "success" | "error"; text: string };

type Props = {
  open: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  health: Health | null;
  status: Status;
  uploading: boolean;
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
};

const FORMATS = ["PDF", "DOCX", "MD", "TXT", "CSV"];

function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1, i + 5) : "doc";
}

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Sidebar({
  open,
  onClose,
  documents,
  health,
  status,
  uploading,
  onUpload,
  onDelete,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = documents.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase())
  );

  const StatusIcon =
    status.kind === "success" ? CheckCircle2 : status.kind === "error" ? AlertCircle : Info;

  return (
    <>
      <div className={`sidebar-backdrop ${open ? "open" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-mark">
              <BookOpen size={20} />
            </div>
            <div className="brand-text">
              <h1>Technical Docs Copilot</h1>
              <p>Vector RAG assistant</p>
            </div>
          </div>
          <button className="mobile-close-btn" onClick={onClose} aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-body">
          <div className="section-title-row">
            <span className="section-title">Documentation library</span>
            <span className="count-pill">
              {documents.length} file{documents.length === 1 ? "" : "s"}
            </span>
          </div>

          <div
            className={`upload-dropzone ${dragging ? "dragging" : ""} ${uploading ? "uploading" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) onUpload(f);
            }}
            role="button"
            tabIndex={0}
          >
            <div className="upload-icon-wrap">
              {uploading ? <Loader2 size={18} className="spin" /> : <UploadCloud size={18} />}
            </div>
            <div className="upload-title">{uploading ? "Indexing…" : "Add documentation"}</div>
            <div className="upload-subtitle">Drag & drop or click to browse</div>
            <div className="format-badges">
              {FORMATS.map((f) => (
                <span key={f} className="format-badge">
                  {f}
                </span>
              ))}
            </div>
            <input
              ref={inputRef}
              type="file"
              hidden
              accept=".pdf,.docx,.txt,.md,.csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
          </div>

          <div className={`status-banner ${status.kind}`}>
            <StatusIcon size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{status.text}</span>
          </div>

          {documents.length > 3 && (
            <div className="doc-search">
              <Search size={14} />
              <input
                placeholder="Filter documents…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}

          <div className="doc-list">
            {filtered.length === 0 ? (
              <div className="doc-empty">
                {documents.length === 0 ? "No documents indexed yet." : "No matches."}
              </div>
            ) : (
              filtered.map((d) => (
                <div key={d.id} className="doc-card">
                  <div className="doc-info">
                    <span className="doc-ext">{extOf(d.name)}</span>
                    <div className="doc-meta">
                      <div className="doc-name" title={d.name}>
                        {d.name}
                      </div>
                      <div className="doc-sub">
                        <span>{d.chunks} chunks</span>·<span>{relTime(d.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="doc-delete-btn"
                    title="Delete document"
                    onClick={() => onDelete(d.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-row">
            <span>Chat</span>
            <span className="model-tag">{health?.chat_model ?? "—"}</span>
          </div>
          <div className="sidebar-footer-row">
            <span>Embeddings</span>
            <span className="model-tag">{health?.embedding_model ?? "—"}</span>
          </div>
        </div>
      </aside>
    </>
  );
}


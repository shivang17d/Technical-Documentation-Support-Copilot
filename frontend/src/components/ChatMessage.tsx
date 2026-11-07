"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, FileText, Loader2, Sparkles } from "lucide-react";
import type { Source } from "@/lib/api";
import Markdown from "@/components/Markdown";

export type Message =
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "assistant";
      text: string;
      sources?: Source[];
      loading?: boolean;
      error?: boolean;
    };

export default function ChatMessage({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const sourceRefs = useRef<Record<number, HTMLDivElement | null>>({});

  if (message.role === "user") {
    return (
      <div className="msg-row user">
        <div className="msg-bubble">{message.text}</div>
      </div>
    );
  }

  const copy = async () => {
    await navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const openCitation = (n: number) => {
    setShowSources(true);
    setHighlight(n);
    requestAnimationFrame(() =>
      sourceRefs.current[n]?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    );
    setTimeout(() => setHighlight(null), 2000);
  };

  return (
    <div className="msg-row assistant">
      <div className="msg-avatar assistant">
        <Sparkles size={16} />
      </div>
      <div className="msg-bubble">
        <div className="assistant-header">
          <span className="assistant-label">Docs Copilot</span>
          {!message.loading && !message.error && (
            <button className="copy-btn" onClick={copy}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>

        {message.loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)" }}>
            <Loader2 size={15} className="spin" /> Searching your documents…
          </div>
        ) : message.error ? (
          <div className="answer-body" style={{ color: "var(--danger-text)" }}>
            {message.text}
          </div>
        ) : (
          <Markdown text={message.text} onCite={openCitation} />
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="sources-section">
            <button className="sources-toggle" onClick={() => setShowSources((s) => !s)}>
              <span>
                {message.sources.length} retrieved passage{message.sources.length === 1 ? "" : "s"}
              </span>
              {showSources ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showSources && (
              <div className="sources-grid">
                {message.sources.map((s, i) => {
                  const n = i + 1;
                  const pct = Math.max(0, Math.min(1, s.score)) * 100;
                  return (
                    <div
                      key={i}
                      ref={(el) => {
                        sourceRefs.current[n] = el;
                      }}
                      className={`source-card ${highlight === n ? "highlight" : ""}`}
                    >
                      <div className="source-card-header">
                        <span className="source-title">
                          <span className="source-rank">{n}</span>
                          <FileText size={13} />
                          {s.document}
                          <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                            · chunk #{s.ordinal + 1}
                          </span>
                        </span>
                        <span className="source-score-wrap">
                          <span className="score-bar-track">
                            <span className="score-bar-fill" style={{ width: `${pct}%`, display: "block" }} />
                          </span>
                          {s.score.toFixed(3)}
                        </span>
                      </div>
                      <div className="source-snippet">
                        {s.text.slice(0, 420)}
                        {s.text.length > 420 ? "…" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

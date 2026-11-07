export type DocumentItem = {
  id: string;
  name: string;
  status: string;
  created_at: string;
  chunks: number;
};

export type Source = {
  document: string;
  text: string;
  score: number;
  ordinal: number;
};

export type ChatResponse = {
  answer: string;
  sources: Source[];
};

export type Health = {
  status: "ok" | "degraded";
  database?: string;
  openai_configured?: boolean;
  chat_model?: string;
  embedding_model?: string;
  detail?: string;
};

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON response (e.g. plain "Internal Server Error")
  }
  if (!res.ok) {
    const detail =
      (data as { detail?: string } | null)?.detail ||
      text ||
      `Request failed (${res.status})`;
    throw new Error(detail);
  }
  return data as T;
}

export const api = {
  health: () => fetch("/api/health", { cache: "no-store" }).then((r) => parse<Health>(r)),
  listDocuments: () =>
    fetch("/api/documents", { cache: "no-store" }).then((r) => parse<DocumentItem[]>(r)),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch("/api/documents", { method: "POST", body: fd }).then((r) =>
      parse<{ id: string; name: string; chunks: number }>(r)
    );
  },
  remove: (id: string) =>
    fetch(`/api/documents/${id}`, { method: "DELETE" }).then((r) => parse<{ deleted: string }>(r)),
  chat: (question: string, top_k: number) =>
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, top_k }),
    }).then((r) => parse<ChatResponse>(r)),
};


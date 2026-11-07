"use client";

import { useState, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="md-codeblock">
      <div className="md-codeblock-bar">
        <span>{lang || "text"}</span>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Turns "[Source 2]" / "[Source 1, Source 3]" into markdown links handled by the `a` renderer. */
function linkCitations(md: string) {
  return md.replace(/\[((?:Source \d+(?:,\s*)?)+)\]/g, (_, inner: string) =>
    inner
      .split(/,\s*/)
      .map((s) => {
        const n = s.replace("Source ", "").trim();
        return `[${n}](#cite-${n})`;
      })
      .join("")
  );
}

export default function Markdown({
  text,
  onCite,
}: {
  text: string;
  onCite?: (n: number) => void;
}) {
  const components: Components = {
    a({ href, children, ...rest }: ComponentPropsWithoutRef<"a">) {
      if (href?.startsWith("#cite-")) {
        const n = Number(href.slice(6));
        return (
          <button
            type="button"
            className="citation-badge"
            title={`Show source ${n}`}
            onClick={() => onCite?.(n)}
          >
            {children}
          </button>
        );
      }
      return (
        <a href={href} target="_blank" rel="noreferrer" {...rest}>
          {children}
        </a>
      );
    },
    code({ className, children, ...rest }: ComponentPropsWithoutRef<"code">) {
      const match = /language-(\w+)/.exec(className || "");
      const content = String(children ?? "");
      const isBlock = Boolean(match) || content.includes("\n");
      if (isBlock) {
        return <CodeBlock lang={match?.[1] ?? ""} code={content.replace(/\n$/, "")} />;
      }
      return (
        <code className="md-inline-code" {...rest}>
          {children}
        </code>
      );
    },
    // CodeBlock renders its own <pre>; avoid nesting
    pre({ children }) {
      return <>{children}</>;
    },
    table({ children }) {
      return (
        <div className="md-table-wrap">
          <table>{children}</table>
        </div>
      );
    },
  };

  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {linkCitations(text)}
      </ReactMarkdown>
    </div>
  );
}


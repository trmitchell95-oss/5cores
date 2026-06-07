"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownToPlainText } from "@/lib/markdownToPlainText";

type MarkdownReportProps = {
  content: string;
  showCopyControls?: boolean;
  showDebugToggle?: boolean;
  className?: string;
};

export default function MarkdownReport({
  content,
  showCopyControls = true,
  showDebugToggle = false,
  className = "",
}: MarkdownReportProps) {
  const [copied, setCopied] = useState<"text" | "markdown" | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  async function copyCleanText() {
    await navigator.clipboard.writeText(markdownToPlainText(content));
    setCopied("text");
    window.setTimeout(() => setCopied(null), 1600);
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(content || "");
    setCopied("markdown");
    window.setTimeout(() => setCopied(null), 1600);
  }

  if (!content?.trim()) {
    return null;
  }

  return (
    <section className={`markdown-report ${className}`}>
      <style jsx global>{`
        .markdown-report {
          width: 100%;
          color: #f0ece4;
          line-height: 1.72;
          font-size: 1rem;
        }

        .markdown-report-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
          justify-content: flex-end;
          margin-bottom: 1rem;
        }

        .markdown-report-button {
          border: 1px solid rgba(200, 169, 110, 0.45);
          background: rgba(24, 20, 16, 0.9);
          color: #f0ece4;
          border-radius: 999px;
          padding: 0.45rem 0.8rem;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .markdown-report-button:hover {
          border-color: rgba(200, 169, 110, 0.9);
          background: rgba(45, 34, 24, 0.95);
        }

        .markdown-report-content {
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .markdown-report-content h1 {
          margin: 2rem 0 0.9rem;
          padding-bottom: 0.55rem;
          border-bottom: 1px solid rgba(200, 169, 110, 0.35);
          color: #f3c978;
          font-size: clamp(1.55rem, 4vw, 2.15rem);
          line-height: 1.15;
          letter-spacing: 0.01em;
        }

        .markdown-report-content h1:first-child {
          margin-top: 0;
        }

        .markdown-report-content h2 {
          margin: 1.65rem 0 0.75rem;
          color: #f0d9ad;
          font-size: clamp(1.18rem, 3vw, 1.48rem);
          line-height: 1.22;
          letter-spacing: 0.04em;
        }

        .markdown-report-content h3 {
          margin: 1.35rem 0 0.55rem;
          color: #f0d9ad;
          font-size: 1.08rem;
          line-height: 1.25;
        }

        .markdown-report-content p {
          margin: 0.75rem 0;
        }

        .markdown-report-content strong {
          color: #fff4d8;
          font-weight: 700;
        }

        .markdown-report-content em {
          color: #f5dfb8;
        }

        .markdown-report-content hr {
          border: 0;
          border-top: 1px solid rgba(200, 169, 110, 0.28);
          margin: 1.6rem 0;
        }

        .markdown-report-content ul,
        .markdown-report-content ol {
          margin: 0.75rem 0 0.95rem 1.35rem;
          padding-left: 0.8rem;
        }

        .markdown-report-content li {
          margin: 0.35rem 0;
        }

        .markdown-report-content blockquote {
          margin: 1rem 0;
          padding: 0.75rem 1rem;
          border-left: 3px solid rgba(200, 169, 110, 0.65);
          background: rgba(255, 255, 255, 0.04);
          color: #f1dfbd;
          border-radius: 0.45rem;
        }

        .markdown-report-content code {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 0.35rem;
          padding: 0.08rem 0.28rem;
          font-size: 0.92em;
        }

        .markdown-report-content pre {
          overflow-x: auto;
          background: rgba(0, 0, 0, 0.32);
          border: 1px solid rgba(200, 169, 110, 0.2);
          border-radius: 0.75rem;
          padding: 1rem;
          margin: 1rem 0;
        }

        .markdown-report-content pre code {
          background: transparent;
          border: 0;
          padding: 0;
        }

        .markdown-report-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          overflow: hidden;
          border-radius: 0.6rem;
        }

        .markdown-report-content th,
        .markdown-report-content td {
          border: 1px solid rgba(200, 169, 110, 0.25);
          padding: 0.6rem 0.7rem;
          text-align: left;
          vertical-align: top;
        }

        .markdown-report-content th {
          background: rgba(200, 169, 110, 0.12);
          color: #ffe7b2;
        }

        .markdown-report-raw {
          width: 100%;
          min-height: 220px;
          white-space: pre-wrap;
          color: #f0ece4;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(200, 169, 110, 0.25);
          border-radius: 0.75rem;
          padding: 1rem;
          overflow-x: auto;
        }

        @media (max-width: 640px) {
          .markdown-report {
            font-size: 0.97rem;
            line-height: 1.65;
          }

          .markdown-report-toolbar {
            justify-content: stretch;
          }

          .markdown-report-button {
            flex: 1;
          }

          .markdown-report-content h1 {
            margin-top: 1.45rem;
          }

          .markdown-report-content h2 {
            margin-top: 1.25rem;
          }
        }
      `}</style>

      {showCopyControls && (
        <div className="markdown-report-toolbar">
          <button className="markdown-report-button" type="button" onClick={copyCleanText}>
            {copied === "text" ? "Copied clean text" : "Copy clean text"}
          </button>

          <button className="markdown-report-button" type="button" onClick={copyMarkdown}>
            {copied === "markdown" ? "Copied Markdown" : "Copy Markdown"}
          </button>

          {showDebugToggle && (
            <button
              className="markdown-report-button"
              type="button"
              onClick={() => setShowRaw((value) => !value)}
            >
              {showRaw ? "Show rendered" : "Show raw Markdown"}
            </button>
          )}
        </div>
      )}

      {showRaw ? (
        <pre className="markdown-report-raw">{content}</pre>
      ) : (
        <div className="markdown-report-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      )}
    </section>
  );
}

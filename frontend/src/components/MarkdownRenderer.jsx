import React from "react";

function renderInline(text) {
  if (!text) return null;
  // Match bold, italic, code, links
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="bg-ink/[0.06] text-ink font-mono text-[12px] px-1.5 py-0.5 rounded border border-ink/[0.08]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={idx} className="italic text-ink/90">
          {part.slice(1, -1)}
        </em>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-signal hover:underline font-medium"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

export default function MarkdownRenderer({ content, className = "" }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];
  let currentList = null;
  let currentTable = null;

  function flushList() {
    if (!currentList) return;
    if (currentList.type === "ul") {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-4 list-disc marker:text-signal text-sm text-ink/90">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-2 space-y-1.5 pl-4 list-decimal marker:text-signal font-medium text-sm text-ink/90">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed font-normal">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  }

  function flushTable() {
    if (!currentTable) return;
    elements.push(
      <div key={`table-${elements.length}`} className="overflow-x-auto my-3 border border-ink/[0.08] rounded-lg">
        <table className="w-full text-xs text-left border-collapse">
          {currentTable.headers.length > 0 && (
            <thead className="bg-ink/[0.03] border-b border-ink/[0.08] text-ink font-semibold">
              <tr>
                {currentTable.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 border-r border-ink/[0.06] last:border-r-0">
                    {renderInline(h.trim())}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-ink/[0.04]">
            {currentTable.rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-ink/[0.01]">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-1.5 border-r border-ink/[0.04] last:border-r-0 text-ink/80">
                    {renderInline(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    currentTable = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Table detection: line starts and ends with |
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      const cells = trimmed.slice(1, -1).split("|");
      // Check if separator line
      const isSep = cells.every((c) => /^[\s:-]+$/.test(c));
      if (isSep) {
        continue;
      }
      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    if (!trimmed) {
      flushList();
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={`h4-${i}`} className="font-display font-semibold text-ink text-sm mt-3.5 mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-signal inline-block shrink-0" />
          <span>{renderInline(trimmed.slice(4))}</span>
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="font-display font-bold text-ink text-base mt-4 mb-2">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="font-display font-bold text-ink text-lg mt-4 mb-2">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote key={`bq-${i}`} className="my-2.5 pl-3 border-l-2 border-signal bg-signal-50/60 py-2 pr-3 rounded-r text-xs text-ink/80 italic">
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Bullet list (- or *)
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Numbered list (1. 2.)
    const numMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(numMatch[1]);
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-ink/90 my-1.5">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();
  flushTable();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}

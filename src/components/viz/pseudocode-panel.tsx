import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PseudocodePanelProps {
  lines: readonly string[];
  activeLine?: number | undefined;
}

const KEYWORDS = new Set([
  "if",
  "else",
  "for",
  "each",
  "while",
  "do",
  "return",
  "then",
  "to",
  "downto",
  "repeat",
  "until",
  "and",
  "or",
  "not",
  "in",
  "is",
  "null",
  "break",
  "continue",
  "function",
  "procedure",
  "error",
  "swap",
  "mod",
]);

/** Minimal highlighter: keywords, numbers, and // comments. */
function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  const commentAt = line.indexOf("//");
  const code = commentAt === -1 ? line : line.slice(0, commentAt);
  const comment = commentAt === -1 ? "" : line.slice(commentAt);
  code.split(/(\b[A-Za-z_]+\b|\b\d+\b)/).forEach((part, i) => {
    if (!part) return;
    if (KEYWORDS.has(part))
      out.push(
        <span key={i} className="text-primary">
          {part}
        </span>,
      );
    else if (/^\d+$/.test(part))
      out.push(
        <span key={i} className="text-viz-pivot">
          {part}
        </span>,
      );
    else if (/^[A-Z]{3,}$/.test(part))
      out.push(
        <span key={i} className="text-viz-swap">
          {part}
        </span>,
      );
    else out.push(part);
  });
  if (comment)
    out.push(
      <span key="c" className="italic text-muted-foreground">
        {comment}
      </span>,
    );
  return out;
}

export function PseudocodePanel({ lines, activeLine }: PseudocodePanelProps) {
  return (
    <ol className="overflow-x-auto rounded-md border border-border bg-surface py-2 font-mono text-xs">
      {lines.map((line, index) => {
        const active = index === activeLine;
        return (
          <li
            key={index}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex gap-3 whitespace-pre px-3 py-0.5",
              active && "bg-accent font-medium text-accent-foreground",
            )}
          >
            <span className="w-4 shrink-0 select-none text-right text-muted-foreground">
              {index + 1}
            </span>
            <span>
              {active ? "▸ " : "  "}
              {highlight(line)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

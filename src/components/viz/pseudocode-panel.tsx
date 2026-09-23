import { cn } from "@/lib/utils";

interface PseudocodePanelProps {
  lines: string[];
  activeLine?: number | undefined;
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
              {line}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

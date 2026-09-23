export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>AlgoViz — visualisations generated directly from algorithm state transitions.</p>
        <p className="font-mono">React · TypeScript · Tailwind</p>
      </div>
    </footer>
  );
}

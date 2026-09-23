import { Link } from "@tanstack/react-router";
import { ArrowRight, Hammer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ComingSoonProps {
  title: string;
  planned: string[];
}

export function ComingSoon({ title, planned }: ComingSoonProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Hammer className="size-4 text-primary" aria-hidden />
            {title} — in development
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This module is built on the same step engine as the sorting visualizer. The engine,
            animation controller, and UI primitives are already in place; the visualisations listed
            below are landing next.
          </p>
          <ul className="space-y-1.5 text-sm">
            {planned.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="font-mono text-primary">
                  ·
                </span>
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <Button asChild variant="outline">
            <Link to="/sort">
              Explore the sorting visualizer <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

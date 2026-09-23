import { Shuffle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sortingAlgorithms } from "@/algorithms/registry";
import { MAX_ARRAY_SIZE, MIN_ARRAY_SIZE, parseCustomValues } from "@/lib/array-input";

interface ArrayControlsProps {
  algorithmId: string;
  onAlgorithmChange: (id: string) => void;
  size: number;
  onSizeChange: (size: number) => void;
  onRandomise: () => void;
  onCustomValues: (values: number[]) => void;
}

export function ArrayControls({
  algorithmId,
  onAlgorithmChange,
  size,
  onSizeChange,
  onRandomise,
  onCustomValues,
}: ArrayControlsProps) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);

  const apply = () => {
    const { values, error: parseError } = parseCustomValues(raw);
    if (!values) {
      setError(parseError);
      return;
    }
    setError(null);
    onCustomValues(values);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Input</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="algorithm-select">Algorithm</Label>
          <Select value={algorithmId} onValueChange={onAlgorithmChange}>
            <SelectTrigger id="algorithm-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortingAlgorithms.map((algorithm) => (
                <SelectItem key={algorithm.id} value={algorithm.id}>
                  {algorithm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="size-slider">Array size</Label>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{size}</span>
          </div>
          <Slider
            id="size-slider"
            min={MIN_ARRAY_SIZE}
            max={MAX_ARRAY_SIZE}
            step={1}
            value={[size]}
            onValueChange={([value]) => onSizeChange(value ?? MIN_ARRAY_SIZE)}
            aria-label="Array size"
          />
        </div>

        <Button variant="secondary" className="w-full" onClick={onRandomise}>
          <Shuffle className="size-4" /> Generate random array
        </Button>

        <div className="space-y-1.5">
          <Label htmlFor="custom-values">Custom values</Label>
          <div className="flex gap-2">
            <Input
              id="custom-values"
              inputMode="numeric"
              placeholder="e.g. 42, 7, 19, 3"
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") apply();
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "custom-values-error" : "custom-values-hint"}
              className="font-mono"
            />
            <Button variant="outline" onClick={apply}>
              Apply
            </Button>
          </div>
          {error ? (
            <p id="custom-values-error" role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : (
            <p id="custom-values-hint" className="text-xs text-muted-foreground">
              Whole numbers 1–999, comma separated (max {MAX_ARRAY_SIZE}).
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

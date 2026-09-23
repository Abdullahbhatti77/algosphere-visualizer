import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SPEED_LEVELS, type SpeedId, type StepPlayer } from "@/hooks/use-step-player";

interface PlaybackBarProps {
  player: StepPlayer;
  totalSteps: number;
  speed: SpeedId;
  onSpeedChange: (speed: SpeedId) => void;
}

export function PlaybackBar({ player, totalSteps, speed, onSpeedChange }: PlaybackBarProps) {
  const lastIndex = Math.max(0, totalSteps - 1);

  return (
    <section
      aria-label="Playback controls"
      className="sticky bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={player.restart}
            aria-label="Restart from first step"
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={player.previous}
            disabled={player.index === 0}
            aria-label="Previous step"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            onClick={player.toggle}
            className="min-w-24"
            aria-label={player.isPlaying ? "Pause" : "Play"}
          >
            {player.isPlaying ? (
              <>
                <Pause className="size-4" /> Pause
              </>
            ) : (
              <>
                <Play className="size-4" /> Play
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={player.next}
            disabled={player.isFinished}
            aria-label="Next step"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={player.skipToEnd}
            disabled={player.isFinished}
            aria-label="Skip to last step"
          >
            <SkipForward className="size-4" />
          </Button>
        </div>

        <div className="flex flex-1 items-center gap-3">
          <Label htmlFor="step-scrubber" className="sr-only">
            Step position
          </Label>
          <Slider
            id="step-scrubber"
            min={0}
            max={lastIndex}
            step={1}
            value={[player.index]}
            onValueChange={([value]) => player.goTo(value ?? 0)}
            aria-label="Step position"
            className="flex-1"
          />
          <span className="min-w-20 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
            {totalSteps === 0 ? 0 : player.index + 1}/{totalSteps}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="speed-select" className="shrink-0 text-xs text-muted-foreground">
            Speed
          </Label>
          <Select value={speed} onValueChange={(value) => onSpeedChange(value as SpeedId)}>
            <SelectTrigger id="speed-select" className="w-36" aria-label="Playback speed">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPEED_LEVELS.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}

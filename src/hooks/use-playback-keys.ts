import { useEffect } from "react";

import type { StepPlayer } from "./use-step-player";

/**
 * Global playback shortcuts (Space, ←/→, R). Ignored while typing in form
 * fields or when an element opts out with `data-own-keys`.
 */
export function usePlaybackKeys(player: StepPlayer, extra?: (event: KeyboardEvent) => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.closest("[data-own-keys]"))) return;
      if (target?.getAttribute("role") === "combobox" || target?.closest("[role=listbox]")) return;
      if (event.key === " " && target?.tagName !== "BUTTON") {
        event.preventDefault();
        player.toggle();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        player.next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        player.previous();
      } else if (event.key.toLowerCase() === "r" && !event.metaKey && !event.ctrlKey) {
        player.restart();
      } else {
        extra?.(event);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [player, extra]);
}

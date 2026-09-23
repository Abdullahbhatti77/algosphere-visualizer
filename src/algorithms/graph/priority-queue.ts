/**
 * Binary min-heap keyed by numeric priority. Ties break on insertion order
 * (then an optional tie key) so runs are deterministic.
 */
export class MinHeap<T> {
  private items: { value: T; priority: number; seq: number; tie: string }[] = [];
  private counter = 0;

  get size(): number {
    return this.items.length;
  }

  push(value: T, priority: number, tie = ""): void {
    this.items.push({ value, priority, seq: this.counter++, tie });
    this.up(this.items.length - 1);
  }

  pop(): { value: T; priority: number } | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0]!;
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      this.down(0);
    }
    return { value: top.value, priority: top.priority };
  }

  /** Sorted snapshot (for display only). */
  snapshot(): { value: T; priority: number }[] {
    return [...this.items]
      .sort((a, b) => this.cmp(a, b))
      .map(({ value, priority }) => ({ value, priority }));
  }

  private cmp(
    a: { priority: number; seq: number; tie: string },
    b: { priority: number; seq: number; tie: string },
  ): number {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.tie !== b.tie) return a.tie < b.tie ? -1 : 1;
    return a.seq - b.seq;
  }

  private up(i: number): void {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.cmp(this.items[i]!, this.items[p]!) >= 0) break;
      [this.items[i], this.items[p]] = [this.items[p]!, this.items[i]!];
      i = p;
    }
  }

  private down(i: number): void {
    const n = this.items.length;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < n && this.cmp(this.items[l]!, this.items[m]!) < 0) m = l;
      if (r < n && this.cmp(this.items[r]!, this.items[m]!) < 0) m = r;
      if (m === i) break;
      [this.items[i], this.items[m]] = [this.items[m]!, this.items[i]!];
      i = m;
    }
  }
}

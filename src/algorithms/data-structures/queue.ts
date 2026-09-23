import type { DSItem, DSOperationResult, DSStep } from "./types";

/**
 * FIFO queue on a circular buffer. `head` is the front slot; the rear slot is
 * `(head + size − 1) mod capacity`. Unbounded mode doubles the buffer when it
 * fills (amortised O(1)); bounded mode reports overflow instead.
 */
export interface QueueState {
  buffer: (DSItem | null)[];
  head: number;
  size: number;
  bounded: boolean;
  nextId: number;
  operations: number;
}

export type QueueRole = "front" | "rear" | "front-rear" | "enqueued" | "dequeued" | "peeked";

export const QUEUE_PSEUDOCODE = {
  enqueue: [
    "enqueue(x):",
    "  if size == capacity: grow buffer (bounded: OVERFLOW)",
    "  rear ← (head + size) mod capacity",
    "  buf[rear] ← x;  size ← size + 1",
  ],
  dequeue: [
    "dequeue():",
    "  if size == 0: error UNDERFLOW",
    "  x ← buf[head];  buf[head] ← empty",
    "  head ← (head + 1) mod capacity;  size ← size − 1",
    "  return x",
  ],
  peek: ["front():", "  if size == 0: error UNDERFLOW", "  return buf[head]"],
  clear: ["clear():", "  head ← 0;  size ← 0"],
} as const;

export const DEFAULT_QUEUE_CAPACITY = 8;
export const MAX_QUEUE_ITEMS = 16;

export function createQueue(
  bounded = false,
  values: number[] = [],
  capacity = DEFAULT_QUEUE_CAPACITY,
): QueueState {
  let cap = capacity;
  while (cap < values.length) cap *= 2;
  const buffer: (DSItem | null)[] = Array.from({ length: cap }, () => null);
  values.forEach((value, id) => (buffer[id] = { id, value }));
  return { buffer, head: 0, size: values.length, bounded, nextId: values.length, operations: 0 };
}

/** Items in logical order, front first, with their buffer slot. */
export function queueItems(q: QueueState): { item: DSItem; slot: number }[] {
  const out: { item: DSItem; slot: number }[] = [];
  const cap = q.buffer.length;
  for (let i = 0; i < q.size; i++) {
    const slot = (q.head + i) % cap;
    out.push({ item: q.buffer[slot]!, slot });
  }
  return out;
}

export function queueValues(q: QueueState): number[] {
  return queueItems(q).map((e) => e.item.value);
}

export function rearSlot(q: QueueState): number | null {
  return q.size === 0 ? null : (q.head + q.size - 1) % q.buffer.length;
}

function endRoles(q: QueueState): Record<number, QueueRole> {
  const items = queueItems(q);
  if (items.length === 0) return {};
  const front = items[0]!.item.id;
  const rear = items[items.length - 1]!.item.id;
  return front === rear ? { [front]: "front-rear" } : { [front]: "front", [rear]: "rear" };
}

export function enqueue(
  state: QueueState,
  value: number,
): DSOperationResult<QueueState, QueueRole> {
  const lines = [...QUEUE_PSEUDOCODE.enqueue];
  const steps: DSStep<QueueState, QueueRole>[] = [];
  let cap = state.buffer.length;
  steps.push({
    state,
    roles: endRoles(state),
    codeLine: 0,
    status: "ok",
    work: 0,
    explanation: `enqueue(${value}): add ${value} at the rear.`,
  });
  let q = state;
  const limit = state.bounded ? cap : MAX_QUEUE_ITEMS;
  if (state.size >= limit) {
    const why = state.bounded ? `its capacity of ${cap}` : `the visual limit of ${limit} items`;
    steps.push({
      state,
      roles: endRoles(state),
      codeLine: 1,
      status: "overflow",
      work: 1,
      explanation: `Overflow: the queue already holds ${state.size} items, ${why}. Nothing is enqueued.`,
    });
    return { operation: "enqueue", pseudocode: lines, steps, state, status: "overflow" };
  }
  if (state.size === cap) {
    const items = queueItems(state).map((e) => e.item);
    const buffer: (DSItem | null)[] = Array.from({ length: cap * 2 }, (_, i) => items[i] ?? null);
    q = { ...state, buffer, head: 0 };
    steps.push({
      state: q,
      roles: endRoles(q),
      codeLine: 1,
      status: "ok",
      work: 1 + state.size,
      explanation: `Buffer full (${cap} slots). Copy the ${state.size} items in order into a new buffer of ${cap * 2} slots, with the front at slot 0.`,
    });
    cap *= 2;
  } else {
    steps.push({
      state,
      roles: endRoles(state),
      codeLine: 1,
      status: "ok",
      work: 1,
      explanation: `Size ${state.size} < capacity ${cap}, so there is room.`,
    });
  }
  const rear = (q.head + q.size) % cap;
  const item = { id: q.nextId, value };
  const buffer = q.buffer.slice();
  buffer[rear] = item;
  const wrapped = rear < q.head;
  steps.push({
    state: q,
    roles: endRoles(q),
    codeLine: 2,
    status: "ok",
    work: steps[steps.length - 1]!.work + 1,
    explanation: `rear = (${q.head} + ${q.size}) mod ${cap} = ${rear}${wrapped ? " — wraps around to the start of the buffer" : ""}.`,
  });
  const done: QueueState = {
    ...q,
    buffer,
    size: q.size + 1,
    nextId: q.nextId + 1,
    operations: q.operations + 1,
  };
  steps.push({
    state: done,
    roles: { ...endRoles(done), [item.id]: "enqueued" },
    codeLine: 3,
    status: "ok",
    work: steps[steps.length - 1]!.work + 1,
    explanation: `Write ${value} into slot ${rear}. Size is now ${done.size}; ${value} is the new rear.`,
  });
  return { operation: "enqueue", pseudocode: lines, steps, state: done, status: "ok" };
}

export function dequeue(state: QueueState): DSOperationResult<QueueState, QueueRole> {
  const lines = [...QUEUE_PSEUDOCODE.dequeue];
  const steps: DSStep<QueueState, QueueRole>[] = [];
  const cap = state.buffer.length;
  steps.push({
    state,
    roles: endRoles(state),
    codeLine: 0,
    status: "ok",
    work: 0,
    explanation: "dequeue(): remove and return the front item.",
  });
  if (state.size === 0) {
    steps.push({
      state,
      roles: {},
      codeLine: 1,
      status: "underflow",
      work: 1,
      explanation: "Underflow: the queue is empty, so there is nothing to dequeue.",
    });
    return { operation: "dequeue", pseudocode: lines, steps, state, status: "underflow" };
  }
  const front = state.buffer[state.head]!;
  steps.push({
    state,
    roles: { ...endRoles(state), [front.id]: "dequeued" },
    codeLine: 2,
    status: "ok",
    work: 2,
    explanation: `Read ${front.value} from slot ${state.head} (the front) and clear that slot.`,
  });
  const buffer = state.buffer.slice();
  buffer[state.head] = null;
  const head = (state.head + 1) % cap;
  const done: QueueState = {
    ...state,
    buffer,
    head,
    size: state.size - 1,
    operations: state.operations + 1,
  };
  const nextFront = done.size ? done.buffer[head]!.value : null;
  steps.push({
    state: done,
    roles: endRoles(done),
    codeLine: 3,
    status: "ok",
    work: 3,
    explanation: `head = (${state.head} + 1) mod ${cap} = ${head}. Size is now ${done.size}. ${nextFront === null ? "The queue is empty." : `Front is now ${nextFront}.`}`,
  });
  steps.push({
    state: done,
    roles: endRoles(done),
    codeLine: 4,
    status: "ok",
    work: 3,
    explanation: `Return ${front.value}.`,
  });
  return {
    operation: "dequeue",
    pseudocode: lines,
    steps,
    state: done,
    status: "ok",
    value: front.value,
  };
}

export function peekQueue(state: QueueState): DSOperationResult<QueueState, QueueRole> {
  const lines = [...QUEUE_PSEUDOCODE.peek];
  const steps: DSStep<QueueState, QueueRole>[] = [];
  steps.push({
    state,
    roles: endRoles(state),
    codeLine: 0,
    status: "ok",
    work: 0,
    explanation: "front(): read the front item without removing it.",
  });
  if (state.size === 0) {
    steps.push({
      state,
      roles: {},
      codeLine: 1,
      status: "underflow",
      work: 1,
      explanation: "Underflow: the queue is empty, so there is no front item.",
    });
    return { operation: "peek", pseudocode: lines, steps, state, status: "underflow" };
  }
  const front = state.buffer[state.head]!;
  const done: QueueState = { ...state, operations: state.operations + 1 };
  steps.push({
    state: done,
    roles: { ...endRoles(done), [front.id]: "peeked" },
    codeLine: 2,
    status: "ok",
    work: 2,
    explanation: `Front is ${front.value} (slot ${state.head}). The queue is unchanged.`,
  });
  return {
    operation: "peek",
    pseudocode: lines,
    steps,
    state: done,
    status: "ok",
    value: front.value,
  };
}

export function clearQueue(state: QueueState): DSOperationResult<QueueState, QueueRole> {
  const done: QueueState = { ...state, buffer: state.buffer.map(() => null), head: 0, size: 0 };
  return {
    operation: "clear",
    pseudocode: [...QUEUE_PSEUDOCODE.clear],
    steps: [
      {
        state,
        roles: {},
        codeLine: 0,
        status: "ok",
        work: 0,
        explanation: `clear(): discard all ${state.size} items.`,
      },
      {
        state: done,
        roles: {},
        codeLine: 1,
        status: "ok",
        work: 1,
        explanation: "Head and size reset to 0. The queue is empty.",
      },
    ],
    state: done,
    status: "ok",
  };
}

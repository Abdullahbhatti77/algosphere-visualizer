import type { DSItem, DSOperationResult, DSStep } from "./types";

/** Array-backed LIFO stack. `items[items.length - 1]` is the top. */
export interface StackState {
  items: DSItem[];
  /** null = unbounded. */
  capacity: number | null;
  nextId: number;
  /** Completed push/pop/peek operations. */
  operations: number;
}

export type StackRole = "top" | "pushed" | "popped" | "peeked" | "checking";

export const STACK_PSEUDOCODE = {
  push: [
    "push(x):",
    "  if size == capacity: error OVERFLOW",
    "  data[size] ← x",
    "  size ← size + 1   // top = size − 1",
  ],
  pop: [
    "pop():",
    "  if size == 0: error UNDERFLOW",
    "  x ← data[size − 1]",
    "  size ← size − 1",
    "  return x",
  ],
  peek: ["peek():", "  if size == 0: error UNDERFLOW", "  return data[size − 1]"],
  clear: ["clear():", "  size ← 0"],
} as const;

export const DEFAULT_STACK_CAPACITY = 8;
export const MAX_STACK_ITEMS = 16;

export function createStack(capacity: number | null = null, values: number[] = []): StackState {
  return {
    items: values.map((value, id) => ({ id, value })),
    capacity,
    nextId: values.length,
    operations: 0,
  };
}

function limitOf(s: StackState) {
  return s.capacity ?? MAX_STACK_ITEMS;
}

function topRole(s: StackState): Record<number, StackRole> {
  const top = s.items[s.items.length - 1];
  return top ? { [top.id]: "top" } : {};
}

export function push(state: StackState, value: number): DSOperationResult<StackState, StackRole> {
  const lines = [...STACK_PSEUDOCODE.push];
  const steps: DSStep<StackState, StackRole>[] = [];
  const size = state.items.length;
  const limit = limitOf(state);
  steps.push({
    state,
    roles: topRole(state),
    codeLine: 0,
    status: "ok",
    work: 0,
    explanation: `push(${value}): add ${value} on top of the stack.`,
  });
  if (size >= limit) {
    const reason =
      state.capacity === null ? `the visual limit of ${limit} items` : `its capacity of ${limit}`;
    steps.push({
      state,
      roles: topRole(state),
      codeLine: 1,
      status: "overflow",
      work: 1,
      explanation: `Overflow: the stack already holds ${size} items, ${reason}. Nothing is pushed.`,
    });
    return { operation: "push", pseudocode: lines, steps, state, status: "overflow" };
  }
  steps.push({
    state,
    roles: topRole(state),
    codeLine: 1,
    status: "ok",
    work: 1,
    explanation: `Size ${size} < ${state.capacity === null ? "limit" : "capacity"} ${limit}, so there is room.`,
  });
  const item = { id: state.nextId, value };
  const written: StackState = { ...state, items: [...state.items, item], nextId: state.nextId + 1 };
  steps.push({
    state: written,
    roles: { [item.id]: "pushed" },
    codeLine: 2,
    status: "ok",
    work: 2,
    explanation: `Write ${value} into slot ${size}.`,
  });
  const done: StackState = { ...written, operations: state.operations + 1 };
  steps.push({
    state: done,
    roles: { [item.id]: "top" },
    codeLine: 3,
    status: "ok",
    work: 3,
    explanation: `Increase size to ${size + 1}. Top now points at ${value} (slot ${size}).`,
  });
  return { operation: "push", pseudocode: lines, steps, state: done, status: "ok" };
}

export function pop(state: StackState): DSOperationResult<StackState, StackRole> {
  const lines = [...STACK_PSEUDOCODE.pop];
  const steps: DSStep<StackState, StackRole>[] = [];
  const size = state.items.length;
  steps.push({
    state,
    roles: topRole(state),
    codeLine: 0,
    status: "ok",
    work: 0,
    explanation: "pop(): remove and return the top item.",
  });
  if (size === 0) {
    steps.push({
      state,
      roles: {},
      codeLine: 1,
      status: "underflow",
      work: 1,
      explanation: "Underflow: the stack is empty, so there is nothing to pop.",
    });
    return { operation: "pop", pseudocode: lines, steps, state, status: "underflow" };
  }
  const top = state.items[size - 1]!;
  steps.push({
    state,
    roles: { [top.id]: "checking" },
    codeLine: 1,
    status: "ok",
    work: 1,
    explanation: `Size is ${size}, not empty.`,
  });
  steps.push({
    state,
    roles: { [top.id]: "popped" },
    codeLine: 2,
    status: "ok",
    work: 2,
    explanation: `Read the top item: ${top.value} (slot ${size - 1}).`,
  });
  const done: StackState = {
    ...state,
    items: state.items.slice(0, -1),
    operations: state.operations + 1,
  };
  const next = done.items[done.items.length - 1];
  steps.push({
    state: done,
    roles: topRole(done),
    codeLine: 3,
    status: "ok",
    work: 3,
    explanation: `Decrease size to ${size - 1}. ${next ? `Top is now ${next.value}.` : "The stack is now empty."}`,
  });
  steps.push({
    state: done,
    roles: topRole(done),
    codeLine: 4,
    status: "ok",
    work: 3,
    explanation: `Return ${top.value}.`,
  });
  return {
    operation: "pop",
    pseudocode: lines,
    steps,
    state: done,
    status: "ok",
    value: top.value,
  };
}

export function peek(state: StackState): DSOperationResult<StackState, StackRole> {
  const lines = [...STACK_PSEUDOCODE.peek];
  const steps: DSStep<StackState, StackRole>[] = [];
  const size = state.items.length;
  steps.push({
    state,
    roles: topRole(state),
    codeLine: 0,
    status: "ok",
    work: 0,
    explanation: "peek(): read the top item without removing it.",
  });
  if (size === 0) {
    steps.push({
      state,
      roles: {},
      codeLine: 1,
      status: "underflow",
      work: 1,
      explanation: "Underflow: the stack is empty, so there is no top item.",
    });
    return { operation: "peek", pseudocode: lines, steps, state, status: "underflow" };
  }
  const top = state.items[size - 1]!;
  const done: StackState = { ...state, operations: state.operations + 1 };
  steps.push({
    state: done,
    roles: { [top.id]: "peeked" },
    codeLine: 2,
    status: "ok",
    work: 2,
    explanation: `Top is ${top.value}. The stack is unchanged (size ${size}).`,
  });
  return {
    operation: "peek",
    pseudocode: lines,
    steps,
    state: done,
    status: "ok",
    value: top.value,
  };
}

export function clearStack(state: StackState): DSOperationResult<StackState, StackRole> {
  const done: StackState = { ...state, items: [] };
  return {
    operation: "clear",
    pseudocode: [...STACK_PSEUDOCODE.clear],
    steps: [
      {
        state,
        roles: {},
        codeLine: 0,
        status: "ok",
        work: 0,
        explanation: `clear(): discard all ${state.items.length} items.`,
      },
      {
        state: done,
        roles: {},
        codeLine: 1,
        status: "ok",
        work: 1,
        explanation: "Size set to 0. The stack is empty.",
      },
    ],
    state: done,
    status: "ok",
  };
}

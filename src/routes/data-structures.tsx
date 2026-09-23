import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

const title = "Data Structures — AlgoViz";
const description =
  "Stacks, queues, linked lists, binary search trees, and heaps visualised operation by operation.";

export const Route = createFileRoute("/data-structures")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: DataStructuresPage,
});

function DataStructuresPage() {
  return (
    <>
      <PageHeader
        eyebrow="Data Structures"
        title="Data structures"
        description="Insertions, deletions, and traversals animated from the structure's real internal state."
      />
      <ComingSoon
        title="Data structures"
        planned={[
          "Stack and queue with push/pop/enqueue/dequeue step traces",
          "Singly and doubly linked lists with pointer rewiring shown explicitly",
          "Binary search tree insert, search, delete, and in-order traversal",
          "Binary heap insert and extract-min with sift-up / sift-down animation",
        ]}
      />
    </>
  );
}

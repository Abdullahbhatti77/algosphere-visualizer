# Complexity

Values describe **these implementations**, not the problem in general.

| Algorithm | Time | Space | Assumptions |
| --- | --- | --- | --- |
| Bubble Sort | O(n) best, O(n²) avg/worst | O(1) | Early-exit flag |
| Merge Sort | O(n log n) | O(n) | Top-down with auxiliary buffers |
| Quick Sort | O(n log n) avg, O(n²) worst | O(log n) avg, O(n) worst | Lomuto, last pivot; sorted/reverse/all-equal inputs hit worst case |
| Heap Sort | O(n log n) | O(1) | Bottom-up heapify |
| BFS | O(V + E) | O(V) | Adjacency lists |
| DFS | O(V + E) | O(V) | Explicit stack |
| Dijkstra | O((V + E) log V) | O(V + E) | Binary heap, lazy deletion, non-negative weights |
| A* | O(N log N) worst | O(N) | N grid cells, 4-connected, unit costs, binary heap |
| BST search/insert/delete | O(log n) avg, O(n) worst | O(n) | Unbalanced; cost is O(height) |
| Stack push/pop/peek | O(1) | O(n) | Array-backed |
| Queue enqueue/dequeue/front | O(1) | O(n) | Circular buffer |

The step recorder itself stores one snapshot per step, so recording costs
extra memory proportional to steps × state size; input limits keep this small.
No runtime benchmarks are claimed.

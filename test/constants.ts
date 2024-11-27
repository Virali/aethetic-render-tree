// @ts-nocheck
import { NodeLinkedById, TraversalNode } from "src/types";

export const SIMPLE_IDED_TREE: NodeLinkedById[] = [
  {
    id: 1,
    parents: null,
    children: [2, 3],
  },
  {
    id: 2,
    parents: [1],
    children: [4],
  },
  {
    id: 3,
    parents: [1],
    children: null,
  },
  {
    id: 4,
    parents: [2],
    children: null,
  },
];

const deepClone: any[] = structuredClone(SIMPLE_IDED_TREE);
deepClone.forEach((node) => {
  node.children =
    node.children?.map((childId) =>
      deepClone.find(({ id }) => id === childId)
    ) || null;
  node.parents =
    node.parents?.map((childId) =>
      deepClone.find(({ id }) => id === childId)
    ) || null;
});

export const SIMPLE_TRAVERSAL_TREE: TraversalNode[] = deepClone;

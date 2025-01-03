import { makeTraversalNodes } from "../src/makeTraversalNodes";
import { AlterableNodeById, NodeLinkedById } from "../src/types";

type NodesMap = Record<number, NodeLinkedById>;

describe("makeTraversalNodes", () => {
  const mockNodeGetter =
    (nodes: Record<number, AlterableNodeById>) => (id: number) =>
      nodes[id];

  it("should initialize nodes with preliminary, position, and modifier properties", () => {
    const nodesMap: NodesMap = {
      1: { id: 1, children: [2, 3], parent: null },
      2: { id: 2, children: null, parent: 1 },
      3: { id: 3, children: null, parent: 1 },
    };
    const nodeGetter = mockNodeGetter(nodesMap);

    const result = makeTraversalNodes(Object.values(nodesMap), 1, nodeGetter);

    result.nodes.forEach((node) => {
      expect(node).toHaveProperty("preliminary", 0);
      expect(node).toHaveProperty("position", { x: 0, y: 0 });
      expect(node).toHaveProperty("modifier", 0);
    });
  });

  it("should define tree levels correctly", () => {
    const nodesMap: NodesMap = {
      1: { id: 1, children: [2, 3, 4], parent: null },
      2: { id: 2, children: [5], parent: 1 },
      3: { id: 3, children: [6], parent: 1 },
      4: { id: 4, children: null, parent: 1 },
      5: { id: 5, children: [7], parent: 2 },
      6: { id: 6, children: null, parent: 3 },
      7: { id: 7, children: [8], parent: 5 },
      8: { id: 8, children: null, parent: 7 },
    };
    const nodeGetter = mockNodeGetter(nodesMap);

    const result = makeTraversalNodes(Object.values(nodesMap), 1, nodeGetter);

    expect(result.leveledIds).toEqual([[1], [2, 3, 4], [5, 6], [7], [8]]);
  });

  it("should set leftNeighbor property correctly", () => {
    const nodesMap: NodesMap = {
      1: { id: 1, children: [2, 3, 4], parent: null },
      2: { id: 2, children: [5, 6], parent: 1 },
      3: { id: 3, children: [7, 8], parent: 1 },
      4: { id: 4, children: [9, 10], parent: 1 },
      5: { id: 5, children: [11], parent: 2 },
      6: { id: 6, children: null, parent: 2 },
      7: { id: 7, children: [12], parent: 3 },
      8: { id: 8, children: null, parent: 3 },
      9: { id: 9, children: [13], parent: 4 },
      10: { id: 10, children: null, parent: 4 },
      11: { id: 11, children: null, parent: 5 },
      12: { id: 12, children: null, parent: 7 },
      13: { id: 13, children: null, parent: 9 },
    };
    const nodeGetter = mockNodeGetter(nodesMap);

    makeTraversalNodes(Object.values(nodesMap), 1, nodeGetter);
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    expect(ids.map((id) => nodeGetter(id).leftNeighbor)).toEqual([
      null,
      null,
      2,
      3,
      null,
      5,
      6,
      7,
      8,
      9,
      null,
      11,
      12,
    ]);
  });

  it("should return correct depth of the tree", () => {
    const nodesMap: NodesMap = {
      1: { id: 1, children: [2, 3, 4], parent: null },
      2: { id: 2, children: [5], parent: 1 },
      3: { id: 3, children: [6], parent: 1 },
      4: { id: 4, children: null, parent: 1 },
      5: { id: 5, children: [7], parent: 2 },
      6: { id: 6, children: null, parent: 3 },
      7: { id: 7, children: [8], parent: 5 },
      8: { id: 8, children: null, parent: 7 },
    };
    const nodeGetter = mockNodeGetter(nodesMap);

    const result = makeTraversalNodes(Object.values(nodesMap), 1, nodeGetter);

    expect(result.depth).toBe(5);
  });
});

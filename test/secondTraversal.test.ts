import { secondTraversal } from "../src/positioning";
import { TraversalNode } from "../src/types";
import { initIsoscelesTreeData } from "./caseData";

describe("secondTraversal function", () => {
  const isoscelesTreeData = initIsoscelesTreeData();
  it("should assign modifier and preliminary values to position properly", () => {
    const { traversedTree, positionedTree, separation, init } =
      isoscelesTreeData;
    const { depth, rootId } = init();
    const getNode = (id: number) =>
      (traversedTree as Record<number, TraversalNode>)[id];

    secondTraversal({
      initNode: getNode(rootId),
      initLevel: 0,
      maxDepth: depth,
      getNode,
      separation,
    });
    expect(traversedTree).toEqual(positionedTree);
  });
});

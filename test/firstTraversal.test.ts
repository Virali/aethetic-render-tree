import { firstTraversalCarrying } from "../src/positioning";
import { initIsoscelesTreeData, initSkewTreeData } from "./caseData";

describe("'firstTraversal' function", () => {
  const skewTreeData = initSkewTreeData();
  const isoscelesTreeData = initIsoscelesTreeData();

  it("should place tree nodes according to separation values", () => {
    skewTreeData.forEach((caseData) => {
      const { tree, rootId, depth } = caseData.init();
      const getNode = (id: number) => tree[id];

      firstTraversalCarrying({
        initNode: tree[rootId],
        initLevel: 0,
        getNode,
        maxDepth: depth,
        separation: caseData.separation,
      });
      expect(Object.values(tree)).toEqual(
        Object.values(caseData.traversedTree)
      );
    });
  });

  it("should place subtree without shifting other subtrees if it fits", () => {
    const { init, traversedTree, separation } = isoscelesTreeData;
    const { tree, rootId, depth } = init();
    const getNode = (id: number) => tree[id];

    firstTraversalCarrying({
      initNode: tree[rootId],
      initLevel: 0,
      getNode,
      maxDepth: depth,
      separation,
    });
    expect(Object.values(tree)).toEqual(Object.values(traversedTree));
  });
});

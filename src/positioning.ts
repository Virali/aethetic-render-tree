import { makeTraversalNodes } from "./makeTraversalNodes";
import type {
  NodeLinkedById,
  TraversalNode,
  PositionedNode,
  DefinitelyTruthy,
  AlterableNode,
  InternalNode,
  SeparationValues,
  NodeGetter,
  NodeID,
  NodesMap
} from "./types";

type TraverseBasicProps = {
  initNode: TraversalNode;
  initLevel: number;
  getNode: NodeGetter;
  maxDepth: number;
};

type FirstTraverseProps = TraverseBasicProps & {
  separation: {
    meanNodeSize: number;
    siblingSpace: number;
    subtreeSeparation: number;
  };
};

type SecondTraverseProps = TraverseBasicProps & {
  separation: {
    levelSeparation: number;
  };
};

// carrying to encapsulate some constants
function firstTraversalCarrying({
  initNode,
  initLevel,
  getNode,
  maxDepth,
  separation: { siblingSpace, meanNodeSize, subtreeSeparation },
}: FirstTraverseProps) {
  const apportionSubtrees = apportionSubtreesCarrying({
    maxDepth,
    subtreeSeparation,
    meanNodeSize,
    getNode,
  });

  function getLeftSibling(node: TraversalNode): TraversalNode | false {
    if (node.parent === null) return false;
    const nodeSiblings = getNode(node.parent).children!;
    const nodeIndex = nodeSiblings?.findIndex((id) => id === node.id);

    if (nodeIndex === undefined || nodeIndex < 0)
      throw Error("[LINKS_ERROR] parent doesn't have a linked child");

    if (nodeIndex > 0) {
      return getNode(nodeSiblings[nodeIndex - 1]);
    }

    return false;
  }

  // Assign a preliminary x-coordinate and modifiers to nodes, modifiers will be used to move node offspring to the right
  return (function firstTraversal(node: TraversalNode, level: number) {
    const { children } = node;
    const leftSibling = getLeftSibling(node);

    if (leftSibling) {
      node.preliminary = leftSibling.preliminary + siblingSpace + meanNodeSize;
    }

    if (children?.length) {
      const childrenRefs = children.map((id) => getNode(id));
      // that procedure assumes that parent preliminary will be always calculated after its children
      childrenRefs.forEach((child) => firstTraversal(child, level + 1));

      const midpoint =
        (childrenRefs[0].preliminary + childrenRefs.at(-1)!.preliminary) / 2;

      if (leftSibling) {
        node.modifier = node.preliminary - midpoint;
        apportionSubtrees(node, level);
      } else {
        node.preliminary = midpoint;
      }
    }
    node.traversed = true;
  })(initNode, initLevel);
}

function secondTraversalCarrying({
  initNode,
  initLevel = 0,
  getNode,
  maxDepth,
  separation: { levelSeparation },
}: SecondTraverseProps) {
  // function summarize node preliminary with hereditary modifiers sum to set x coordinate
  return (function secondTraversal(
    node: TraversalNode,
    level: number,
    modSum: number // modifiers sum
  ) {
    if (level > maxDepth) {
      return;
    }
    // TODO: include position adjustment
    node.position.x = node.preliminary + modSum;
    node.position.y = levelSeparation * level;

    if (node.children?.length) {
      node.children.forEach((child) => {
        secondTraversal(getNode(child), level + 1, modSum + node.modifier);
      });
    }
  })(initNode, initLevel, 0);
}

function apportionSubtreesCarrying({
  maxDepth,
  subtreeSeparation,
  meanNodeSize,
  getNode,
}: {
  maxDepth: number;
  subtreeSeparation: number;
  meanNodeSize: number;
  getNode: NodeGetter;
}) {
  function getLeftMostDescendant(
    node: TraversalNode,
    remainingDepth: number
  ): TraversalNode | false {
    if (remainingDepth <= 0) {
      return node;
    }
    if (!node.children) {
      return false;
    } else {
      let leftMost = getLeftMostDescendant(
        getNode(node.children[0]),
        --remainingDepth
      );

      for (let i = 1; i < node.children.length && leftMost === false; i++) {
        leftMost ===
          getLeftMostDescendant(getNode(node.children[i]), --remainingDepth);
      }

      return leftMost;
    }
  }

  // analyze is there any frictions between subtrees, calculate how far we have to push apart subtrees, then change their preliminary and modifier
  return function apportionSubtrees(node: TraversalNode, level: number) {
    let leftMost = node.children ? getNode(node.children[0]) : null;
    let compareDepth = 1;
    const depthToStop = maxDepth - level;

    while (leftMost?.leftNeighbor && compareDepth <= depthToStop) {
      // Compute the location of Leftmost and where it should be with respect to Neighbor
      const neighbor = getNode(leftMost.leftNeighbor);
      let leftModSum = 0;
      let rightModSum = 0; // as we have a current node on the right and its level neighbor on the left
      let leftMostAncestor = leftMost;
      let neighborAncestor = neighbor;

      for (let i = 0; i < compareDepth; i++) {
        if (
          leftMostAncestor.parent === null ||
          neighborAncestor.parent === null
        ) {
          throw Error(
            "Tree structure is broken or max depth exceed tree depth"
          );
        }
        leftMostAncestor = getNode(leftMostAncestor.parent);
        neighborAncestor = getNode(neighborAncestor.parent);

        rightModSum += leftMostAncestor.modifier;
        leftModSum += neighborAncestor.modifier;
      }

      let moveDistance =
        neighbor.preliminary +
        leftModSum +
        subtreeSeparation +
        meanNodeSize -
        leftMost.preliminary -
        rightModSum;

      if (moveDistance > 0) {
        if (
          neighborAncestor.parent &&
          neighborAncestor.parent === node.parent
        ) {
          const commonParent = getNode(neighborAncestor.parent) as InternalNode;
          const neighborIndex = commonParent.children.findIndex(
            (childId) => childId === neighborAncestor.id
          );
          const nodeIndex = commonParent.children.findIndex(
            (childId) => childId === node.id
          );

          if (neighborIndex < 0 || nodeIndex < 0) {
            throw Error(
              "[LINKS_CONFUSION] Parent doesn't have links to its children"
            );
          }

          const portion = moveDistance / (nodeIndex - neighborIndex);

          for (let i = nodeIndex; i > neighborIndex; i--) {
            const childToShift = getNode(commonParent.children[i]);
            childToShift.preliminary += moveDistance;
            childToShift.modifier += moveDistance;
            moveDistance -= portion;
          }
        }
      }

      compareDepth++;
      if (leftMost.children?.length) {
        leftMost = getNode(leftMost.children[0]);
      } else {
        leftMost = getLeftMostDescendant(
          node,
          maxDepth - compareDepth
        ) as TraversalNode;
      }
    }
  };
}

export default function positionTree(
  nodesMap: NodesMap,
  rootId: number,
  constants: SeparationValues = {
    siblingSpace: 100,
    meanNodeSize: 50,
    levelSeparation: 170,
    subtreeSeparation: 15,
  }
): PositionedNode[] {
  const nodesMapClone = structuredClone(nodesMap) as Record<
    NodeID,
    TraversalNode
  >;
  const nodeGetter: NodeGetter = (id) => nodesMapClone[id];

  const { nodes, depth } = makeTraversalNodes(
    Object.values(nodesMapClone),
    rootId,
    nodeGetter
  );

  firstTraversalCarrying({
    initNode: nodes[0],
    initLevel: 0,
    getNode: nodeGetter,
    maxDepth: depth,
    separation: constants,
  });

  secondTraversalCarrying({
    initNode: nodes[0],
    initLevel: 0,
    getNode: nodeGetter,
    maxDepth: depth,
    separation: constants,
  });

  return nodes;
}

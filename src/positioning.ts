import { makeTraversalNodes } from "./makeTraversalNodes";
import type {
  TraversalNode,
  PositionedNode,
  InternalNode,
  SeparationValues,
  NodeGetter,
  NodeID,
  NodesMap,
} from "./types";
import { curry } from "./utils";

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

/**
 * Assign a preliminary x-coordinate and modifiers to nodes, modifiers will be used to move node offspring to the right. */
export function firstTraversal({
  initNode,
  initLevel = 0,
  getNode,
  maxDepth,
  separation: { siblingSpace, meanNodeSize, subtreeSeparation },
}: FirstTraverseProps) {
  const apportionSubtrees = carryApportionSubtrees({
    maxDepth,
    subtreeSeparation,
    meanNodeSize,
    getNode,
  });
  const getLeftSiblingHOF = (node: TraversalNode) =>
    getLeftSibling(node, getNode);

  return (function firstTraversalInner(node: TraversalNode, level: number) {
    const { children } = node;
    const leftSibling = getLeftSiblingHOF(node);

    if (leftSibling) {
      node.preliminary = leftSibling.preliminary + siblingSpace + meanNodeSize;
    }

    if (children?.length) {
      const childrenRefs = children.map((id) => getNode(id));
      // that procedure assumes that parent preliminary will be always calculated after its children
      childrenRefs.forEach((child) => firstTraversalInner(child, level + 1));

      const midpoint =
        (childrenRefs[0].preliminary + childrenRefs.at(-1)!.preliminary) / 2;

      if (leftSibling) {
        node.modifier = node.preliminary - midpoint;
        apportionSubtrees(node, level);
      } else {
        node.preliminary = midpoint;
      }
    }
  })(initNode, initLevel);
}

function getLeftSibling(
  node: TraversalNode,
  getNode: NodeGetter
): TraversalNode | false {
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
/**
 * Function summarize node preliminary with hereditary modifiers sum to set the x coordinate.*/
export function secondTraversal({
  initNode,
  initLevel = 0,
  getNode,
  maxDepth,
  separation: { levelSeparation },
}: SecondTraverseProps) {
  return (function secondTraversalInner(
    node: TraversalNode,
    level: number,
    modSum: number // modifiers sum
  ) {
    if (level > maxDepth) {
      return;
    }
    node.position.x = node.preliminary + modSum;
    node.position.y = levelSeparation * level;

    if (node.children?.length) {
      node.children.forEach((child) => {
        secondTraversalInner(getNode(child), level + 1, modSum + node.modifier);
      });
    }
  })(initNode, initLevel, 0);
}
/**
 * function analyzes is there any frictions between subtrees, calculate how far we have to push apart subtrees, then change their preliminary and modifier.
 */
function carryApportionSubtrees({
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
  const getLeftMostDescendant = curryGetLeftMostDescendant(getNode);
  return function apportionSubtrees(node: TraversalNode, level: number) {
    let leftMost = node.children ? getNode(node.children[0]) : null;
    let compareDepth = 1;
    const depthToStop = maxDepth - level;

    while (leftMost?.leftNeighbor && compareDepth < depthToStop) {
      // Compute the location of Leftmost and where it should be with respect to neighbor
      const neighbor = getNode(leftMost.leftNeighbor);
      let leftModSum = 0;
      let rightModSum = 0;
      // as we have a current node on the right and its level neighbor on the left
      let leftMostAncestor = leftMost;
      let neighborAncestor = neighbor;

      for (let i = 0; i < compareDepth; i++) {
        if (
          leftMostAncestor.parent === null ||
          neighborAncestor.parent === null
        ) {
          throw Error(
            "Tree structure is broken or max depth exceed tree depth",
            { cause: node }
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

          for (let i = nodeIndex; i > neighborIndex && moveDistance > 0; i--) {
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
function curryGetLeftMostDescendant(getNode: NodeGetter) {
  return curry(getLeftMostDescendant)(getNode);
}
function getLeftMostDescendant(
  getNode: NodeGetter,
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
      getNode,
      getNode(node.children[0]),
      --remainingDepth
    );

    for (let i = 1; i < node.children.length && leftMost === false; i++) {
      leftMost ===
        getLeftMostDescendant(
          getNode,
          getNode(node.children[i]),
          --remainingDepth
        );
    }

    return leftMost;
  }
}

export default function positionTree(
  nodesMap: NodesMap,
  rootId: number,
  separation: SeparationValues = {
    siblingSpace: 40,
    meanNodeSize: 50,
    levelSeparation: 60,
    subtreeSeparation: 20,
  }
): PositionedNode[] {
  // Clone for next mutations
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

  const traversalProps = {
    initNode: nodes[0],
    initLevel: 0,
    getNode: nodeGetter,
    maxDepth: depth,
    separation,
  };

  firstTraversal(traversalProps);

  secondTraversal(traversalProps);

  return nodes as PositionedNode[];
}

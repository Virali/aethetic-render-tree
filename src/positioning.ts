import {
  NodeLinkedById,
  TraversalNode,
  PositionedNode,
  DefinitelyTruthy,
  AlterableNode,
  InternalNode,
} from "./types";

type NodeGetter = (id: number) => TraversalNode;

// carrying to encapsulate some constants
function firstTraversalCarrying(
  {
    initNode,
    initLevel,
    getNode,
  }: { initNode: TraversalNode; initLevel: number; getNode: NodeGetter },
  { siblingSpace, meanNodeSize, maxDepth, subtreeSeparation }
) {
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
      childrenRefs
        .filter(({ traversed }) => !traversed)
        .forEach((child) => firstTraversal(child, level + 1));

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

function secondTraversalCarrying(
  { initNode, initLevel, initModSum },
  { levelSeparation }
) {
  // function summarize node preliminary with hereditary modifiers sum to set x coordinate
  return (function secondTraversal(
    node: TraversalNode,
    level: number,
    modSum: number // modifiers sum
  ) {
    const { subtreeRoot } = node;

    // check for 'subtreeRoot' field that indicates that this node is filter subtree descendant
    // and set position fields like (preliminary, modifier, y) equal to filter node values
    if (subtreeRoot && node.parents.length > 1) {
      node.modifier = subtreeRoot.preliminary - node.preliminary;
      node.position.y = subtreeRoot.position.y;
      modSum = subtreeRoot.position.y - subtreeRoot.preliminary;
    } else node.position.y = node.preliminary + modSum;

    const newXValue = level * levelSeparation;
    if (node.position.x > 0) {
      node.position.x =
        newXValue > node.position.x ? newXValue : node.position.x;
    } else node.position.x = newXValue;

    if (node.children?.length) {
      node.children.forEach((child) => {
        secondTraversal(child, level + 1, modSum + node.modifier);
      });
    }
  })(initNode, initLevel, initModSum);
}

function apportionBranchesCarrying({ subtreeSeparation, meanNodeSize }) {
  return function apportionBranches(subtreeChildNode: TraversalNode) {
    subtreeChildNode.parents.forEach((parent, index) => {
      if (index >= subtreeChildNode.parents.length - 1) return;

      let leftBranchPointer = parent;
      let rightBranchPointer = subtreeChildNode.parents[index + 1];

      const rightAncestorLine: TraversalNode[] = [];
      const leftAncestorLine: TraversalNode[] = [];
      let commonParent: TraversalNode;

      const checkForCommonAncestor = () => {
        const rightLineLast = rightAncestorLine.at(-1);
        const leftLineLast = leftAncestorLine.at(-1);

        if (leftAncestorLine.includes(rightLineLast)) {
          commonParent = rightLineLast;
        }
        if (rightAncestorLine.includes(leftLineLast)) {
          commonParent = leftLineLast;
        }
        if (commonParent) {
          leftAncestorLine.splice(
            leftAncestorLine.findIndex((item) => item === commonParent)
          );
          rightAncestorLine.splice(
            rightAncestorLine.findIndex((item) => item === commonParent)
          );
          return true;
        }
        return false;
      };

      while (!checkForCommonAncestor()) {
        rightAncestorLine.push(rightBranchPointer);
        leftAncestorLine.push(leftBranchPointer);

        if (rightBranchPointer.parents) {
          [rightBranchPointer] = rightBranchPointer.parents;
        }
        if (leftBranchPointer.parents) {
          leftBranchPointer = leftBranchPointer.parents.at(-1);
        }
      }

      const leftLineMostRight = findExtreme(leftAncestorLine.reverse(), false);
      const rightLineMostLeft = findExtreme(rightAncestorLine.reverse());

      const moveDistance =
        leftLineMostRight.preliminary +
        leftLineMostRight.modifier +
        subtreeSeparation +
        meanNodeSize -
        rightLineMostLeft.preliminary -
        rightLineMostLeft.modifier;

      if (moveDistance > 0) {
        const rightBranchStartIndex = commonParent.children.findIndex((node) =>
          rightAncestorLine.includes(node)
        );
        commonParent.children
          .slice(rightBranchStartIndex)
          .forEach((branchStartNode) => {
            branchStartNode.preliminary += moveDistance;
            branchStartNode.modifier += moveDistance;
          });
      }
    });
  };
}

function findExtreme(array: TraversalNode[], leftMost = true) {
  return array.reduce(
    (countObj, item) => {
      countObj.modSum += item.modifier;

      const [leftPart, rightPart] = leftMost
        ? [item.preliminary, countObj.preliminary]
        : [countObj.preliminary, item.preliminary];
      if (leftPart <= rightPart) {
        countObj.preliminary = item.preliminary;
        countObj.modifier = countObj.modSum;
      }
      return countObj;
    },
    {
      modSum: 0,
      preliminary: leftMost ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER,
      modifier: 0,
    }
  );
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
    let firstChild = node.children ? getNode(node.children[0]) : null;
    let compareDepth = 1;
    const depthToStop = maxDepth - level;

    while (firstChild?.leftNeighbor && compareDepth <= depthToStop) {
      // Compute the location of Leftmost and where it should be with respect to Neighbor
      const neighbor = getNode(firstChild.leftNeighbor);
      let leftModSum = 0;
      let rightModSum = 0; // as we have a current node on the right and its level neighbor on the left
      let leftMostAncestor = firstChild;
      let neighborAncestor = neighbor;

      for (let i = 0; i < compareDepth; i++) {
        if (!leftMostAncestor.parent || !neighborAncestor.parent) {
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
        firstChild.preliminary -
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
      if (firstChild.children?.length) {
        firstChild = getNode(firstChild.children[0]);
      } else {
        firstChild = getLeftMostDescendant(node, maxDepth - compareDepth) as TraversalNode;
      }
    }
  };
}

export default function treePositioning(
  nodesArr: NodeLinkedById[],
  constants = {
    siblingSpace: 100,
    meanNodeSize: 50,
    levelSeparation: 170,
    subtreeSeparation: 15,
  }
): PositionedNode[] {
  const { siblingSpace, meanNodeSize, levelSeparation, subtreeSeparation } =
    constants;

  const { graph, depth } = makeTraversalNodes(nodesArr);

  firstTraversalCarrying(
    { initNode: graph[0], initLevel: 0 },
    { siblingSpace, meanNodeSize, subtreeSeparation, maxDepth: depth }
  );

  // Return all traversed properties to default false for second traversal
  graph.forEach((node) => {
    node.traversed = false;
    if (node?.parents?.length && node.parents.length > 1) {
      apportionBranchesCarrying({
        subtreeSeparation,
        meanNodeSize,
      })(node);
    }
  });

  secondTraversalCarrying(
    { initNode: graph[0], initLevel: 0, initModSum: 0 },
    { levelSeparation: levelSeparation + meanNodeSize } // add maxDepth if needed
  );

  return graph;
}

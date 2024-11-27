import {
  NodeLinkedById,
  TraversalNode,
  PositionedNode,
  DefinitelyTruthy,
  AnyNodeLinkedByRef,
  AlterableLinkedNode,
} from "./types";

function arrayIdSearch<T extends { id: number }>(array: T[]) {
  return (id: number) => array.find((item) => item.id === id);
}

function makeLinkedByRefProps(
  node: NodeLinkedById,
  findNode: (id: number) => NodeLinkedById | undefined
) {
  const [mappedToRefChildren, mappedToRefParents] = [
    node.children,
    node.parents,
  ].map((nodeIds) => {
    if (nodeIds) {
      const nodesMapped = nodeIds.map((id) => {
        const findResult = findNode(id);
        if (!findResult) {
          throw new Error(
            "[LINKS_ERROR] - node id was not found in source array"
          );
        }
        return findResult;
      });

      return nodesMapped;
    }
    return null;
  });
  const mappedToRefRoot =
    node.subtreeRoot !== undefined && findNode(node.subtreeRoot);

  return {
    children: mappedToRefChildren,
    parents: mappedToRefParents,
    ...(mappedToRefRoot && { subtreeRoot: mappedToRefRoot }),
  };
}

// function take items of doubly linked array('children' and 'parents' keys)
// and create object with all properties needed for tree positioning
export function makeTraversalNodes(nodes: NodeLinkedById[]) {
  const alterableNodes: AlterableLinkedNode[] = nodes
    .map((node) => ({ ...node }))
    .map((node, _, array) => {
      const findItem = arrayIdSearch(array);
      return {
        ...node,
        ...makeLinkedByRefProps(node, findItem),
        preliminary: 0,
        position: { x: 0, y: 0 },
        modifier: 0,
      } as AlterableLinkedNode;
    });

  const nodesByLevels = defineTreeLevels(alterableNodes[0]);
  const treeSet = new Set<AlterableLinkedNode>();

  nodesByLevels.forEach((level) =>
    level
      .filter((node) => !treeSet.has(node))
      .forEach((node, orderIndex) => {
        node.leftNeighbor = orderIndex > 0 ? level[orderIndex - 1] : null;

        treeSet.add(node);
      })
  );

  return {
    graph: [...treeSet] as TraversalNode[],
    depth: nodesByLevels.length,
    leveledGraph: nodesByLevels as TraversalNode[][],
  };
}

function defineTreeLevels<NodeType extends AnyNodeLinkedByRef>(root: NodeType) {
  const treeLevels = [[root]];

  for (let i = 0; i < treeLevels.length; i++) {
    const level = treeLevels[i];
    const nextLevelSet: Set<NodeType> = new Set();

    level.forEach(({ children }) => {
      if (children) {
        children.forEach((childNode) => {
          if (
            childNode.parents?.every(({ id: parentId }) =>
              treeLevels
                .flat()
                .map(({ id }) => id)
                .includes(parentId)
            )
          ) {
            nextLevelSet.add(childNode as NodeType);
          }
        });
      }
    });

    const nextLevelArr = [...nextLevelSet];
    if (nextLevelArr.length) {
      treeLevels.push([...nextLevelSet]);
    }
  }

  return treeLevels;
}

function getLeftSibling(node: TraversalNode): TraversalNode | false {
  if (node.parents === null) return false;
  const nodeSiblings = node.parents[0].children;
  const nodeSiblingIndex = nodeSiblings.findIndex(
    (elem) => elem.id === node.id
  );

  if (nodeSiblingIndex < 0)
    throw Error("[LINKS_ERROR] parent doesn't have a linked child");

  if (nodeSiblingIndex > 0) {
    return nodeSiblings[nodeSiblingIndex - 1];
  }

  return false;
}

// carrying for encapsulating some constants
function firstTraversalCarrying(
  { initNode, initLevel },
  { siblingSpace, meanNodeSize, maxDepth, subtreeSeparation }
) {
  const apportionSubtrees = apportionSubtreesCarrying({
    maxDepth,
    subtreeSeparation,
    meanNodeSize,
  });
  // Assign a preliminary x-coordinate and modifiers to nodes, modifiers will be used to move node offspring to the right
  return (function firstTraversal(node: TraversalNode, level: number) {
    const { children } = node;
    const leftSibling = getLeftSibling(node);

    if (leftSibling) {
      node.preliminary = leftSibling.preliminary + siblingSpace + meanNodeSize;
    }

    if (children?.length) {
      // that line assumes that parent preliminary will be always calculated after its children
      children
        .filter(({ traversed }) => !traversed)
        .forEach((child) => firstTraversal(child, level + 1));
      const midpoint =
        (children[0].preliminary + children[children.length - 1].preliminary) /
        2;
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
}) {
  // analyze is there any frictions between subtrees, calculate how far we have to push apart subtrees, then change their preliminary and modifier
  return function apportionSubtrees(node: TraversalNode, level: number) {
    let leftMost = node.children ? node.children[0] : null;
    let compareDepth = 1;
    const depthToStop = maxDepth - level;

    while (leftMost && leftMost.leftNeighbor && compareDepth <= depthToStop) {
      const neighbor = leftMost.leftNeighbor;
      let leftModSum = 0;
      let rightModSum = 0; // as we have a current node on the right and its level neighbor on the left
      let leftMostAncestor = leftMost;
      let neighborAncestor = neighbor;

      for (let i = 0; i < compareDepth; i++) {
        [leftMostAncestor] = leftMostAncestor.parents;
        neighborAncestor = neighborAncestor.parents.at(-1);

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
        const commonParent = neighborAncestor.parents[0];
        if (commonParent.id === node.parents[0].id) {
          const neighborIndex = commonParent.children.findIndex(
            (child) => child.id === neighborAncestor.id
          );
          const nodeIndex = commonParent.children.findIndex(
            (child) => child.id === node.id
          );

          if (neighborIndex < 0 || nodeIndex < 0) {
            throw Error(
              "[LINKS_CONFUSION] Parent doesn't have links to its children"
            );
          }

          const portion = moveDistance / (nodeIndex - neighborIndex);

          for (let i = nodeIndex; i > neighborIndex; i--) {
            const childToShift = commonParent.children[i];
            childToShift.preliminary += moveDistance;
            childToShift.modifier += moveDistance;
            moveDistance -= portion;
          }
        }
      }

      compareDepth++;
      if (!leftMost.children?.length) {
        leftMost = findLeftMostAtDepth(node, compareDepth);
      } else {
        [leftMost] = leftMost.children;
      }
    }
  };
}

function findLeftMostAtDepth(
  node: TraversalNode,
  depth: number
): TraversalNode | undefined {
  let descendantsAtLevel = node.children; // descendants on current subtree level

  for (let i = 0; i < depth; i++) {
    descendantsAtLevel = descendantsAtLevel.flatMap(
      (elem) => elem.children || []
    );
  }

  return descendantsAtLevel[0];
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

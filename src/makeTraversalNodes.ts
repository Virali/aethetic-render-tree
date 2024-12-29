import {
  AlterableNode,
  AlterableNodeById,
  NodeID,
  NodeLinkedById,
  TraversalNode,
} from "./types";

type NodeGetter = (id: number) => AlterableNodeById;

// Create node as object with all properties needed for tree positioning
export function makeTraversalNodes(
  nodes: NodeLinkedById[],
  nodeGetter: NodeGetter
) {
  const alterableNodes: AlterableNodeById[] = nodes.map((node) => {
    return {
      ...node,
      preliminary: 0,
      position: { x: 0, y: 0 },
      modifier: 0,
    };
  });

  const nodesByLevels = defineTreeLevels(alterableNodes[0].id, nodeGetter);

  nodesByLevels.forEach((level) =>
    level.forEach((nodeId, orderIndex) => {
      nodeGetter(nodeId).leftNeighbor =
        orderIndex > 0 ? level[orderIndex - 1] : null;
    })
  );

  return {
    nodes: alterableNodes as TraversalNode[],
    depth: nodesByLevels.length,
    structuredGraphIds: nodesByLevels,
  };
}

function defineTreeLevels(root: NodeID, nodeGetter: NodeGetter) {
  const treeLevels = [[root]];

  for (let i = 0; i < treeLevels.length; i++) {
    const level = treeLevels[i];
    const nextLevelNodes: NodeID[] = [];

    level.forEach((nodeId) => {
      const node = nodeGetter(nodeId);
      if (node.children) {
        nextLevelNodes.push(...node.children);
      }
    });

    if (nextLevelNodes.length) {
      treeLevels.push(nextLevelNodes);
    }
  }

  return treeLevels;
}
const SIMPLE_IDED_TREE: Record<number, NodeLinkedById> = {
  1: {
    id: 1,
    parent: null,
    children: [2, 3],
  },
  2: {
    id: 2,
    parent: 1,
    children: [4],
  },
  3: {
    id: 3,
    parent: 1,
    children: null,
  },
  4: {
    id: 4,
    parent: 2,
    children: null,
  },
};

console.log(
  JSON.stringify(
    makeTraversalNodes(
      Object.values(SIMPLE_IDED_TREE),
      (id) => SIMPLE_IDED_TREE[id]
    )
  )
);

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
  rootId: number,
  nodeGetter: NodeGetter
) {
  nodes.forEach((node) => {
    Object.assign(node, {
      preliminary: 0,
      position: { x: 0, y: 0 },
      modifier: 0,
    });
  });

  const nodesByLevels = defineTreeLevels(rootId, nodeGetter);

  nodesByLevels.forEach((level) =>
    level.forEach((nodeId, orderIndex) => {
      nodeGetter(nodeId).leftNeighbor =
        orderIndex > 0 ? level[orderIndex - 1] : null;
    })
  );

  return {
    nodes: nodes as TraversalNode[],
    depth: nodesByLevels.length,
    leveledIds: nodesByLevels,
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

import {
  AlterableLinkedNode,
  AnyNodeLinkedByRef,
  NodeLinkedById,
  TraversalNode,
} from "./types";

// and create object with all properties needed for tree positioning
export function makeTraversalNodes(nodes: NodeLinkedById[]) {
  const alterableNodes: AlterableLinkedNode[] = transformIdsToRefs(nodes).map((node) => {
    return {
      ...node,
      preliminary: 0,
      position: { x: 0, y: 0 },
      modifier: 0,
    };
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

function transformIdsToRefs(nodes: NodeLinkedById[]) {
  const deepClone = structuredClone(nodes);
  const findItem = arrayIdSearch(deepClone);

  (deepClone as any[]).forEach((node) => {
    node.children =
      node.children?.map((childId: number) => findItem(childId)) || null;
    node.parents =
      node.parents?.map((parentId: number) => findItem(parentId)) || null;
  });

  return deepClone as AlterableLinkedNode[];
}

function arrayIdSearch<T extends { id: number }>(array: T[]) {
  return (id: number) => {
    const foundItem = array.find((item) => item.id === id);
    if (!foundItem) throw new Error("There is no item with that ID");
    return foundItem;
  };
}

function transformLinkFromIdToRef(
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
const SIMPLE_IDED_TREE: NodeLinkedById[] = [
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
console.log(makeTraversalNodes(SIMPLE_IDED_TREE).graph);

import { NodeLinkedById, NodeID } from "./types";

const SIMPLE_IDED_TREE: NodeLinkedById[] = [
  {
    id: 1,
    parent: null,
    children: [2, 3],
  },
  {
    id: 2,
    parent: 1,
    children: [4],
  },
  {
    id: 3,
    parent: 1,
    children: null,
  },
  {
    id: 4,
    parent: 2,
    children: null,
  },
];

class GeneralTree {
  private nodes: Record<NodeID, NodeLinkedById> = {};
  private root: NodeLinkedById;

  constructor(root: NodeLinkedById) {
    this.root = root;
    this.nodes[root.id] = root;
  }

  getRoot() {
    return this.root;
  }

  getNodes() {
    return Object.values(this.nodes);
  }

  getNode(nodeId: NodeID | any): NodeLinkedById | null {
    return this.nodes[nodeId] || null;
  }

  addNode(node: NodeLinkedById) {
    this.nodes[node.id] = node;
  }

  addChildrenToNode(nodeId: NodeID, children: NodeID[]) {
    const parentNode = this.getNode(nodeId);
    if (!parentNode) return;

    const existingChildren = children.filter((childId) =>
      this.getNode(childId)
    );
    if (parentNode.children === null) {
      parentNode.children = existingChildren;
    } else {
      parentNode.children.push(...existingChildren);
    }
  }

  removeNode(nodeId: NodeID) {
    const node = this.getNode(nodeId);
    if (!node) return;

    const parentNode = this.getNode(node.parent);

    if (parentNode) {
      parentNode.children = parentNode.children!.filter(
        (childId) => childId !== nodeId
      );
      node.children?.forEach((childId) => {
        this.getNode(childId)!.parent = parentNode.id;
      });
    } else {
      node.children?.forEach((childId) => {
        this.getNode(childId)!.parent = null;
      });
    }

    delete this.nodes[nodeId];
  }
}

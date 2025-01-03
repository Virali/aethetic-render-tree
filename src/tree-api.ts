import positionTree from "./positioning";
import { NodeLinkedById, NodeID, NodesMap } from "./types";

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
  private nodes: NodesMap = {};
  private root: NodeLinkedById;

  constructor(root: Omit<NodeLinkedById, "parent">) {
    this.root = { ...root, parent: null };
    this.nodes[root.id] = this.root;
  }

  getRoot() {
    return this.root;
  }

  getAllNodes() {
    return Object.values(this.nodes);
  }

  getNode(nodeId: NodeID | any): NodeLinkedById | null {
    return this.nodes[nodeId] || null;
  }

  addNode(node: NodeLinkedById) {
    this.nodes[node.id] = node;
  }

  addChildrenToNode(nodeId: NodeID, children: NodeID[], createNew = true) {
    const parentNode = this.getNode(nodeId);
    if (!parentNode) return;

    if (createNew) {
      children.forEach((childId) => {
        if (!this.getNode(childId)) {
          this.addNode({ id: childId, children: null, parent: nodeId });
        }
      });
    } else {
      children = children.filter((childId) => this.getNode(childId));
    }

    children.forEach((childId) => {
      const childNode = this.getNode(childId);
      if (childNode) {
        childNode.parent = nodeId;
      }
    });

    if (parentNode.children === null) {
      parentNode.children = children;
    } else {
      parentNode.children.push(...children);
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

  calculatePositions() {
    return positionTree(this.nodes, this.getRoot().id);
  }
}

const tree = new GeneralTree({ id: 0, children: null });
tree.addChildrenToNode(0, [1, 2, 3, 4]);
tree.addChildrenToNode(1, [10]);
tree.addChildrenToNode(2, [5, 6]);
tree.addChildrenToNode(4, [7, 8, 9]);
console.log(tree.calculatePositions());
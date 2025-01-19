import positionTree from "./positioning";
import { NodeLinkedById, NodeID, NodesMap } from "./types";

export class GeneralTree {
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

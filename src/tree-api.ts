import positionTree from "./positioning";
import { NodeLinkedById, NodeID, NodesMap, SeparationValues } from "./types";

export class GeneralTree {
  private nodes: NodesMap = {};
  private root: NodeLinkedById;

  /**
   * Initialize the tree with a root node.
   * @param {Object} root
   * @param {number} root.id
   * @param {number[]} root.children
   */
  constructor(root: Omit<NodeLinkedById, "parent">) {
    this.root = { ...root, parent: null };
    this.nodes[root.id] = this.root;
  }

  /**
   * Changes the root of tree.
   */
  setRoot(id: NodeID) {
    if (this.nodes.hasOwnProperty(id)) {
      this.root = this.nodes[id];
    }
  }

  /**
   * Returns all tree nodes as array.
   * @returns NodeLinkedById[]
   */
  getAllNodes() {
    return Object.values(this.nodes);
  }

  getNode(nodeId: NodeID | any): NodeLinkedById | null {
    return this.nodes[nodeId] || null;
  }

  addNode(node: NodeLinkedById) {
    this.nodes[node.id] = node;
  }
  /**
   * Method requires existing node. Third argument allows to control creating of new nodes from 'children' array.
   */
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
  /**
   * Removes node from tree and also reconnects its children to node parent
   */
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
  /**
   * Calculates positions of all nodes currently presented in a tree.
   * @param {SeparationValues} [separation] - Optional separation values for positioning the nodes.
   */
  calculatePositions(separation?: SeparationValues) {
    if (this.root) return positionTree(this.nodes, this.root.id, separation);
    return new Error("Root is not defined");
  }
}

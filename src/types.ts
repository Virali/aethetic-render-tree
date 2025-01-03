// types for positioning
export type NodeLinkedById = LinkedNode;

export type TraversalNode = LinkedNode & {
  leftNeighbor: NodeID | null;
  preliminary: number;
  modifier: number;
  position: PositionXY;
  traversed: boolean;
};

export type InternalNode = TraversalNode & { children: NodeID[]; parent: NodeID };

export type AlterableNode<T = BasicNodeProps> = BasicNodeProps &
  Partial<
    Omit<TraversalNode, "leftNeighbor" | "children" | "parent"> & {
      leftNeighbor: T | null;
      children: T[] | null;
      parent: T | null;
    }
  >;

export type AlterableNodeById = AlterableNode<NodeID>;

export type PositionedNode = LinkedNode & {
  position: PositionXY;
  [key: string]: any;
};

export type DefinitelyTruthy<T> = false extends T
  ? never
  : 0 extends T
  ? never
  : "" extends T
  ? never
  : null extends T
  ? never
  : undefined extends T
  ? never
  : T;

type LinkedNode<T = NodeID> = BasicNodeProps & {
  children: (T extends object ? LinkedNode<T>[] : T[]) | null;
  parent: (T extends object ? LinkedNode<T> : T) | null;
} & (T extends object ? T : {});

export interface BasicNodeProps {
  id: number;
}

export type NodeID = BasicNodeProps["id"];

interface PositionXY {
  x: number;
  y: number;
}

export type SeparationValues = {
  siblingSpace: number,
  meanNodeSize: number,
  levelSeparation: number,
  subtreeSeparation: number,
}

export type NodeGetter = (id: number) => TraversalNode;

export type NodesMap = Record<NodeID, NodeLinkedById>;

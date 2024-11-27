// types for positioning
export type NodeLinkedById = LinkedNode<number>;

export type TraversalNode = NodeLinkedByRef<{
  leftNeighbor: TraversalNode | null;
  preliminary: number;
  modifier: number;
  position: PositionXY;
  caption: string;
  traversed: boolean;
}>;

export type AlterableLinkedNode = Partial<
  Omit<
    TraversalNode,
    keyof BasicNodeProps | keyof LinkedNode<object> | "leftNeighbor"
  >
> &
  Pick<TraversalNode, keyof BasicNodeProps | keyof LinkedNode<object>> & {
    leftNeighbor: AlterableLinkedNode | null;
  };

export type PositionedNode = NodeLinkedByRef<{
  position: PositionXY;
  [key: string]: any;
}>;

export type AnyNodeLinkedByRef = NodeLinkedByRef<{ [key: string]: any }>;

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

type NodeLinkedByRef<ExtraProps extends object> = LinkedNode<ExtraProps> &
  Omit<ExtraProps, keyof LinkedNode<ExtraProps>>;

interface LinkedNode<T> extends BasicNodeProps {
  children: (T extends object ? LinkedNode<T>[] : T[]) | null;
  parents: (T extends object ? LinkedNode<T>[] : T[]) | null;
  subtreeRoot?: T extends object ? LinkedNode<T> : T;
}

interface BasicNodeProps {
  id: number;
  type?: string;
}

interface PositionXY {
  x: number;
  y: number;
}

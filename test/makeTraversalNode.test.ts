import { makeTraversalNodes } from "../src/makeTraversalNodes";
import { SIMPLE_IDED_TREE, SIMPLE_TRAVERSAL_TREE } from "./constants";

test("make traversal tree from simple one", () => {
  expect(makeTraversalNodes(SIMPLE_IDED_TREE).graph).toEqual(
    SIMPLE_TRAVERSAL_TREE
  );
});

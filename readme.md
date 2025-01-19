### Aesthetic tree renderer

Code is based on article written by John Q. Walker II "A Node-Positioning algorithm for General Trees". You can read this article on the [website](https://www.cs.unc.edu/techreports/89-034.pdf) of North Carolina University or [here](https://drive.google.com/file/d/1F-kOW-Yq2KFso3cirz1Koi9CkfDrEBOr/view?usp=sharing).

# GeneralTree Class API Documentation

## Overview

The `GeneralTree` class represents a general tree data structure where each node can have an arbitrary number of children. This class provides methods to add nodes, calculate positions of nodes, and traverse the tree.

## Usage

### Example

Here is an example of how to use the `GeneralTree` class:

```javascript
// Import the GeneralTree class
const GeneralTree = require("./GeneralTree");

// Define the root node
const rootNode = { id: 1, children: [2, 3], parent: null };

// Create an instance of GeneralTree
const tree = new GeneralTree(rootNode);

// Add nodes to the tree
tree.addNode({ id: 2, children: [], parent: 1 });
tree.addNode({ id: 3, children: [4], parent: 1 });
tree.addNode({ id: 4, children: [], parent: 3 });

// Or add nodes as children
tree.addChildrenToNode(2, [5, 6, 7]);

// Calculate positions of nodes and receive result
const positionedNodes = tree.calculatePositions();
positionedNodes: [
  {
    id: 1,
    children: [2, 3, 4],
    parent: null,
    preliminary: 5,
    modifier: 0,
    leftNeighbor: null,
    position: { x: 6, y: 0 },
  },
  {
    id: 2,
    children: [5, 6, 7],
    parent: 1,
    preliminary: 0,
    modifier: 0,
    leftNeighbor: null,
    position: { x: 0, y: 2 },
  },
  ...
];
```

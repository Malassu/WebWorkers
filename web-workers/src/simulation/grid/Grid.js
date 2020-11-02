// A Quadtree containing four other Grids or none when the Grid is a leaf node.

// Note: We assume that all elements are within bounds.
// TODO: Add minimum bounds.
class Grid {
  constructor(bounds, elementLimit, parent, elements, depth = 0) {
    this._bounds = bounds;
    this._parent = parent;
    this._children = null; // Note: children are other Grid objects and elements are items we are organizing with the Grid. 
    this._elements = null;
    this._depth = depth;

    if (elements.length > elementLimit && depth < 3) {
      // Non leaf nodes store other grids.
      this.subdivide(elementLimit, elements);
    }
    else {
      // Leaf nodes store references to elements
      elements.map(element => element.grid = this);
      this._elements = new Set(elements);
      console.log(depth);
    }
  }

  subdivide(elementLimit, elements) {
    // Bounds of new grids

    const xMin = this._bounds.x[0];
    const xMid = this._bounds.x[0] + Math.floor((this._bounds.x[1] - this._bounds.x[0]) / 2);
    const xMax = this._bounds.x[1];

    const yMin = this._bounds.y[0];
    const yMid = this._bounds.y[0] + Math.floor((this._bounds.y[1] - this._bounds.y[0]) / 2);
    const yMax = this._bounds.y[1];

    const childrenBounds = [
      {
        x: [xMin, xMid],
        y: [yMin, yMid]
      },
      {
        x: [xMid, xMax],
        y: [yMin, yMid]
      },
      {
        x: [xMin, xMid],
        y: [yMid, yMax]
      },
      {
        x: [xMid, xMax],
        y: [yMid, yMax]
      }
    ];

    this._children = childrenBounds.map(bounds => {
      // Find elements that are in the new Grid
      const filteredElements = elements.filter(element => element.inBounds(bounds));

      return new Grid(bounds, elementLimit, parent, filteredElements, this._depth + 1);
    });

    // After subdivision, remove elements as this is no longer a leaf node.
    this._elements = null;
  }
  

  unsubdivide() {
    this._elements = this.elements;
    this.children = null;
  }

  // Check if the Grid should subdivide itself
  checkSubdivide(elementLimit) {
    if (!this._elements)
      throw new TypeError("Not a leaf node.");

    return this._elements.length > elementLimit;
  }

  // Check if the Grid's could subdivide.
  checkUnsubdivide(elementLimit) {
    if (this._elements)
      throw new TypeError("A leaf node can't unsubdivide.");

    return this.elements.length > elementLimit;
  }

  addElement(element) {
    if (this._elements)
      this._elements.add(element);
  }

  removeElement(element) {
    if (this._elements)
      this._elements.delete(element);
  }

  get bounds() {
    return this._bounds;
  }

  get parent() {
    return this._parent;
  }

  get children() {
    return this._children;
  }

  get leafNodes() {
    if (this._elements)
      return [this];

    return [].concat.apply([], this.children.map(child => child.leafNodes));
  }

  get elements() {
    if (this._elements)
      return this._elements;

    return this.children.map(grid => grid.elements).reduce((acc, curr) => {
      return new Set([...curr, ...acc]);
    }, new Set());
  }

};

export default Grid;
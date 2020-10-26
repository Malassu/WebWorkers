// A Quadtree containing four other Grids or none when the Grid is a leaf node.

// Note: We assume that all elements are within bounds.
// TODO: Add minimum bounds.
class Grid {
  constructor(bounds, elementLimit, parent, elements) {
    this._bounds = bounds;
    this._parent = parent;
    this._children = []; // Note: children are other Grid objects and elements are items we are organizing with the Grid. 
    this._elements = new Set(...elements);

    if (elements.length > elementLimit) {
      this.subdivide(elementLimit, elements);
    }
  }

  subdivide(elementLimit) {
    // Bounds of new grids
    const childrenBounds = [
      {
        x: [this._bounds.x[0], Math.floor(this._bounds.x[1] / 2)],
        y: [this._bounds.y[0], Math.floor(this._bounds.y[1] / 2)]
      },
      {
        x: [Math.floor(this._bounds.x[1] / 2), this._bounds.x[1]],
        y: [this._bounds.y[0], Math.floor(this._bounds.y[1] / 2)]
      },
      {
        x: [this._bounds.x[0], Math.floor(this._bounds.x[1] / 2)],
        y: [Math.floor(this._bounds.y[1] / 2), this._bounds.y[1]]
      },
      {
        x: [Math.floor(this._bounds.x[1] / 2), this._bounds.x[1]],
        y: [Math.floor(this._bounds.y[1] / 2), this._bounds.y[1]]
      }
    ];

    this._children = childrenBounds.map(bounds => {
      // Find elements that are in the new Grid
      const filteredElements = [...this._elements].filter(element => element.inBounds(bounds));

      return new Grid(bounds, elementLimit, parent, filteredElements);
    });
  }

  unsubdivide() {
    this.children = [];
  }

  addElement(element) {
    this.elements.add(element);
  }

  removeElement(element) {
    this.elements.delete(element);
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

  get elements() {
    return this._elements;
  }

};

export default Grid;
class Grid {
  constructor(bounds, elementLimit, parent, elements, depth = 0) {
    this._bounds = bounds;
    this._parent = parent;
    this._children = null; // Note: children are other Grid objects and elements are items we are organizing with the Grid. 
    this._elements = null;
    this._depth = depth;

    if (elements.length > elementLimit) {
      // Non leaf nodes store other grids.
      this.subdivide(elementLimit, elements);
    }
    else {
      // Leaf nodes store references to elements
      elements.map(element => element.grid = this);
      this._elements = new Set(elements);
    }
  }

  subdivide(elementLimit, elements = [...this._elements]) {
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

      return new Grid(bounds, elementLimit, this, filteredElements, this._depth + 1);
    });

    // After subdivision, remove elements as this is no longer a leaf node.
    this._elements = null;
  }
  

  unsubdivide() {
    this._elements = this.elements;
    this._children = null;
  }

  // Check if the Grid should subdivide itself
  checkSubdivide(elementLimit) {
    if (!this._elements)
      throw new TypeError("Not a leaf node.");

    return this._elements.size > elementLimit;
  }

  // Check if the Grid's could subdivide.
  checkUnsubdivide(elementLimit) {
    if (this._elements)
      return false;

    return this.elements.size < elementLimit;
  }

  addElement(element) {
    if (this._elements)
      this._elements.add(element);
  }

  removeElement(element) {
    if (this._elements)
      this._elements.delete(element);
  }

  findFittingGrid(element) {
    if (element.inBounds(this.bounds))
    return this;

    return this.parent.findFittingGrid(element);
  }

  findFittingLeaf(element) {
    if (!element.inBounds(this.bounds))
      return null;

    if (this._elements)
      return this;

    return this.leafNodes.find(leaf => element.inBounds(leaf.bounds));
  }

  get bounds() {
    return this._bounds;
  }

  get parent() {
    return this._parent || this;
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

class Vector2D {
  constructor(x=0, y=0) {
    this.components = { x, y };
  }

  add({ components }) {
    return new Vector2D(
      ...Object.keys(components).map((key) => this.components[key] + components[key])
    );
  }
  
  subtract({ components }) {
    return new Vector2D(
      ...Object.keys(components).map((key) => this.components[key] - components[key])
    );
  }

  scale(value) {
    return new Vector2D(
      ...Object.values(this.components).map((componentValue) => value*componentValue)
    );
  }

  divide(value) {
    return this.scale(1.0 / value);
  }

  get length() {
    return Math.hypot(...Object.values(this.components));
  }

  dot({ components }) {
    return Object.keys(components).reduce((acc, key) => acc + components[key] * this.components[key], 0);
  }

  normalized() {
    return this.divide(this.length);
  }

  get x() {
    return this.components.x
  }

  set x(value) {
    if (typeof value !== "number")
      throw Error("Incorrect data type!");

    this.components.x = value;
  }

  get y() {
    return this.components.y
  }

  set y(value) {
    if (typeof value !== "number")
      throw Error("Incorrect data type!");

    this.components.y = value;
  }

  get copy() {
    return new Vector2D(this.x, this.y);
  }

};

const getRandom1D = (min, max) => Math.random() * (max - min) + min;
const getRandom2D = (firstInterval, secondInterval = firstInterval) => new Vector2D(getRandom1D(...firstInterval), getRandom1D(...secondInterval));

class WorldState {
  constructor(options) {

    const defaultState = {
      bounded: true,          // The worlds should have "walls" that boids bounce off of.
      bounds: {               // The world bounds define 2D range of position values for boids. 
        x: [-1, 1],
        y: [-1, 1]
      },
      boidRadius: 0.1,
      maxSpeed: 1.0,          // Max speed all boids should follow.
      numOfBoids: 0,          // Current number of boids
      collision: true,        // Boids can bounce off of each other.
      explosion: true,        // Boids can randomly "explode" pushing surrounding boids away. 
      explosionsPerTick: 1,   // Maximum number of explosions per tick NOTE: Should be at most numOfBoids
      explosionProb: 0.01,    // probability of explosion per tick,
      explosionRadius: 0.01,  // Radius of explosion
      explosionIntesity: 2.0,  // Intensity of explosion.
      gridElementLimit: 20    // Grid leaf nodes have < gridElementLimit elements in them 
    };

    Object.keys(defaultState).forEach(key => this[key] = (typeof options === "object" && typeof options[key] === typeof defaultState[key] ) ? options[key] : defaultState[key]);
    
  };

  setState(option, value) {
    if (this[option]!== undefined)
      this[option] = value;
  };

  getState(option) {
    if (this[option] !== undefined)
      return this[option];

    return Error("Value not defined");
  };

  // Get active behaviors that should be used for the next tick of the simulation.
  get behaviors() {
    return ["collision", "explosion"].filter(type => this[type]);
  }

};

class Boid {
  constructor(options) {
    const defaultState = {
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
      acceleration: new Vector2D(0, 0),
      radius: 0.01,
      maxSpeed: 0.01
    };

    this._grid = null;

    Object.keys(defaultState).forEach(key => this[key] = (typeof options === "object" && typeof options[key] === typeof defaultState[key] ) ? options[key] : defaultState[key]);
  }

  tick(bounds) {
    this.velocity = this.velocity.add(this.acceleration);

    if (this.velocity.length > this.maxSpeed)
      this.velocity = this.velocity.normalized().scale(this.maxSpeed);

    this.position = this.position.add(this.velocity);

    this.x = Math.max(Math.min(this.x, bounds.x[1]), bounds.x[0]);
    this.y = Math.max(Math.min(this.y, bounds.y[1]), bounds.y[0]);

    this.acceleration = this.velocity.scale(-0.02);

    if (this._grid) {
      this._grid.removeElement(this);
      this._grid = this._grid.findFittingGrid(this).findFittingLeaf(this);
      this._grid.addElement(this);
    }
  }

  inBounds(bounds) {
    return this.x >= bounds.x[0] && this.x <= bounds.x[1] && this.y >= bounds.y[0] && this.y <= bounds.y[1];
  }

  get x() {
    return this.position.x;
  }

  set x(value) {
    if (typeof value !== "number")
      throw Error("Incorrect data type!");

    this.position.x = value;
  }

  get y() {
    return this.position.y;
  }

  set y(value) {
    if (typeof value !== "number")
      throw Error("Incorrect data type!");

    this.position.y = value;
  }

  get grid() {
    return this._grid;
  }

  set grid(grid) {
    this._grid = grid;
  }

};

// https://stackoverflow.com/questions/19269545/how-to-get-a-number-of-random-elements-from-an-array
function getRandom(arr, n) {
  var result = new Array(n),
      len = arr.length,
      taken = new Array(len);
  if (n > len)
      throw new RangeError("getRandom: more elements taken than available");
  while (n--) {
      var x = Math.floor(Math.random() * len);
      result[n] = arr[x in taken ? taken[x] : x];
      taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}

class BoidWorld {
  constructor(state) {
    this._state = new WorldState(state);
    
    this._generateBoid = this._generateBoid.bind(this);
    this._bounded = this._bounded.bind(this);
    this._collision = this._collision.bind(this);
    this._explosion = this._explosion.bind(this);

    this._boids = Array.from({ length: this._state.getState("numOfBoids") }, this._generateBoid);
    this._grid = new Grid(this._state.getState("bounds"), this._state.getState("gridElementLimit"), null, this._boids);

  };

  // Creates a new boids with random coordinates within bounds.
  _generateBoid() {
    const { x, y } = this._state.getState("bounds");
    const position = getRandom2D(x,y);
    const maxSpeed = this.getState("maxSpeed");

    return new Boid({ 
      position, 
      radius: this._state.getState("boidRadius"),
      maxSpeed: this._state.getState("maxSpeed"),
      velocity: getRandom2D([-maxSpeed, maxSpeed])
    });
  }

  // Runs next step of the simulation.
  tick() {
    ["bounded", "collision", "explosion"].map(rule => {
      if (this._state.getState(rule))
        this[`_${ rule }`]();
    });


    this._boids.map(boid => boid.tick(this._state.getState("bounds")));

    const elementLimit = this.getState("gridElementLimit");

    // Separate leaf nodes to the ones that require subdivison and the ones that don't.
    let leafNodes = this._grid.leafNodes.reduce((acc, curr) => {
      if (curr.checkSubdivide(elementLimit)) {
        acc.subdivide.push(curr);
      }
      else {
        acc.others.push(curr);
      }

      return acc;
    }, {
      subdivide: [],
      others: [] 
    });

    leafNodes.subdivide.map(grid => grid.subdivide(elementLimit));

    // Now consider grids that might need to be unsubdivided
    leafNodes = leafNodes.others;

    while (true) {
      leafNodes = leafNodes.map(node => node.parent).filter(parent => parent.checkUnsubdivide(elementLimit));

      if (leafNodes.length) {
        leafNodes.map(node => node.unsubdivide());
      }
      else {
        break;
      }
    }

  }

  addBoid() {
    this._boids.push(this._generateBoid());
    this.setState("numOfBoids", this._boids.length);
  }

  removeBoid() {
    if (this.getState("numOfBoids")) {
      this._boids.pop();
      this.setState("numOfBoids", this._boids.length);
    }

  }

  setState(option, value) {
    this._state.setState(option, value);
  }

  getState(option) {
    return this._state.getState(option);
  }

  get boids() {
    return this._boids;
  }

  get grid() {
    return this._grid;
  }

  // For all boids:
  // 1. Check if boid is near a boundary
  // 2. If not do nothing
  // 3. If it is then add calculate velocity along the corresponding axis and add -2 times that value to acceleration.
  _bounded() {
    const bounds = this._state.getState("bounds");
    
    // Direction indicates wheter the boid is near the minimum border or maximum border.
    const calculateBounce = (boid, axis, direction) => {
      // Choose a point on the edge we should start moving towards. This is the opposite edge of the one the boid is near to.
      // For instance, if the boid is near the minimum x edge (probably x = 0), then the boid should move towards the maximum x edge.
      const point = boid.position.copy;
      point[axis] = direction;

      const acceleration = point.subtract(boid.position).normalized().scale(Math.abs(boid.velocity[axis]) * 2);

      boid.acceleration = boid.acceleration.add(acceleration);
    };

    for (const boid of this._boids) {

      for (const axis in bounds) {
        if (boid[axis] - boid.radius <= bounds[axis][0]) {
          calculateBounce(boid, axis, bounds[axis][1]);
        }

        else if (boid[axis] + boid.radius >= bounds[axis][1])
          calculateBounce(boid, axis, bounds[axis][0]);
      }
    }
  }

  // Calculate collision forces
  _collision() {
    const indices = [ ...this._boids.keys() ];

    // Loop over all boids.
    for (const index1 of indices) {
      const boid1 = this._boids[index1];
      // Loop over boids that index1 has not used.
      // This way we can updated both boidi and boidj in one iteration and only do one of the symmetrical cases (boidi -> boidj) and (boidj -> boidi)
      // where (boidi -> boidj) represents boid with index1 = i colliding with boid with index2 = j
      const leafGrids = boid1.grid.parent.parent.leafNodes.filter(grid => boid1.inBounds(grid.bounds));
      const collidableBoids = leafGrids.reduce((acc, grid) => {
        return acc.concat([...grid.elements]);
      }, []);

      for (const boid2 of collidableBoids) {

        // 1. Calculate distance d between two boids
        const distVec = boid2.position.subtract(boid1.position);
        
        // 2. Check d - radius of boid 1 - radius of boid 2 <= 0
        if (distVec.length > 0 && distVec.length <= boid1.radius + boid2.radius) {
          
          // 3. If true calculate n = normalized(p2 - p1) where p1 is the position of the first boid and p2 the position of the second boid. The normal points at the second boid.
          const n = distVec.normalized();
          const neg_n = n.scale(-1);

          // 4. Calculate f1 = dot(v1, -n)*(-n) and f2 = dot(v2, n)*(n).
          // Abs is used to deal with the case where dot(v, n) < 0 which would cause the collision to pull the boid towards the other boid.
          const f1 = neg_n.scale(Math.abs(boid1.velocity.dot(neg_n)));
          const f2 = n.scale(Math.abs(boid2.velocity.dot(n)));

          // 5. Calculate a1 = 2*f1 - f2 and a2 = 2*f2 + f1.
          boid1.acceleration = boid1.acceleration.add(f1.scale(2).subtract(f2));
          boid2.acceleration = boid2.acceleration.add(f2.scale(2).subtract(f1));

        }
      }
    }
    

  }
  
  get toJson() {
    return JSON.stringify(this._boids.map(boid => ({ x: boid.x, y: boid.y })));
  }

  // Calculate explosion forces.
  _explosion() {
    // Choose state.explosionsPerTick number of boids.
    const randomBoids = getRandom(this._boids, this._state.getState("explosionsPerTick"));
    const explosionRadius = this.getState("explosionRadius");
    const explosionIntensity = this.getState("explosionIntesity");
    const explosionProb = this.getState("explosionProb");

    // For each boid B:
    for (const explosionBoid of randomBoids) {
      if (Math.random() < explosionProb) {
        
        for (const victimBoid of this._boids) {
          // Notice that n can later be used as a normal vector for calculating the acceleration.
          let n = victimBoid.position.subtract(explosionBoid.position);
          const dist = n.length;

          // If dist === 0 assume victimBoid === explosion boid
          if (dist > 0 && dist < explosionRadius + explosionBoid.radius + victimBoid.radius) {
            // Calculate normal vector n from explosionBoid to victim
            n = n.normalized();

            // Add (explosionRadius / dist )*state.explosionIntensity * dot(v2, n)*(n) to the other boid's acceleration. v2 is the other boid's velocity.
            //console.log(explosionIntensity);
            victimBoid.acceleration = victimBoid.acceleration.add(n.scale((explosionRadius / dist ) * explosionIntensity)).add(n.scale(Math.abs(n.dot(victimBoid.velocity))));
          }
        }
      }
    } 
    
  }

};

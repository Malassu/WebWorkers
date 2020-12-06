import WorldState from "./WorldState.js";
import Boid from "./Boid.js";
import Grid from "../grid/Grid.js";
import BinaryBoidParser from "./BinaryBoidParser.js";
import { getRandom2D, Vector2D } from "../../utils/vectors.js";
import { timingSafeEqual } from "crypto";

const BOID_RENDER_STATE = ["position", "collided", "exploded"];
const BOID_FORCE_STATE = ["acceleration", "collided", "exploded"];
const BOID_MOVE_STATE = ["acceleration"];


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
  constructor(state, sharedBuffer) {
    this._state = new WorldState(state);
    
    this._generateBoid = this._generateBoid.bind(this);
    this._bounded = this._bounded.bind(this);
    this._collision = this._collision.bind(this);
    this._explosion = this._explosion.bind(this);
    this._queuedBuffer = null;

    // TODO: Make use of binary parser optional
    this._binaryParser = new BinaryBoidParser(this._state.getState("numOfBoids"), sharedBuffer);

    // Either use data from received buffer or create new boids
    if (sharedBuffer) {
      this._boids = this._binaryParser.getBoids().map(({ position, velocity, id }) => this._generateBoid(false, position, velocity, id));
    } 
    else {
      this._boids = Array.from({ length: this._state.getState("numOfBoids") }, () => this._generateBoid());
      this._binaryParser.update(this._boids, 0, this._boids.length);
    }

    this._grid = new Grid(this._state.getState("bounds"), this._state.getState("gridElementLimit"), null, this._boids);
  };

  // Creates a new boids with random coordinates within bounds.
  _generateBoid(addToGrid = false, pos, vel, id) {
    const { x, y } = this._state.getState("bounds");
    const maxSpeed = this.getState("maxSpeed");

    // Generate random vectors if not given
    const position = typeof pos === "undefined" ? getRandom2D(x,y) : new Vector2D(pos.x, pos.y);
    const velocity = typeof vel === "undefined" ? getRandom2D([-maxSpeed, maxSpeed]) : new Vector2D(vel.x, vel.y);

    const boid = new Boid({ 
      position,
      velocity,
      radius: this._state.getState("boidRadius"),
      maxSpeed: this._state.getState("maxSpeed"),
      id
    });

    if (addToGrid) {
      boid.grid = this._grid.findFittingLeaf(boid);
    }
    
    return boid 
  }

  // Runs next step of the simulation by calculating forces affecting a partition of boids
  tick(start=0, end=this._boids.length, explosionIndices=this.generateExplosions()) {
    this._grid = new Grid(this._state.getState("bounds"), this._state.getState("gridElementLimit"), null, this._boids);

    for (let boid of this.boids) {
      boid.collided = false;
    }

    // Apply behavior forces
    ["bounded", "collision", "explosion"].map(rule => {
      if (this._state.getState(rule))
        this[`_${ rule }`](start, end, explosionIndices);
    });

    for (let index = start; index < end; index++) {
      this._boids[index].tick(this._state.getState("bounds"));
    }
  }

  // Calculate new boid positions based on simulated forces
  move() {
    // Update boid positions
    for (let i=0; i<this._boids.length; i++) {
      this._boids[i].tick(this._state.getState("bounds"));
    }
  }

   updateGrid() {

     // Find fitting leaf
     this._boids.map(boid => this._grid.findFittingLeaf(boid));

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
    this._boids.push(this._generateBoid(true));
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

  set boids(value) {
    this._boids = value;
  }

  get grid() {
    return this._grid;
  }

  // For all boids:
  // 1. Check if boid is near a boundary
  // 2. If not do nothing
  // 3. If it is then add calculate velocity along the corresponding axis and add -2 times that value to acceleration.
  _bounded(start, end) {
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

    for (let i=start; i<end; i++) {
      const boid = this.boids[i];

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
  _collision(start, end) {

    // Loop over all boids.
    for (let i=start; i<end; i++) {
      const boid1 = this.boids[i];
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

          // 6. Set collision status
          boid1.collided = true;
        }
      }
    }
    

  }

  // Calculate explosion forces.
  // _explosion(start, end) {
  //   // Choose state.explosionsPerTick number of boids.
  //   const randomBoidIndices = getRandom(this._boids.slice(start, end).map(boid => boid.id), this._state.getState("explosionsPerTick"));
  //   const explosionRadius = this.getState("explosionRadius");
  //   const explosionIntensity = this.getState("explosionIntesity");
  //   const explosionProb = this.getState("explosionProb");

  //   // For each boid B:
  //   for (const explosionIndex of randomBoidIndices) {
  //     const explosionBoid = this._boids[explosionIndex];
  //     if (Math.random() < explosionProb) {
  //       explosionBoid.exploded = true;
        
  //       for (const victimBoid of this._boids) {
  //         // Notice that n can later be used as a normal vector for calculating the acceleration.
  //         let n = victimBoid.position.subtract(explosionBoid.position);
  //         const dist = n.length;

  //         // If dist === 0 assume victimBoid === explosion boid
  //         if (dist > 0 && dist < explosionRadius + explosionBoid.radius + victimBoid.radius) {
  //           // Calculate normal vector n from explosionBoid to victim
  //           n = n.normalized();

  //           // Add (explosionRadius / dist )*state.explosionIntensity * dot(v2, n)*(n) to the other boid's acceleration. v2 is the other boid's velocity.
  //           //console.log(explosionIntensity);
  //           victimBoid.acceleration = victimBoid.acceleration.add(n.scale((explosionRadius / dist ) * explosionIntensity)).add(n.scale(Math.abs(n.dot(victimBoid.velocity))));
  //         }
  //       }
  //     }
  //   }
  // }

  // Calculate explosion forces for boids that were flagged to explode
  _explosion(start, end, explosionIndices) {
    const explosionRadius = this.getState("explosionRadius");
    const explosionIntensity = this.getState("explosionIntesity");
    const explodingBoids = this._boids.filter(boid => explosionIndices.includes(boid.id));
    
    for (const explosionBoid of explodingBoids) {
      // If this boid was flagged to explode go through the victims within assigned section
      for (const victimBoid of this._boids.slice(start, end)) {
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

  generateExplosions() {
    const randomBoidIndices = getRandom(this._boids, this._state.getState("explosionsPerTick")).map(boid => boid.id);
    const explosionProb = this.getState("explosionProb");
    let explodionIndices = [];

    for (const boid of this._boids) {
      if (randomBoidIndices.includes(boid.id) && Math.random() < explosionProb) {
        boid.exploded = true;
        explodionIndices.push(boid.id);
      } else {
        boid.exploded = false;
      }
    }
    return explodionIndices;
  }

  serializedWorldState() {
    return {
      bounded: this._state.bounded,
      bounds: this._state.bounds,
      boidRadius: this._state.boidRadius,
      maxSpeed: this._state.maxSpeed,
      numOfBoids: this._state.numOfBoids,
      collision: this._state.collision,
      explosion: this._state.explosion,
      explosionsPerTick: this._state.explosionsPerTick,
      explosionProb: this._state.explosionProb,
      explosionRadius: this._state.explosionRadius,
      explosionIntesity: this._state.explosionIntesity,
      gridElementLimit: this._state.gridElementLimit
    }
  }

  // create a clone of BoidWorld based on serialized WorldState data
  static cloneWorld(serialized, sharedBuffer) {
    // TODO: currently spawns new boids to random locations in the clone instead of also cloning boids
    const cloneWorld = new BoidWorld(serialized, sharedBuffer);
    return cloneWorld;
  }

  boidsFromSerialized(boidData) {
    const newBoids = Array.from(boidData, ({ position, velocity, id }) => this._generateBoid(true, position, velocity, id));
    
    // replace boids and create new grid
    this._boids = newBoids;
    this.gridUpdate();
  }

  boidsFromJson(jsonStr) {
    this.boidsFromSerialized(JSON.parse(jsonStr));
  }

  gridUpdate() {
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

  queueBuffer(buffer) {
    this._queuedBuffer = buffer;
  }

  updateBuffer() {
    if (this._queuedBuffer) {
      this.binaryBuffer = this._queuedBuffer;
      this._queuedBuffer = null;
      this._boids = this._binaryParser.getBoids().map(({ position, velocity, id }) => this._generateBoid(false, position, velocity, id));
      this._grid = new Grid(this._state.getState("bounds"), this._state.getState("gridElementLimit"), null, this._boids);
      return true;
    }

    return false;
  }

  get binaryBuffer() {
    return this._binaryParser.buffer;
  }

  get binaryArrays() {
    this._binaryParser.getArrays();
  }

  set binaryBuffer(buffer) {
    this._binaryParser.buffer = buffer;
  } 

  getTransferableBoidArrays(numOfSlices) {
    return BinaryBoidParser.arraysFromBoids(this._boids, numOfSlices);
  }

  writeBoidsToTransferable(data) {

    const { 
      pXArray, pYArray, vXArray, vYArray, aXArray, aYArray, 
      rArray, maxSArray, idArray, colArray, expArray
    } = BinaryBoidParser.arraysFromBuffers(data);

    for (let index = 0; index < idArray.length; index++) {
      const boid = this._boids[idArray[index]];

      pXArray[index] = boid.x;
      pYArray[index] = boid.y;
      vXArray[index] = boid.velocity.x;
      vYArray[index] = boid.velocity.y;
      colArray[index] = boid.collided;
    }

    return [ 
      pXArray.buffer, pYArray.buffer, vXArray.buffer, vYArray.buffer, aXArray.buffer, aYArray.buffer, 
      rArray.buffer, maxSArray.buffer, idArray.buffer, colArray.buffer, expArray.buffer
    ];
  }

  mergeTransferables(data) {
    const { 
      pXArray, pYArray, vXArray, vYArray, aXArray, aYArray, 
      rArray, maxSArray, idArray, colArray, expArray
    } = BinaryBoidParser.arraysFromBuffers(data);


    for (let index = 0; index < idArray.length; index++) {
      const boid = this._boids[idArray[index]];

      boid.x = pXArray[index];
      boid.y = pYArray[index];
      boid.velocity.x = vXArray[index];
      boid.velocity.y = vYArray[index];
      boid.acceleration.x = aXArray[index];
      boid.acceleration.y = aYArray[index];
      boid.collided = colArray[index];
      boid.exploded = expArray[index];
    }

    return [ 
      pXArray.buffer, pYArray.buffer, vXArray.buffer, vYArray.buffer, aXArray.buffer, aYArray.buffer, 
      rArray.buffer, maxSArray.buffer, idArray.buffer, colArray.buffer, expArray.buffer
    ];
  }

  // TODO: Allow partial update based on intervals.
  boidsFromBinary() {
    this._binaryParser.getBoids().map((state, index) => {
      this._boids[index].updateState(state);
    });
  }

  boidsToBuffer() {
    return BinaryBoidParser.bufferFromBoids(this._boids);
  }

  // TODO: Allow partial update based on intervals.
  boidsToBinary(start=0, end=this._boids.length) {
    this._binaryParser.update(this._boids, start, end);
  }

  boidsToJson(start=0, end=this._boids.length) {
    return JSON.stringify(this.serializedBoids(start, end));
  }

  
  serializedBoids(start=0, end=this._boids.length) {
    return this._boids.slice(start, end).map(boid => {
      return boid.serializedBoid;
    });
  }

  mergeBoids(updatedBoids) {
    for (const boid of updatedBoids) {
      this._boids[boid.id].updateState(boid);
    }
  }

  mergeBoidsJson(jsonStr) {
    this.mergeBoids(JSON.parse(jsonStr));
  }

  applyForcesJson(jsonStr) {
    this.applyForces(JSON.parse(jsonStr));
  }

  applyForces(updatedBoids) {
    for (const updatedBoid of updatedBoids) {
      this._boids[updatedBoid.id].setAcceleration(updatedBoid);
    }
  }

  applyPositions(boidData) {
    const updatedBoids = JSON.parse(boidData);

    for (const updatedBoid of updatedBoids) {
      this._boids[updatedBoid.id].x = updatedBoid.position.x;
      this._boids[updatedBoid.id].y = updatedBoid.position.y;
    }
  }

};

export default BoidWorld;

import WorldState from "./WorldState.js";
import Boid from "./Boid.js";
import { getRandom2D, Vector2D } from "../../utils/vectors.js";

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
      //velocity: getRandom2D([-maxSpeed, maxSpeed])
    });
  }

  // Runs next step of the simulation.
  tick() {
    ["bounded", "collision", "explosion"].map(rule => {
      if (this._state.getState(rule))
        this[`_${ rule }`]();
    });

    this._boids.map(boid => boid.tick(this._state.getState("bounds")));
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
    // 1. Calculate distance d between two boids
    // 2. Check d - radius of boid 1 - radius of boid 2 <= 0
    // 3. If false proceed to the next calculation
    // 4. If true calculate n = normalized(p2 - p1) where p1 is the position of the first boid and p2 the position of the second boid. The normal points at the second boid.
    // 5. Calculate f1 = dot(v1, -n)*(-n) and f2 = dot(v2, n)*(n).
    // 6. Calculate a1 = 2*f1 + f2 and a2 = 1*f2 + f1.
    // 7. Add acceleration values to each boid.

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
        explosionBoid.color = "red";
        
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

export default BoidWorld;
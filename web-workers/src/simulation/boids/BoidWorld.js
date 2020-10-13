import WorldState from "./WorldState.js";
import Boid from "./Boid.js";
import { getRandom2D } from "../../utils/vectors.js";



class BoidWorld {
  constructor(state) {
    this._state = new WorldState(state);
    
    this._bounds = {
      x: [-1, 1],
      y: [-1, 1]
    };

    this._boids = Array.from({ length: this._state.getState("numOfBoids") }, this._generateBoid);
  };

  // Creates a new boids with random coordinates within bounds.
  _generateBoid() {
    return new Boid(getRandom2D(this._bounds.x, this._bounds.y));
  }

  // Runs next step of the simulation.
  tick() {

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
    this.state.setState(option, value);
  }

  getState(option) {
    return this._state.getState(option);
  }

  get boids() {
    return this._boids;
  }

  get bounds() {
    return this._bounds;
  }

  // Calculate collision forces
  collision() {
    // 1. Calculate distance d between two boids
    // 2. Check d - radius of boid 1 - radius of boid 2 <= 0
    // 3. If false proceed to the next calculation
    // 4. If true calculate n = normalized(p2 - p1) where p1 is the position of the first boid and p2 the position of the second boid. The normal points at the second boid.
    // 5. Calculate f1 = dot(v1, -n)*(-n) and f2 = dot(v2, n)*(n).
    // 6. Calculate a1 = 1.75*f1 + f2 and a2 = 1.75*f2 + f1.
    // 7. Add acceleration values to each boid.

  }

  // Calculate explosion forces.
  explosion() {
    // Choose state.explosionsPerTick number of boids.
    // For each boid B:
    // 1. Check Math.random() < state.explosionProb
    // 2. If true proceed else continue to next boid
    // 3. Get all boids within state.explosionRadius distance from B and for each:
    // 4. Calculate normal vector n from B to other boid 
    // 5. Add state.explosionIntensity * dot(v2, n)*(n) to the other boid's acceleration. v2 is the other boid's velocity.
  }

};

export default BoidWorld;
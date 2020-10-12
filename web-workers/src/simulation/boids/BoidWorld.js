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

  }

  // Calculate explosion forces.
  explosion() {

  }

};

export default BoidWorld;
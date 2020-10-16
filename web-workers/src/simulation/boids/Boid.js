// TODO: Add checks for input values.
import { Vector2D } from "../../utils/vectors.js";

class Boid {
  constructor(options) {
    const defaultState = {
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
      acceleration: new Vector2D(0, 0),
      radius: 0.01,
      maxSpeed: 0.01
    };

    
    Object.keys(defaultState).forEach(key => this[key] = (typeof options === "object" && typeof options[key] === typeof defaultState[key] ) ? options[key] : defaultState[key]);
  }

  tick() {
    this.velocity = this.velocity.add(this.acceleration);

    if (this.velocity.length > this.maxSpeed)
      this.velocity = this.velocity.normalized().scale(this.maxSpeed);
      
    this.position = this.position.add(this.velocity);

    // By default don't accelerate.
    this.acceleration = new Vector2D(0,0);
  }

  get x() {
    return this.position.components.x;
  }

  get y() {
    return this.position.components.y;
  }

};

export default Boid;
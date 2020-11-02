// TODO: Add checks for input values.
import { Vector2D } from "../../utils/vectors.js";

class Boid {
  constructor(options) {
    const defaultState = {
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
      acceleration: new Vector2D(0, 0),
      radius: 0.01,
      maxSpeed: 0.01,
      collided: false,
      exploded: false
    };

    
    Object.keys(defaultState).forEach(key => this[key] = (typeof options === "object" && typeof options[key] === typeof defaultState[key] ) ? options[key] : defaultState[key]);
  }

  tick(bounds) {
    this.velocity = this.velocity.add(this.acceleration);

    if (this.velocity.length > this.maxSpeed)
      this.velocity = this.velocity.normalized().scale(this.maxSpeed);

    this.position = this.position.add(this.velocity);

    if (this.x < bounds.x[0])
      this.x = bounds.x[1];

    if (this.x > bounds.x[1])
      this.x = bounds.x[0];

    if (this.y < bounds.y[0])
      this.y = bounds.y[1];

    if (this.y > bounds.y[1])
      this.y = bounds.y[0];

    // By default don't accelerate.
    this.acceleration = new Vector2D(0,0);
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

};

export default Boid;
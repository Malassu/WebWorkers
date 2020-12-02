// TODO: Add checks for input values.
import { Vector2D } from "../../utils/vectors.js";

let idCounter = 0;

class Boid {
  constructor(options) {
    const defaultState = {
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
      acceleration: new Vector2D(0, 0),
      radius: 0.01,
      maxSpeed: 0.01,
      collided: false,
      exploded: false,
      id: idCounter++
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

    this.acceleration = this.velocity.scale(0.0);

    if (this._grid) {
      this._grid.removeElement(this);
      this._grid = this._grid.findFittingGrid(this).findFittingLeaf(this);
      this._grid.addElement(this);
    }
  }

  inBounds(bounds) {
    return this.x >= bounds.x[0] && this.x <= bounds.x[1] && this.y >= bounds.y[0] && this.y <= bounds.y[1];
  }

  mergeState(state) {
    this.position.x = state.position.x;
    this.position.y = state.position.y;

    this.velocity.x = state.velocity.x;
    this.velocity.y = state.velocity.y;

    this.acceleration.x = state.acceleration.x;
    this.acceleration.y = state.acceleration.y;
    // this.acceleration = this.acceleration.add(new Vector2D(state.acceleration.x, state.acceleration.y))

    // only overwrite if true
    this.collided = this.collided ? this.collided : state.collided;
    this.exploded = this.exploded ? this.exploded : state.exploded;
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

  get serializedBoid() {
    return {
      position: {
        x: this.position.x,
        y: this.position.y
      },
      velocity: {
        x: this.velocity.x,
        y: this.velocity.y
      },
      acceleration: {
        x: this.acceleration.x,
        y: this.acceleration.y
      },
      radius: this.radius,
      maxSpeed: this.maxSpeed,
      collided: this.collided,
      exploded: this.exploded,
      id: this.id
    }
  }

};

export default Boid;
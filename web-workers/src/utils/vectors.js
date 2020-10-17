export class Vector2D {
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

  dotProduct({ components }) {
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

export const getRandom1D = (min, max) => Math.random() * (max - min) + min;
export const getRandom2D = (firstInterval, secondInterval = firstInterval) => new Vector2D(getRandom1D(...firstInterval), getRandom1D(...secondInterval));



export class Vector2D extends Vector {
  constructor(x, y) {
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
      ...Object.keys(components).map((key) => value*this.components[key])
    );
  }

  divide(value) {
    return this.scale(1.0 / value);
  }

  length() {
    return Math.hypot(...this.components);
  }

  dotProduct({ components }) {
    return Object.keys(components).reduce((acc, key) => acc + components[key] * this.components[key], 0);
  }

  normalized() {
    return this.divide(this.length());
  }

};

export const getRandom1D = (min, max) => Math.random() * (max - min) + min;
export const getRandom2D = (firstInterval, secondInterval = firstInterval) => new Vector2D(getRandom1D(...firstInterval), getRandom1D(...secondInterval));



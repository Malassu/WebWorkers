// A boid consists of:
// float32 pX
// float32 pY
// float32 vX
// float32 vY
// float32 aX
// float32 aY
// float32 r
// float32 maxS
// uint32  id
// uint8   collided
// uint8   exploded
// => byte length of boid = 9 * 4 + 2 * 1 = 38
// This class contains typed arrays used for handling shared data
// stored in a SharedArrayBuffer.
class BinaryBoidParser {
  constructor (numOfBoids, sharedBuffer) {
    // Use input buffer or create a new one.
    this._buffer = sharedBuffer || new SharedArrayBuffer(38 * numOfBoids);

    this.getBoids = this.getBoids.bind(this);
    
    this.initArrays(numOfBoids);
  }

  initArrays(numOfBoids) {
    // Data is handled with typed arrays.
    // TODO: Remove repetition.
    this._pXArray    = new Float32Array(this._buffer, 0, numOfBoids);
    this._pYArray    = new Float32Array(this._buffer, 4*numOfBoids, numOfBoids);
    this._vXArray    = new Float32Array(this._buffer, 8*numOfBoids, numOfBoids);
    this._vYArray    = new Float32Array(this._buffer, 12*numOfBoids, numOfBoids);
    this._aXArray    = new Float32Array(this._buffer, 16*numOfBoids, numOfBoids);
    this._aYArray    = new Float32Array(this._buffer, 20*numOfBoids, numOfBoids);
    this._rArray     = new Float32Array(this._buffer, 24*numOfBoids, numOfBoids);
    this._maxSArray  = new Float32Array(this._buffer, 28*numOfBoids, numOfBoids);
    this._idArray    = new Uint32Array(this._buffer, 32*numOfBoids, numOfBoids);
    // collided and exploded are boolean values so they could be store more compactly.
    this._colArray   = new Uint8Array(this._buffer, 36*numOfBoids, numOfBoids);
    this._expArray   = new Uint8Array(this._buffer, 37*numOfBoids, numOfBoids);
  }


  get buffer () {
    return this._buffer;
  }

  set buffer(buffer) {
    this._buffer = buffer;
  }

  getBoids() {
    return Array.from({ length: this._pXArray.length }, (v, index) => ({
     position: {
       x: this._pXArray[index],
       y: this._pYArray[index],
     },
     velocity: {
      x: this._vXArray[index],
      y: this._vYArray[index],
      },
      acceleration: {
        x: this._aXArray[index],
        y: this._aYArray[index],
      },
      id: this._idArray[index],
      collided: Atomics.load(this._colArray, index) == 1,
      exploded: Atomics.load(this._expArray, index) == 1
    }));
    
  }

  update(boids) {
    boids.map((boid, index) => {
      this._pXArray[index] = boid.x;
      this._pYArray[index] = boid.y;
      this._vXArray[index] = boid.velocity.x;
      this._vYArray[index] = boid.velocity.y;
      this._aXArray[index] = boid.acceleration.x;
      this._aYArray[index] = boid.acceleration.y;
      this._rArray[index] = boid.radius;
      this._maxSArray[index] = boid.maxSpeed;
      this._idArray[index] = boid.id;
      this._colArray[index] = boid.collided;
      this._expArray[index] = boid.exploded;
    })
  }
};

export default BinaryBoidParser;
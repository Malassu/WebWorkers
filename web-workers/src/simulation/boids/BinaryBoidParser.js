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

    this.initArrays(buffer.byteLength / 38);
  }

  getArrays() {
    return { 
      pXArray: this._pXArray,
      pYArray: this._pYArray,
      vXArray: this._vXArray,
      vYArray: this._vYArray,
      aXArray: this._aXArray,
      aYArray: this._aYArray,
      rArray : this._rArray,
      maxSArray: this._maxSArray,
      idArray: this._idArray,
      // collided and exploded are boolean values so they could be store more compactly.
      colArray: this._colArray,
      expArray: this._expArray,
    };
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

  static bufferFromBoids(boids) {
    const buf = new SharedArrayBuffer(38 * boids.length);

    const pXArray    = new Float32Array(buf, 0, boids.length);
    const pYArray    = new Float32Array(buf, 4*boids.length, boids.length);
    const vXArray    = new Float32Array(buf, 8*boids.length, boids.length);
    const vYArray    = new Float32Array(buf, 12*boids.length, boids.length);
    const aXArray    = new Float32Array(buf, 16*boids.length, boids.length);
    const aYArray    = new Float32Array(buf, 20*boids.length, boids.length);
    const rArray     = new Float32Array(buf, 24*boids.length, boids.length);
    const maxSArray  = new Float32Array(buf, 28*boids.length, boids.length);
    const idArray    = new Uint32Array(buf, 32*boids.length, boids.length);
    // collided and exploded are boolean values so they could be store more compactly.
    const colArray   = new Uint8Array(buf, 36*boids.length, boids.length);
    const expArray   = new Uint8Array(buf, 37*boids.length, boids.length);

    boids.map((boid, index) => {
      pXArray[index] = boid.x;
      pYArray[index] = boid.y;
      vXArray[index] = boid.velocity.x;
      vYArray[index] = boid.velocity.y;
      aXArray[index] = boid.acceleration.x;
      aYArray[index] = boid.acceleration.y;
      rArray[index] = boid.radius;
      maxSArray[index] = boid.maxSpeed;
      idArray[index] = boid.id;
      colArray[index] = boid.collided;
      expArray[index] = boid.exploded;
    });

    return buf;
  }

  static arraysFromBoids(boids, numOfSlices = 1) {
    
    const createArrays = (boids) => ({
      pXArray: new Float32Array(boids.map(boid => boid.x)).buffer,
      pYArray: new Float32Array(boids.map(boid => boid.y)).buffer,
      vXArray: new Float32Array(boids.map(boid => boid.velocity.x)).buffer,
      vYArray: new Float32Array(boids.map(boid => boid.velocity.y)).buffer,
      aXArray: new Float32Array(boids.map(boid => boid.acceleration.x)).buffer,
      aYArray: new Float32Array(boids.map(boid => boid.acceleration.y)).buffer,
      rArray : new Float32Array(boids.map(boid => boid.radius)).buffer,
      maxSArray: new Float32Array(boids.map(boid => boid.maxSpeed)).buffer,
      idArray: new Uint32Array(boids.map(boid => boid.id)).buffer,
      // collided and exploded are boolean values so they could be store more compactly.
      colArray: new Uint8Array(boids.map(boid => boid.collided)).buffer,
      expArray: new Uint8Array(boids.map(boid => boid.exploded)).buffer,
    });


    const sliceLength = Math.round(boids.length / numOfSlices);

    const result = [];

    let slicesCreated = 1;
    let sliceStartIndex = 0;

    while (true) {
      // The last slice has sliceLength + 1 elements when length is odd.
      // Also handles cases where numOfSlices <= 0
      if (slicesCreated >= numOfSlices) {
        result.push(createArrays(boids.slice(sliceStartIndex, boids.length)));
        break;
      }
      else {
        result.push(createArrays(boids.slice(sliceStartIndex, sliceStartIndex + sliceLength)));
        sliceStartIndex += sliceLength;
        slicesCreated += 1;
      }
    }


    return result;

  };

  static arraysFromBuffers({ 
    pXArray, pYArray, vXArray, vYArray, aXArray, aYArray, 
    rArray, maxSArray, idArray, colArray, expArray
  }) {
    
    return {
      pXArray: new Float32Array(pXArray),
      pYArray: new Float32Array(pYArray),
      vXArray: new Float32Array(vXArray),
      vYArray: new Float32Array(vYArray),
      aXArray: new Float32Array(aXArray),
      aYArray: new Float32Array(aYArray),
      rArray : new Float32Array(rArray),
      maxSArray: new Float32Array(maxSArray),
      idArray: new Uint32Array(idArray),
      colArray: new Uint8Array(colArray),
      expArray: new Uint8Array(expArray),
    };

  };

  update(boids, start, end) {
    for (let index=start; index < end; index++) {
      const boid = boids[index];

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
    }
  }
};

export default BinaryBoidParser;
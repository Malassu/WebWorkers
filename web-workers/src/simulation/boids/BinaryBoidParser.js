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
  constructor (numOfBoids) {
    this.buffer     = new SharedArrayBuffer(38 * numOfBoids);
    this.pXArray    = new Float32Array(this.buffer, 0, numOfBoids);
    this.pYArray    = new Float32Array(this.buffer, 4, numOfBoids);
    this.vXArray    = new Float32Array(this.buffer, 8, numOfBoids);
    this.vYArray    = new Float32Array(this.buffer, 12, numOfBoids);
    this.aXArray    = new Float32Array(this.buffer, 16, numOfBoids);
    this.aYArray    = new Float32Array(this.buffer, 20, numOfBoids);
    this.rArray     = new Float32Array(this.buffer, 24, numOfBoids);
    this.maxSArray  = new Float32Array(this.buffer, 28, numOfBoids);
    this.maxSArray  = new Float32Array(this.buffer, 28, numOfBoids);
    this.idArray    = new Uint32Array(this.buffer, 32, numOfBoids);
    // collided and exploded are boolean values so they could be store more compactly.
    this.colArray   = new Uint8Array(this.buffer, 36, numOfBoids);
    this.expArray   = new Uint8Array(this.buffer, 37, numOfBoids);
  }
};

export default BinaryBoidParser;
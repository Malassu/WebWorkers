import BoidWorld from '../simulation/boids/BoidWorld.js';

/**
* Simple Worker has a local copy of the BoidWorld. On each tick the worker computes a partial
* simulation in the local BoidWorld and upon completion updates the local state to the main
* BoidWorld.
*/

self._localSimulation = null;

self.onmessage = function(e) {
  if (e.data.msg === 'init') {
    console.log(e.data.sharedBuffer.byteLength);
    const sharedIntArray = new Uint32Array(e.data.sharedBuffer, 0, 2);
    const sharedFloatArray = new Float32Array(e.data.sharedBuffer, 4, 2);

    console.log(`${ sharedIntArray[0] == 1 }: ${ sharedFloatArray[0] } and ${ sharedIntArray[1] == 1 }: ${ sharedFloatArray[1] }`);

    this._localSimulation = BoidWorld.cloneWorld(e.data.serialized);
  } else if (e.data.msg === 'tick') {
    // Overwrite boid state with the synchronized state from main thread
    self._localSimulation.boidsFromJson(e.data.boidsJson);
    // Compute a local tick
    self._localSimulation.tick();
    // Post updated local state to main thread
    const boids = this._localSimulation.boidsToJson;
    postMessage({msg: 'ticked', boids: boids});
  }
}
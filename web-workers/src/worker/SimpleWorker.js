import BoidWorld from '../simulation/boids/BoidWorld.js';

/**
* Simple Worker has a local copy of the BoidWorld. On each tick the worker computes a partial
* simulation in the local BoidWorld and upon completion updates the local state to the main
* BoidWorld.
*/

self._localSimulation = null;

self.onmessage = function(e) {
  if (e.data.msg === 'init') {
    this._localSimulation = BoidWorld.cloneWorld(e.data.serialized, e.data.sharedBuffer);

  } else if (e.data.msg === 'tick') {
    // Overwrite boid state with the synchronized state from main thread
    self._localSimulation.boidsFromBinary();
    // Compute a local tick
    self._localSimulation.tick();
    self._localSimulation.boidsToBinary();
    // Post updated local state to main thread
    postMessage({msg: 'ticked'});
  }
}
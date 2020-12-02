import BoidWorld from '../simulation/boids/BoidWorld.js';

/**
* Simple Worker has a local copy of the BoidWorld. On each tick the worker computes a partial
* simulation in the local BoidWorld and upon completion updates the local state to the main
* BoidWorld.
*/

self._localSimulation = null;

self.onmessage = function(e) {
  if (e.data.msg === 'init') {
    this._localSimulation = BoidWorld.cloneWorld(e.data.serialized);
  } else if (e.data.msg === 'tick') {
    const start = e.data.start;
    const end = e.data.end;
    // Overwrite boid state with the synchronized state from main thread
    self._localSimulation.boidsFromJson(e.data.boidsJson);
    // Compute a local tick
    const startTime = performance.now();
    self._localSimulation.tick(start, end);
    const timeStamp = performance.now() - startTime;
    // Post updated local state to main thread
    const boids = this._localSimulation.boidsToJson;
    postMessage({msg: 'ticked', start, end, boids: boids, timeStamp });
  }
}
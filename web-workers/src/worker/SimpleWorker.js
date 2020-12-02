import BoidWorld from '../simulation/boids/BoidWorld.js';

/**
* Simple Worker has a local copy of the BoidWorld. On each tick the worker computes a partial
* simulation in the local BoidWorld and upon completion updates the local state to the main
* BoidWorld.
*/

self._localSimulation = null;

self.onmessage = function(e) {
  if (e.data.msg === 'worker-init') {
    this._localSimulation = BoidWorld.cloneWorld(e.data.serialized);
  } else if (e.data.msg === 'worker-tick') {
    const start = e.data.start;
    const end = e.data.end;
    // Overwrite boid state with the synchronized state from main thread
    self._localSimulation.boidsFromJson(e.data.boidsJson);
    // Compute a local tick
    self._localSimulation.tick(start, end);
    // Post updated local state to main thread
    const boids = this._localSimulation.boidsToJson;
    postMessage({msg: 'planner-merge', start, end, boids: boids});
  } else if (e.data.msg === 'worker-merge') {
    this._localSimulation.mergeBoids(e.data.boids);
  }
}
import BoidWorld from '../simulation/boids/BoidWorld.js';

/**
* Simple Worker has a local copy of the BoidWorld. On each tick the worker computes a partial
* simulation in the local BoidWorld and upon completion updates the local state to the main
* BoidWorld.
*/

self._localSimulation = null;

self.onmessage = function(e) {
  if (e.data.msg === 'worker-init') {
    self._localSimulation = BoidWorld.cloneWorld(e.data.serialized);
    // Overwrite boid state with the synchronized state from main thread
    self._localSimulation.boidsFromJson(e.data.boids);
    console.log(self._localSimulation);
  } else if (e.data.msg === 'worker-tick') {
    const start = e.data.start;
    const end = e.data.end;
    // Compute a local tick
    const startTime = performance.now();
    self._localSimulation.tick(start, end);
    const timeStamp = performance.now() - startTime;
    // Post updated local state to main thread
    const mutatedBoids = self._localSimulation.boidsToJson(start, end);
    // self._localSimulation.move();
    postMessage({msg: 'planner-merge', boids: mutatedBoids, timeStamp});
  } else if (e.data.msg === 'worker-merge') {
    self._localSimulation.mergeBoids(e.data.boids);
  } else if (e.data.msg === 'worker-move') {
    self._localSimulation.move();
  }
}
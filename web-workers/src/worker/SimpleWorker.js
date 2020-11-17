import BoidWorld from '../simulation/boids/BoidWorld.js';

/**
* Simple Worker has a local copy of the BoidWorld. On each tick the worker computes a partial
* simulation in the local BoidWorld and upon completion updates the local state to the main
* BoidWorld.
*/

class SimpleWorker {
  constructor() {
    this._localSimulation = null;
  }
  
  init(data) {
    this._localSimulation = BoidWorld.cloneWorld(data);
  }
  
  localTick(boidData) {
    // Overwrite boid state with the synchronized state from main thread
    this._localSimulation.boidsFromJson(boidData);
    // Compute a local tick
    this._localSimulation.tick();
    // Post updated local state to main thread
    const boids = this._localSimulation.boidsToJson;
    postMessage({msg: 'ticked', boids: boids})
  }
}

const worker = new SimpleWorker();

onmessage = function(e) {
  if (e.data.msg === 'start') {
    worker.init(e.data.data);
  } else if (e.data.msg === 'tick') {
    worker.localTick(e.data.boidData);
  }
}
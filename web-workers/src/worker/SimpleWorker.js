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
  
  init() {
    // TODO: set initial local copy of BoidWorld
  }
  
  localTick() {
    // TODO: compute a local tick and send completion message to planner
  }
  
  updateSimulation() {
    // TODO: update the local copy state to the main simulation
  }
}

const worker = new SimpleWorker();

onmessage = function(ev) {
  if (ev.data.msg === 'start') {
    worker.init();
  } else if (ev.data.msg === 'tick') {
    worker.localTick();
  } else if (ev.data.msg === 'update') {
    worker.updateSimulation();
  }
}
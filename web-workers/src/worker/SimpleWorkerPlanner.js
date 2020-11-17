
class SimpleWorkerPlanner {
  constructor(simulation, workerCount = 1) {
    this._simulation = simulation;
    this.workerCount = workerCount;
    this.workers = [];
    this.idleWorkerCount = workerCount;
    
    for (let i; i < this.workerCount; i++) {
      this.workers.push(new Worker('worker/SimpleWorker.js', {type: 'module'}));
    }
  }
  
  // initialize workers
  init() {
    // Pass initial state to workers
    const serialized = this._simulation.serializedWorldState();
    for (worker of this.workers) {
      worker.postMessage({msg: 'init', data: serialized});
      // add onmessage handlers to catch messages that are passed back from the workers
      worker.onmessage = this.handleMessageFromWorker.bind(this);
    }
  }
  
  
  // TODO: simple parallel execution
  parallelTick() {
    const boidsJson = this._simulation.boidsToJson;
    for (worker of this.workers) {
      worker.postMessage({msg: 'tick', boids: boidsJson});
    }
  }

  handleMessageFromWorker(e) {
    if(msg.data.msg == 'ticked') {
      boids = JSON.parse(msg.data.boids);
      // TODO: when all workers have completed local ticks
      // merge local state to the main state this._simulation
      // then ready to execute new tick
    }
  }
}
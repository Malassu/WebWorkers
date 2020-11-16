
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
    // TODO: set initial BoidWorld copy to each worker
    // TODO: add onmessage handlers to catch messages that are passed back from the workers
  }
  
  
  // TODO: simple parallel execution
  parallelTick() {
    // TODO: check that all jobs have been completed
  }

  handleMessageFromWorker(e) {
    if(msg.data.msg == 'ticked') {
      boids = JSON.parse(msg.data.boids);
      // TODO: synchronize state with other workers
      // then start new tick if all workers have ticked (idleWorkerCount === workerCount)
    }
  }
}
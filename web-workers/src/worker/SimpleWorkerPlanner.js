
import Worker from "worker-loader!./SimpleWorker.js";

class SimpleWorkerPlanner {
  constructor(simulation, workerCount = 1, nextTickCallback) {
    this.simulation = simulation;
    this.workerCount = workerCount;
    this.workers = [];
    this.tickedWorkerCount = 0;
    
    // callback to request next tick from the application
    this.nextTickCallback = nextTickCallback;
    
    for (let i=0; i < this.workerCount; i++) {
      // module workers, see https://web.dev/module-workers/
      this.workers.push(new Worker({ type:"module" }));
    }

    // add onmessage handlers to catch messages that are passed back from the workers
    this.workers.forEach((worker) => {
      worker.addEventListener('message', this.handleMessageFromWorker.bind(this));
    })
  }
  
  // initialize workers
  init() {
    // Pass initial state to workers
    const serialized = this.simulation.serializedWorldState();
    this.workers.forEach((worker) => {
    
    const message = {
      msg: 'init',
      serialized 
    };

    if (crossOriginIsolated) {
      console.log("Shared data is supported.");
      message.sharedBuffer = this.simulation.getBinaryBuffer();
    }
    else {
      console.log("Shared data is not supported.");
    }

      worker.postMessage(message);
    })
  } 
  
  parallelTick() {
    //const boidsJson = this.simulation.boidsToJson;
    this.workers.forEach((worker) => {
      worker.postMessage({msg: 'tick'});
    })
  }

  handleMessageFromWorker(e) {
    if (e.data.msg == 'ticked') {
      this.tickedWorkerCount++;
      this.simulation.boidsFromBinary();
      // merge worker states to main simulation when all workers have ticked
      if (this.tickedWorkerCount === this.workerCount) {
        // reset ticked count and request next tick
        this.nextTickCallback();
        this.tickedWorkerCount = 0;
      }
    }
  }
};

export default SimpleWorkerPlanner;
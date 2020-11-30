
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

      // Creating a shared buffer
      const length = 4;
      // Get the size we want in bytes for the buffer
      const size = Int32Array.BYTES_PER_ELEMENT * length;
      // Create a buffer for 10 integers
      const sharedBuffer = new SharedArrayBuffer(size);
      const sharedIntArray = new Uint32Array(sharedBuffer, 0, 2);
      const sharedFloatArray = new Float32Array(sharedBuffer, 4, 2);

      sharedIntArray[0] = true;
      sharedIntArray[1] = 0;

      sharedFloatArray[0] = 0.1;
      sharedFloatArray[1] = 0.2;

      message.sharedBuffer = sharedBuffer;
    }
    else {
      console.log("Shared data is not supported.");
    }

      worker.postMessage(message);
    })
  } 
  
  parallelTick() {
    const boidsJson = this.simulation.boidsToJson;
    //console.log(boidsJson);
    this.workers.forEach((worker) => {
      worker.postMessage({msg: 'tick', boidsJson});
    })
  }

  handleMessageFromWorker(e) {
    if (e.data.msg == 'ticked') {
      this.tickedWorkerCount++;
      this.simulation.mergeBoids(e.data.boids);
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
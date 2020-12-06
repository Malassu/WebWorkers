
import Worker from "worker-loader!./SimpleWorker.js";

class SimpleWorkerPlanner {
  constructor(simulation, workerCount = 1, nextTickCallback) {
    this.simulation = simulation;
    this.workerCount = workerCount;
    this.workers = [];
    this.tickedWorkerCount = 0;
    this.transferableArrays = this.simulation.transferableBoidArrays;

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
      message.sharedBuffer = this.simulation.binaryBuffer;
    }
    else {
      console.log("Shared data is not supported.");
    }

      worker.postMessage(message);
    })
  }
  
  updateTransferables({ msg, index, ...rest }) {
    this.transferableArrays[index] = rest;
  }
  
  parallelTickSharedBinary() {
    this.workers.forEach((worker) => {
      worker.postMessage({ msg: 'tick-shared-binary' });
    })
  }

  parallelTickTransferableBinary() {
    this.workers.forEach((worker, index) => {
      worker.postMessage({ msg: 'tick-transferable-binary', index, ...this.transferableArrays[index]}, Object.values(this.transferableArrays[index]));
    })
  }

  parallelTickJson() {
    const boidsJson = this.simulation.serializedBoids;
    
    this.workers.forEach((worker) => {
      worker.postMessage({msg: 'tick-json', boidsJson});
    });
  }

  updateBuffers() {
    const buf = this.simulation.boidsToBuffer();

    this.simulation.queueBuffer(buf);

    this.workers.forEach((worker) => {
      worker.postMessage({msg: 'update-buffer', buf});
    });
  }

  updateBoids() {
    if (this.simulation.updateBuffer())
      this.transferableArrays = this.simulation.transferableBoidArrays;
  }

  handleMessageFromWorker(e) {
    switch (e.data.msg) {
      case 'ticked-json':
        this.tickedWorkerCount++;
        this.simulation.mergeBoids(e.data.boids);
        // merge worker states to main simulation when all workers have ticked
        if (this.tickedWorkerCount === this.workerCount) {
          // reset ticked count and request next tick
          this.nextTickCallback();
          this.tickedWorkerCount = 0;
        }
        return;

      case 'ticked-shared-binary':
        this.tickedWorkerCount++;
        this.simulation.boidsFromBinary();
        // merge worker states to main simulation when all workers have ticked
        if (this.tickedWorkerCount === this.workerCount) {
          // reset ticked count and request next tick
          this.nextTickCallback();
          this.tickedWorkerCount = 0;
        }
        return;

        case 'ticked-transferable-binary':
          this.tickedWorkerCount++;
          this.simulation.mergeTransferables(e.data);
          this.updateTransferables(e.data);
          // merge worker states to main simulation when all workers have ticked
          if (this.tickedWorkerCount === this.workerCount) {
            // reset ticked count and request next tick
            this.nextTickCallback();
            this.tickedWorkerCount = 0;
          }
          return;

        default:
          return;
    }
  }
};

export default SimpleWorkerPlanner;
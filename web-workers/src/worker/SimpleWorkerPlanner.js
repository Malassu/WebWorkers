
import Worker from "worker-loader!./SimpleWorker.js";
import BoidWorld from '../simulation/boids/BoidWorld.js';

class SimpleWorkerPlanner {
  constructor() {
    this.simulation = null;
    this.workerCount = null;
    this.workers = [];
    this.tickedWorkerCount = 0;
    
    // callback to request next tick from the application
    // this.nextTickCallback = nextTickCallback;
  }
  
  // Create BoidWorld within planner context and initialize workers
  create(workerCount, config) {
    this.simulation = new BoidWorld(config);

    this.timeStamp = null;

    this.workerCount = workerCount;

    // Create sub workers
    for (let i=0; i < this.workerCount; i++) {
      // module workers, see https://web.dev/module-workers/
      this.workers.push(new Worker({ type:"module" }));
    }

    // add onmessage handlers to catch messages that are passed back from the workers
    this.workers.forEach((worker, index) => {
      worker.addEventListener('message', this.handleMessageFromWorker.bind(this));
    })

    // Pass initial state to workers
    const serialized = this.simulation.serializedWorldState();
    this.workers.forEach((worker) => {
      worker.postMessage({msg: 'worker-init', serialized});
    })
  }

  parallelTick() {
    this.timeStamp = [];

    const boidsJson = this.simulation.boidsToJson;
    //console.log(boidsJson);

    // Split the workload among workers
    const numOfBoids = this.simulation.getState("numOfBoids");
    const chunkSize = Math.round(numOfBoids/this.workerCount);
    this.workers.forEach((worker, i) => {
      const start = i*chunkSize;
      const end = (i === this.workerCount-1) ? numOfBoids : start + chunkSize;
      worker.postMessage({msg: 'worker-tick', start, end, boidsJson});
    })
  }

  handleMessageFromWorker(e) {
    if (e.data.msg == 'planner-merge') {
      this.tickedWorkerCount++;
      console.log(e.data.timeStamp, "ms");
      this.simulation.mergeBoids(e.data.boids);
      // Merge sub workers
      // this.workers.forEach((worker, workerIndex) => {
      //   if (index != workerIndex) {
      //     worker.postMessage({msg: 'worker-merge', boids: e.data.boids});
      //   }
      // })
      // merge worker states to main simulation when all workers have ticked
      if (this.tickedWorkerCount === this.workerCount) {
        // reset ticked count and request next tick
        this.simulation.move();
        this.tickedWorkerCount = 0;
        postMessage({msg: 'main-render', boids: this.simulation.boidsToJson});
        this.parallelTick();
      }
    }
  }

  onMainThreadMessage(e) {
    if (e.data.msg == 'planner-create') {
      this.create(e.data.workerCount, e.data.config);
    } else if (e.data.msg == 'planner-start') {
      this.parallelTick();
    }
  }
};

const worker = new SimpleWorkerPlanner();
onmessage = worker.onMainThreadMessage.bind(worker)

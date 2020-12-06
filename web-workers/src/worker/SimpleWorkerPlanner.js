
import Worker from "worker-loader!./SimpleWorker.js";
import BoidWorld from '../simulation/boids/BoidWorld.js';

class SimpleWorkerPlanner {
  constructor() {
    this.simulation = null;
    this.workerCount = null;
    this.readyForNextTick = null;
    this.workers = [];
    this.tickedWorkerCount = 0;
    this.movedWorkerCount = 0;

    this.forces = [];
    
    // callback to request next tick from the application
    // this.nextTickCallback = nextTickCallback;
  }
  
  // Create BoidWorld within planner context and initialize workers
  create(workerCount, config) {
    this.simulation = new BoidWorld(config);

    this.tickStart = null;
    this.workerTimeStamps = [];

    this.workerCount = workerCount;
    this.readyForNextTick = true;

    // Create sub workers
    for (let i=0; i < this.workerCount; i++) {
      // module workers, see https://web.dev/module-workers/
      this.workers.push(new Worker({ type:"module" }));
    }

    // add onmessage handlers to catch messages that are passed back from the workers
    this.workers.forEach((worker, index) => {
      worker.addEventListener('message', this.handleMessageFromWorker.bind(this, index));
    })

    // Pass initial state to workers
    const serialized = this.simulation.serializedWorldState();
    const boidsJson = this.simulation.boidsToJson();

    console.log(this.simulation);

    this.workers.forEach((worker) => {
      worker.postMessage({msg: 'worker-init', serialized, boids: boidsJson});
    });
  }

  // Update boid data for rendering
  loop() {
    this.timer = setInterval(() => {
      if (this.readyForNextTick) {
        postMessage({
          msg: 'main-render',
          boids: this.simulation.boidsToJson(),
          timeStamps: {
            parallelTick: performance.now() - this.tickStart,
            workers: this.workerTimeStamps
          }
        });
        
        this.parallelTick();
        this.readyForNextTick = false;
      }
    }, 33);
  }

  parallelTick() {
    this.tickStart = performance.now();
    this.workerTimeStamps = [];

    // TODO: precompute explosions
    // Split the workload among workers
    const numOfBoids = this.simulation.getState("numOfBoids");
    const chunkSize = Math.round(numOfBoids/this.workerCount);
    this.workers.forEach((worker, i) => {
      const start = i*chunkSize;
      const end = (i === this.workerCount-1) ? numOfBoids : start + chunkSize;
      worker.postMessage({msg: 'worker-tick', start, end});
    });
  }

  handleMessageFromWorker(index, e) {
    // 1. Catch the resulting forces of worker ticks.
    //    This data includes only the boids that were mutated during worker tick,
    //    i.e. the workload.
    if (e.data.msg === 'planner-merge') {
      this.tickedWorkerCount++;
      this.workerTimeStamps = this.workerTimeStamps.concat((({ tickTime, allTime }) => ({ tickTime, allTime }))(e.data));

      // Keep track of computed forces in the main simulation
      this.simulation.updateForces(e.data.boids);

      // 2. When all workers have ticked,
      //    send merged forces to each worker for computing new postions.
      if (this.tickedWorkerCount === this.workerCount) {
        this.tickedWorkerCount = 0;
        const boidsJson = this.simulation.boidsToJson();
        this.workers.forEach(worker => {
          worker.postMessage({msg: 'worker-move', boids: boidsJson})
        });
        // Reset forces in the main simulation
        this.simulation.resetForces();
        // this.simulation.move();
      }
    }

    // 3. Catch updated subworker simulations
    if (e.data.msg === 'planner-move') {
      this.movedWorkerCount++;

      // Apply new positions from the last returning worker to the main simulation
      if (this.movedWorkerCount === this.workerCount) {
        this.movedWorkerCount = 0;
        // const boids = e.data.boids;
        this.simulation.applyPositions(e.data.boids);
        this.readyForNextTick = true;
      }
    }
  }

  onMainThreadMessage(e) {
    if (e.data.msg == 'planner-create') {
      this.create(e.data.workerCount, e.data.config);
    } else if (e.data.msg == 'planner-start') {
      this.loop();
    }
  }
};

const worker = new SimpleWorkerPlanner();
onmessage = worker.onMainThreadMessage.bind(worker)

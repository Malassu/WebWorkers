
import Worker from "worker-loader!./SimpleWorker.js";
import BoidWorld from '../simulation/boids/BoidWorld.js';
import { userInfo } from "os";

class SimpleWorkerPlanner {
  constructor() {
    this.simulation = null;
    this.workerCount = null;
    this.readyForNextTick = null;
    this.workers = [];
    this.tickedWorkerCount = 0;

    this.movedWorkerCount = 0;

    this.forces = [];

    this.nextInterfaceType = null;
    
    // callback to request next tick from the application
    // this.nextTickCallback = nextTickCallback;
  }
  
  // Create BoidWorld within planner context and initialize workers
  create(workerCount, config, interfaceType) {
    this.simulation = new BoidWorld(config);

    this.transferableArrays = this.simulation.getTransferableBoidArrays(workerCount);


    this.tickStart = null;
    this.workerTimeStamps = [];

    this.interfaceTypes = {
      'json': this.parallelTickJson,
      'structured-cloning': this.parallelTickClone,
      'shared-binary': this.parallelTickSharedBinary,
      'transferable-binary': this.parallelTickTransferableBinary
    };

    this.parallelTick = this.interfaceTypes[interfaceType];
    
    this.workerCount = workerCount;
    this.readyForNextTick = true;



    postMessage({
      msg: 'shared-buffer',
      sharedBuffer: this.simulation.binaryBuffer
    });

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
    
    const message = {
      msg: 'worker-init',
      serialized
    };

    if (crossOriginIsolated) {
      console.log("Shared data is supported.");
      message.sharedBuffer = this.simulation.binaryBuffer;
    }
    else {
      console.log("Shared data is not supported.");
      message.boids = this.simulation.boidsToJson();
    }

    this.workers.forEach((worker) => {
      worker.postMessage(message);
    });

  }

  changeDataInterface(type) {
    this.nextInterfaceType = type;
  }

  addBoids(amount) {
    for (let i = 0; i < amount; i++) {
      this.simulation.addBoid();
    }

    this.updateBuffers();
  }

  // Take out values that are not transferable
  updateTransferables({ msg, index, explodionIndices, tickTime, allTime, start, end, pass, ...rest }) {
    this.transferableArrays[index] = rest;
  }

  parallelTickSharedBinary() {
    const explodionIndices = this.simulation.generateExplosions();
    // Split the workload among workers
    const numOfBoids = this.simulation.getState("numOfBoids");
    const chunkSize = Math.round(numOfBoids/this.workerCount);
    this.workers.forEach((worker, i) => {
      const start = i*chunkSize;
      const end = (i === this.workerCount-1) ? numOfBoids : start + chunkSize;
      worker.postMessage({msg: 'worker-tick-shared-binary', start, end, explodionIndices});
    });
  }

  parallelTickTransferableBinary() {
    const explodionIndices = this.simulation.generateExplosions();
    const numOfBoids = this.simulation.getState("numOfBoids");
    const chunkSize = Math.round(numOfBoids/this.workerCount);

    this.workers.forEach((worker, index) => {
      const start = index*chunkSize;
      const end = (index === this.workerCount-1) ? numOfBoids : start + chunkSize;
      
      worker.postMessage({ msg: 'tick-transferable-binary', explodionIndices, start, index, end, ...this.transferableArrays[index]}, Object.values(this.transferableArrays[index]));
    })
  }

  parallelTickJson() {
    // Precompute exploding boids by setting explosion flags
    const explodionIndices = this.simulation.generateExplosions();
    // Split the workload among workers
    const numOfBoids = this.simulation.getState("numOfBoids");
    const chunkSize = Math.round(numOfBoids/this.workerCount);
    this.workers.forEach((worker, i) => {
      const start = i*chunkSize;
      const end = (i === this.workerCount-1) ? numOfBoids : start + chunkSize;
  
      worker.postMessage({msg: 'worker-tick-json', start, end, explodionIndices});
    });
  }

  parallelTickClone() {
    // Precompute exploding boids by setting explosion flags
    const explodionIndices = this.simulation.generateExplosions();
    // Split the workload among workers
    const numOfBoids = this.simulation.getState("numOfBoids");
    const chunkSize = Math.round(numOfBoids/this.workerCount);
    this.workers.forEach((worker, i) => {
      const start = i*chunkSize;
      const end = (i === this.workerCount-1) ? numOfBoids : start + chunkSize;
  
      worker.postMessage({msg: 'worker-tick-clone', start, end, explodionIndices});
    });
  }

  updateBuffers() {
    const buf = this.simulation.boidsToBuffer();

    this.simulation.queueBuffer(buf);
  }

  updateBoids() {
    if (this.simulation.updateBuffer()) {
      this.workers.forEach((worker) => {
        worker.postMessage({msg: 'update-buffer', buf: this.simulation.binaryBuffer});
      });

      this.transferableArrays = this.simulation.getTransferableBoidArrays(this.workerCount);
      this.simulation.boidsFromBinary();

      return true;
    }

    return false;
    
  }

  // Update boid data for rendering
  loop() {
    this.timer = setInterval(() => {
      if (this.readyForNextTick) {
        this.readyForNextTick = false;

        if (this.updateBoids()) {
        }
        else {
          postMessage({
            msg: 'main-render',
            boids: this.simulation.boidsToJson(),
            timeStamps: {
              parallelTick: this.tickStart,
              workers: this.workerTimeStamps
            }
          });

          if (this.nextInterfaceType) {
            this.simulation.boidsFromBinary();
            this.parallelTick = this.interfaceTypes[this.nextInterfaceType];
            this.nextInterfaceType = null;
          }

          
          this.tickStart = performance.now();
          this.workerTimeStamps = [];
          
          this.parallelTick();
        }
      }
    }, 16);
  }

  handleMessageFromWorker(index, e) {
    // 1. Catch the resulting forces of worker ticks.
    //    This data includes only the boids that were mutated during worker tick,
    //    i.e. the workload.

    switch (e.data.msg) {
      case 'planner-json-merge':
        this.tickedWorkerCount++;
        this.workerTimeStamps = this.workerTimeStamps.concat((({ tickTime, allTime }) => ({ tickTime, allTime }))(e.data));

        this.simulation.mergeBoidsJson(e.data.boids);
  
        // 2. When all workers have ticked,
        //    send merged forces to each worker for computing new postions.
        if (this.tickedWorkerCount === this.workerCount) {
          this.tickedWorkerCount = 0;
          const boidsJson = this.simulation.boidsToJson();
          this.workers.forEach(worker => {
            worker.postMessage({msg: 'worker-json-merge', boids: boidsJson})
          });
        }
        return;

      // 3. Catch updated subworker simulations
      case 'planner-json-merged':
        this.movedWorkerCount++;
        if (this.movedWorkerCount === this.workerCount) {
          this.tickStart = performance.now() - this.tickStart;
          this.movedWorkerCount = 0;          
          this.readyForNextTick = true;
        }
        return;

      case 'ticked-shared-binary':
        this.tickedWorkerCount++;
        this.workerTimeStamps = this.workerTimeStamps.concat((({ tickTime, allTime }) => ({ tickTime, allTime }))(e.data));

        // merge worker states to main simulation when all workers have ticked
        if (this.tickedWorkerCount === this.workerCount) {
          // reset ticked count and request next tick
          this.tickedWorkerCount = 0;
          const numOfBoids = this.simulation.getState("numOfBoids");
          const chunkSize = Math.round(numOfBoids/this.workerCount);
          this.workers.forEach((worker, i) => {
            const start = i*chunkSize;
            const end = (i === this.workerCount-1) ? numOfBoids : start + chunkSize;
            worker.postMessage({ msg: 'worker-shared-binary-merge', start, end });
          });
        }
        return;

        case 'planner-clone-merge':
          this.tickedWorkerCount++;
          this.workerTimeStamps = this.workerTimeStamps.concat((({ tickTime, allTime }) => ({ tickTime, allTime }))(e.data));
  
          this.simulation.mergeBoids(e.data.boids);
    
          // 2. When all workers have ticked,
          //    send merged forces to each worker for computing new postions.
          if (this.tickedWorkerCount === this.workerCount) {
            this.tickedWorkerCount = 0;
            const boidsCloned = this.simulation.serializedBoids();
            this.workers.forEach(worker => {
              worker.postMessage({msg: 'worker-clone-merge', boids: boidsCloned})
            });
          }
          return;
  
        // 3. Catch updated subworker simulations
        case 'planner-clone-merged':
          this.movedWorkerCount++;
          if (this.movedWorkerCount === this.workerCount) {
            this.tickStart = performance.now() - this.tickStart;
            this.movedWorkerCount = 0;          
            this.readyForNextTick = true;
          }
          return;
  
        case 'ticked-shared-binary':
          this.tickedWorkerCount++;
          this.workerTimeStamps = this.workerTimeStamps.concat((({ tickTime, allTime }) => ({ tickTime, allTime }))(e.data));
  
          // merge worker states to main simulation when all workers have ticked
          if (this.tickedWorkerCount === this.workerCount) {
            // reset ticked count and request next tick
            this.tickedWorkerCount = 0;
            const numOfBoids = this.simulation.getState("numOfBoids");
            const chunkSize = Math.round(numOfBoids/this.workerCount);
            this.workers.forEach((worker, i) => {
              const start = i*chunkSize;
              const end = (i === this.workerCount-1) ? numOfBoids : start + chunkSize;
              worker.postMessage({ msg: 'worker-shared-binary-merge', start, end });
            });
          }
          return;

      case 'planner-shared-binary-merged':
        this.tickedWorkerCount++;
        // merge worker states to main simulation when all workers have ticked
        if (this.tickedWorkerCount === this.workerCount) {
          this.simulation.boidsFromBinary();
          // reset ticked count and request next tick
          this.tickStart = performance.now() - this.tickStart;
          this.tickedWorkerCount = 0;
          this.readyForNextTick = true;
        }
        return;        
      
      case 'ticked-transferable-binary':
        this.tickedWorkerCount++;
        this.simulation.mergeTransferables(e.data);
        this.workerTimeStamps = this.workerTimeStamps.concat((({ tickTime, allTime }) => ({ tickTime, allTime }))(e.data));
  
        this.updateTransferables(e.data);

        // merge worker states to main simulation when all workers have ticked
        if (this.tickedWorkerCount === this.workerCount) {
          // reset ticked count and request next tick
          this.tickedWorkerCount = 0;

          this.workers.forEach((worker, i) => {
            // Pass each worker the transferables associated with the next worker.
            const index = (i + 1) % this.workerCount;
            //NOTE: keep track of the tranferable's index so that the next transferable can be sent.
            worker.postMessage({ msg: 'worker-merge-transferable-binary', pass: 1, index, ...this.transferableArrays[index]}, Object.values(this.transferableArrays[index]));
          });
        }
        return;

        case 'planner-merged-transferable-binary':
          this.tickedWorkerCount++;
          this.updateTransferables(e.data);                

          // merge worker states to main simulation when all workers have ticked
          if (this.tickedWorkerCount % this.workerCount === 0) {
            if (e.data.pass + 1 >= this.workerCount) {
              this.tickStart = performance.now() - this.tickStart;
              this.tickedWorkerCount = 0;
              this.readyForNextTick = true;
            } 
            else {
              this.workers.forEach((worker, i) => {
                const pass = e.data.pass + 1;
                const index = (i + pass ) % this.workerCount;
                
                worker.postMessage({ msg: 'worker-merge-transferable-binary', pass, index, ...this.transferableArrays[index]}, Object.values(this.transferableArrays[index]));
              });
            }
          }
          return;

          case 'updated-buffer':
            this.tickedWorkerCount++;
          
            // merge worker states to main simulation when all workers have ticked
            if (this.tickedWorkerCount === this.workerCount) {
              this.tickedWorkerCount = 0;
              this.readyForNextTick = true;
            }
            return;

      default:
        return;
    }
  }

  onMainThreadMessage(e) {
    if (e.data.msg == 'planner-create') {
      this.create(e.data.workerCount, e.data.config, e.data.interfaceType);
    } else if (e.data.msg == 'planner-start') {
      this.loop();
    }
    else if (e.data.msg === 'change-data-interface') {
      this.changeDataInterface(e.data.type);
    }
    else if (e.data.msg === 'add-boids') {
      this.addBoids(e.data.amount);
    }
  }
};

const worker = new SimpleWorkerPlanner();
onmessage = worker.onMainThreadMessage.bind(worker)

import BoidWorld from '../simulation/boids/BoidWorld.js';

/**
* Simple Worker has a local copy of the BoidWorld. On each tick the worker computes a partial
* simulation in the local BoidWorld and upon completion updates the local state to the main
* BoidWorld.
*/

self._localSimulation = null;

self.onmessage = function(e) {
  switch (e.data.msg) {
    case 'worker-init':
      this._localSimulation = BoidWorld.cloneWorld(e.data.serialized, e.data.sharedBuffer);

      return;

    case 'worker-tick-json':
      self._localSimulation.updateBuffer();  
      const startTimeAll = performance.now();
      const start = e.data.start;
      const end = e.data.end;

      // Compute a local tick
      const startTimeTick = performance.now();
      self._localSimulation.tick(start, end, e.data.explodionIndices);
      const tickTime = performance.now() - startTimeTick;

      // Post updated local state to main thread
      const boids = self._localSimulation.boidsToJson(start, end);
      postMessage({msg: 'planner-json-merge', start, end, boids, tickTime, allTime: performance.now() - startTimeAll });
      return;

    case 'worker-json-merge':
      self._localSimulation.mergeBoidsJson(e.data.boids);
      postMessage({ msg: 'planner-json-merged' });
      return;

    case 'worker-tick-clone':
      self._localSimulation.updateBuffer();  
      const startTimeAllClone = performance.now();

      // Compute a local tick
      const startTimeTickClone = performance.now();
      self._localSimulation.tick(e.data.start, e.data.end, e.data.explodionIndices);
      const tickTimeClone = performance.now() - startTimeTickClone;

      // Post updated local state to main thread
      postMessage({msg: 'planner-clone-merge', start: e.data.start, end: e.data.end, boids: self._localSimulation.serializedBoids(start, end), tickTime: tickTimeClone, allTime: performance.now() - startTimeAllClone });
      return;

    case 'worker-clone-merge':
      self._localSimulation.mergeBoids(e.data.boids);
      postMessage({ msg: 'planner-clone-merged' });
      return;

    case 'worker-tick-shared-binary':
      const startTimeAllShared = performance.now();
      // If boids are added dynamically, the binary buffer needs to be updated.
      self._localSimulation.updateBuffer();

      // Overwrite boid state with the synchronized state from main thread
      
      self._localSimulation.boidsFromBinary();
      
      // Compute a local tick
      const startTimeTickShared = performance.now();
      self._localSimulation.tick(e.data.start, e.data.end, e.data.explodionIndices);
      const tickTimeShared = performance.now() - startTimeTickShared;

      // Post updated local state to main thread
      postMessage({msg: 'ticked-shared-binary', tickTime: tickTimeShared, allTime: performance.now() - startTimeAllShared});
      return;

    case 'worker-shared-binary-merge':
      self._localSimulation.boidsToBinary(e.data.start, e.data.end);

      postMessage({ msg: 'planner-shared-binary-merged' });
      return;

    case 'tick-transferable-binary':
      const startTimeAllTransferable = performance.now();
      // Compute a local tick
      const startTimeTickTransferable = performance.now();
      self._localSimulation.tick(e.data.start, e.data.end, e.data.explodionIndices);
      const tickTimeTransferable = performance.now() - startTimeTickTransferable;

      // Post updated local state to main thread
      // NOTE: the function writeBoidsToTransferable returns the required transferable list https://developers.google.com/web/updates/2011/12/Transferable-Objects-Lightning-Fast
      
      postMessage({ ...e.data, tickTime: tickTimeTransferable, allTime: performance.now() - startTimeAllTransferable, msg: "ticked-transferable-binary" }, self._localSimulation.writeBoidsToTransferable(e.data));        
      // If boids are added dynamically, the binary buffer needs to be updated.
      // NOTE: Update done using shared buffer for convinience.
      self._localSimulation.updateBuffer();  
      return;

      case 'worker-merge-transferable-binary':  
        postMessage({ ...e.data, msg: 'planner-merged-transferable-binary' }, self._localSimulation.mergeTransferables(e.data));
        return;

      case 'update-buffer':
        self._localSimulation.queueBuffer(e.data.buf);
        return;
    default:
      return;

  } 
}

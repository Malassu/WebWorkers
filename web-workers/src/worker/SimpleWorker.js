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

      if (!e.data.sharedBuffer)
        this._localSimulation.boidsFromJson(e.data.boids);
      return;

    case 'worker-tick-json':
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

    case 'worker-tick-shared-binary':
      // If boids are added dynamically, the binary buffer needs to be updated.
      self._localSimulation.updateBuffer();

      // Overwrite boid state with the synchronized state from main thread
      self._localSimulation.boidsFromBinary();
      // Compute a local tick
      self._localSimulation.tick();
      self._localSimulation.boidsToBinary();

      // Post updated local state to main thread
      postMessage({msg: 'ticked-shared-binary'});
      return;

      case 'tick-transferable-binary':
        // Compute a local tick
        self._localSimulation.tick();

        // Post updated local state to main thread
        // NOTE: the function writeBoidsToTransferable returns the required transferable list https://developers.google.com/web/updates/2011/12/Transferable-Objects-Lightning-Fast
        
        postMessage({ ...e.data, msg: "ticked-transferable-binary" }, self._localSimulation.writeBoidsToTransferable(e.data));        
        // If boids are added dynamically, the binary buffer needs to be updated.
        // NOTE: Update done using shared buffer for convinience.
        self._localSimulation.updateBuffer();
      return;

      case 'update-buffer':
        self._localSimulation.queueBuffer(e.data.buf);
        return;
    default:
      return;

  } 
}

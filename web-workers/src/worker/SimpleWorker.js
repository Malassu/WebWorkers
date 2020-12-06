import BoidWorld from '../simulation/boids/BoidWorld.js';

/**
* Simple Worker has a local copy of the BoidWorld. On each tick the worker computes a partial
* simulation in the local BoidWorld and upon completion updates the local state to the main
* BoidWorld.
*/

self._localSimulation = null;

self.onmessage = function(e) {
  switch (e.data.msg) {
    case 'init':
      this._localSimulation = BoidWorld.cloneWorld(e.data.serialized, e.data.sharedBuffer);
      return;

    case 'tick-json':
      // Overwrite boid state with the synchronized state from main thread
      self._localSimulation.boidsFromSerialized(e.data.boidsJson);
      // Compute a local tick
      self._localSimulation.tick();
      // Post updated local state to main thread
      const boids = this._localSimulation.serializedBoids;
      postMessage({msg: 'ticked-json', boids: boids});
      return;
    
    case 'tick-shared-binary':
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
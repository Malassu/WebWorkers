importScripts("./simulation/boids/BoidWorld.js")
self.simulation = null;

self.onmessage = function(ev) {
  if (ev.data.msg === 'start') {
    // BoidWorld setup
    const width = ev.data.width;
    const height = ev.data.height;
    self.simulation = new BoidWorld({ 
      numOfBoids: 1000, 
      bounds: {
        x: [0, width],
        y: [0, height]
      },
      boidRadius: 10,
      maxSpeed: 5
      });
    self.postMessage({msg: 'ticked', boids: simulation.toJson})
    setInterval(() => {
      self.simulation.tick()
      self.postMessage({msg: 'ticked', boids: simulation.toJson})
    }, 33);
  }
  if (ev.data.msg == 'add') {
    for(var i = 0; i < ev.data.amount; i++) {
      self.simulation.addBoid();
    }
  }
}

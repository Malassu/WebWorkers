import BoidWorld from "./simulation/boids/BoidWorld.js";
import PixiRenderer from "./renderer/PixiRenderer.js"

class App {
  constructor() {

    // BoidWorld setup
    const width = 1800;
    const height = 900;
    this.simulation = new BoidWorld({ 
      numOfBoids: 0, 
      bounds: {
        x: [0, width],
        y: [0, height]
      },
      boidRadius: 5,
      collision: true,
      explosion: false,
      explosionIntesity: 100,
      explosionsPerTick: 0,
      explosionRadius: 100,
      maxSpeed: 2,
      explosion: true
    });

    this._renderer = new PixiRenderer(this.simulation)
    this._eventListeners = {};
    this.tickVal = 0;
  }

  restart() {
    window.requestAnimationFrame(this.loop.bind(this));
  }

  addBoids(amount) {
    Array.from({length: amount}, () => {
      this.simulation.addBoid();
      this._renderer.addSprite();
    });
  }

  setWorldState(option, value) {
    this.simulation.setState(option, value);
  }

  loop() {
    const startTimeTick = performance.now();    
    this.simulation.tick();
    const tickTime = performance.now() - startTimeTick;
    const entireTickElement = document.querySelector("#entireTick");
    const simulationTickElement = document.querySelector("#simulationTick");
    entireTickElement.innerHTML = Math.round(1 / tickTime * 100000) / 100;
    simulationTickElement.innerHTML = tickTime;
    this._renderer.render();
    window.requestAnimationFrame(this.loop.bind(this));
  }

}
  
export default App;

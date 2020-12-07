import BoidWorld from "./simulation/boids/BoidWorld.js";
import PixiRenderer from "./renderer/PixiRenderer.js"

class App {
  constructor() {

    // BoidWorld setup
    const width = 1800;
    const height = 900;
    this.simulation = new BoidWorld({ 
      numOfBoids: 1000, 
      bounds: {
        x: [0, width],
        y: [0, height]
      },
      boidRadius: 5,
      collision: true,
      explosion: true,
      explosionIntesity: 100,
      explosionsPerTick: 1,
      explosionRadius: 100,
      maxSpeed: 2,
      explosion: true
    });

    this._renderer = new PixiRenderer(this.simulation)
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
    this.simulation.tick();
    this._renderer.render();
    window.requestAnimationFrame(this.loop.bind(this));
  }

}
  
export default App;

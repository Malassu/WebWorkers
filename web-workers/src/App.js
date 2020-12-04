import SimpleWorkerPlanner from "./worker/SimpleWorkerPlanner.js";
import BoidWorld from "./simulation/boids/BoidWorld.js";
import PixiRenderer from "./renderer/PixiRenderer.js"

class App {
  constructor() {

    // BoidWorld setup
    const width = 1800;
    const height = 900;
    this.simulation = new BoidWorld({ 
      numOfBoids: 4000, 
      bounds: {
        x: [0, width],
        y: [0, height]
      },
      boidRadius: 10,
      explosionIntesity: 100,
      explosionRadius: 100,
      maxSpeed: 2
    });

    this.readyToTick = true;

    this._renderer = new PixiRenderer(this.simulation);
    this._planner = new SimpleWorkerPlanner(this.simulation, 1, this.nextTickCallback.bind(this));
    this._planner.init();
  }

  restart() {
    // this._planner.init();
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
    // tick simulation only if all previous ticks have been merged
    // TODO: Allow dynamix selection of used tick method.
    if (this.readyToTick) {
      this._planner.parallelTickSharedBinary();
      this.readyToTick = false;
    }
    this._renderer.render();
    window.requestAnimationFrame(this.loop.bind(this));
  }

  nextTickCallback() {
    this.readyToTick = true;
  }
}
  
export default App;
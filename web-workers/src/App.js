import PixiRenderer from "./renderer/PixiRenderer.js"
import CanvasRenderer from "./renderer/CanvasRenderer.js";
import Worker from "worker-loader!./worker/SimpleWorkerPlanner.js";

class App {
  constructor() {

    // BoidWorld setup
    this.width = 1800;
    this.height = 900;
    this.workerCount = 4;

    // this.readyToTick = true;

    // this._renderer = new PixiRenderer(width, height);
    this._renderer = new CanvasRenderer(this.width, this.height);
    this._planner = new Worker({type:'module'});
    this._planner.addEventListener('message', this.handleMessageFromPlanner.bind(this));
  }

  reset() {
    this._planner.postMessage({msg: 'create-planner', workerCount: this.workerCount, width: this.width, height: this.height});
  }

  start() {
    this._planner.postMessage({msg: 'start-planner'});
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

  handleMessageFromPlanner(e) {
    if (e.data.msg == 'render') {
      const boids = JSON.parse(e.data.boids);
      
      this._renderer.render(boids);
    }
  }
}
  
export default App;
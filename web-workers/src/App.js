import PixiRenderer from "./renderer/PixiRenderer.js"
import CanvasRenderer from "./renderer/CanvasRenderer.js";
import Worker from "worker-loader!./worker/SimpleWorkerPlanner.js";

class App {
  constructor() {

    // BoidWorld setup
    this.width = 1800;
    this.height = 900;
    this.workerCount = 2;

    this.config = {
      numOfBoids: 1000,
      bounds: {
        x: [0, this.width],
        y: [0, this.height]
      },
      boidRadius: 10,
      explosionIntesity: 100,
      explosionRadius: 100,
      maxSpeed: 2
    }

    // this._renderer = new PixiRenderer(width, height);
    this._renderer = new CanvasRenderer(this.width, this.height);
    this._planner = new Worker({type:'module'});
    this._planner.addEventListener('message', this.handleMessageFromPlanner.bind(this));
    this._eventListeners = {};
  }

  on(eventName, cb) {
    if (!this._eventListeners[eventName])
      this._eventListeners[eventName] = [];

    this._eventListeners[eventName] = this._eventListeners[eventName].concat(cb);
  }

  removeListener(eventName, cb) {
    if (!this._eventListeners[eventName])
      throw Error(`Can't remove event listener. Now listeners for event ${ eventName } exist.`);

    this._eventListeners[eventName] = this._eventListeners[eventName].filter(listener => listener !== cb);
  }

  emit(eventName, data) {
    if (this._eventListeners[eventName])
      this._eventListeners[eventName].forEach(cb => cb(data));
  }

  reset() {
    this._planner.postMessage({msg: 'planner-create', workerCount: this.workerCount, config: this.config});
  }

  start() {
    this._planner.postMessage({msg: 'planner-start'});
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
    if (e.data.msg == 'main-render') {
      const boids = JSON.parse(e.data.boids);
      
      this._renderer.render(boids);

      
      this.emit("simulation-timestamps", e.data.timeStamps);
    }
  }
}
  
export default App;
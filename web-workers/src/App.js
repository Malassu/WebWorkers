import PixiRenderer from "./renderer/PixiRenderer.js"
import CanvasRenderer from "./renderer/CanvasRenderer.js";
import Worker from "worker-loader!./worker/SimpleWorkerPlanner.js";
import BinaryBoidParser from "./simulation/boids/BinaryBoidParser.js";

class Report {
  constructor(numOfBoids, numOfWorkers) {
    this.tickTimes = [];
    this.fpsVals = [];
    this.numOfBoids = numOfBoids;
    this.numOfWorkers = numOfWorkers;
  }
  appendTick(tickTime) {
    var len = this.tickTimes.length;
    if (len == 1000) {
      var fpsSum = 0;
      var ticktimesSum = 0;
      for( var i = 0; i < len; i++ ){
        fpsSum += this.fpsVals[i]
        ticktimesSum += this.tickTimes[i]
      }
      console.log(
        "Stats after 1000 ticks with " + this.numOfWorkers + " workers and " + this.numOfBoids + " boids:", '\n',
        "Average tick time: " + (ticktimesSum / len) + ' ms', '\n',
        "Average FPS: " + (fpsSum / len));
      this.tickTimes.push(tickTime);
      this.fpsVals.push(Math.round(1 / tickTime * 100000) / 100);
    }
    else if (len > 1000) { }
    else {
      this.tickTimes.push(tickTime);
      this.fpsVals.push(Math.round(1 / tickTime * 100000) / 100);
    }
  }
}

class App {
  constructor(config, workerCount) {

    // BoidWorld setup
    this.workerCount = workerCount;
    this.config = config;
    this.report = new Report(config.numOfBoids, workerCount);

    this._renderer = new PixiRenderer(this.config);
    this.pixi = true;
    // this._renderer = new CanvasRenderer(this.config);
    this._planner = new Worker({type:'module'});
    this._planner.addEventListener('message', this.handleMessageFromPlanner.bind(this));
    this._eventListeners = {};
    this._binaryParser = new BinaryBoidParser();
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
    this.renderTimeStamp = performance.now();
  }

  changeDataIntreface(type) {
    this._planner.postMessage({msg: 'change-data-interface', type });
  }

  addBoids(amount) {
   if (this.pixi) {
    this._renderer.addSprites(amount);
   }

    this._planner.postMessage({msg: 'add-boids', amount });
  }

  setWorldState(option, value) {
    this.simulation.setState(option, value);
  }

  handleMessageFromPlanner(e) {
    if (e.data.msg == 'main-render') {

      const timeTook = performance.now() - this.renderTimeStamp;
      
      const boids = JSON.parse(e.data.boids);

      
      this._renderer.render(boids);

      this.renderTimeStamp = performance.now();
      this.emit("simulation-timestamps", { ...e.data.timeStamps, timeTook });
    }
    else if (e.data.msg === 'shared-buffer') {
      this._binaryParser.buffer = e.data.sharedBuffer;
    }
  }
}
  
export default App;

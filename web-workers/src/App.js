import BoidWorld from "./simulation/boids/BoidWorld.js";
import PixiRenderer from "./renderer/PixiRenderer.js"

class Report {
  constructor(numOfBoids) {
    this.tickTimes = [];
    this.fpsVals = [];
    this.numOfBoids = numOfBoids;
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
        "Stats after 1000 ticks with " + this.numOfBoids + " boids:", '\n',
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
  constructor(config) {

    // BoidWorld setup
    this.simulation = new BoidWorld(config);

    this._renderer = new PixiRenderer(this.simulation)
    this._eventListeners = {};
    this.tickVal = 0;
    this.report = new Report(config.numOfBoids);
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
    this.report.appendTick(tickTime);
    this._renderer.render();
    window.requestAnimationFrame(this.loop.bind(this));
  }

}
  
export default App;

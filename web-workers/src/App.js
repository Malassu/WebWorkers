import BoidWorld from "./simulation/boids/BoidWorld.js";
import PixiRenderer from "./renderer/PixiRenderer.js"

class App {
  constructor() {

    this.image = "images/blue_ball_small.png";
    this.balls = [];

    // BoidWorld setup
    const width = 768;
    const height = 768;
    this._simulation = new BoidWorld({ 
      numOfBoids: 1, 
      bounds: {
        x: [0, width],
        y: [0, height]
      },
      boidRadius: 10,
      explosionIntesity: 100,
      explosionRadius: 100,
      maxSpeed: 2
    });
    this._renderer = new PixiRenderer(this._simulation);
  }

  restart() {
    window.requestAnimationFrame(this.loop.bind(this));
    // this.loop();
  }

  addBoids(amount) {
    Array.from({length: amount}, () => {
      this._simulation.addBoid();
      this._renderer.addSprite();
    });
  }

  setWorldState(option, value) {
    this._simulation.setState(option, value);
  }

  loop() {
    window.requestAnimationFrame(this.loop.bind(this));
    this._simulation.tick();
    this._renderer.render();

    // setInterval(() => {
    //   this._simulation.tick();
    //   this._renderer.render();
    // }, 33);
  }
}
  
export default App;
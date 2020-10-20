import BoidWorld from "./simulation/boids/BoidWorld.js";
import App from "./App.js";

// Canvas setup
// const canvas = document.getElementById('testCanvas');
// const { width, height } = canvas;
// canvas.style.border = "1px solid black";
// const ctx = canvas.getContext('2d');

const width = 768;
const height = 768;

const Renderer = class {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.image = "images/blue_ball_small.png";
    this.balls = [];

    // PIXI setup
    let type = "WebGL"
    if(!PIXI.utils.isWebGLSupported()){
      type = "canvas"
    }
    PIXI.utils.sayHello(type)
    this.app = new PIXI.Application({width: 768, height: 768, forceCanvas: true});
    this.app.renderer.backgroundColor = 0x061639;
    document.body.appendChild(this.app.view);
    
    PIXI.loader
      .add(this.image)
  }

  addBall() {
    console.log("ADD BALL");
    let ball = new PIXI.Sprite(
      PIXI.loader.resources[this.image].texture
    );
    this.balls.push(ball);
    this.app.stage.addChild(ball);
  }

  render(boids) {
    boids.forEach((boid, i) => {
      let x = boid["position"]["components"]["x"];
      let y = boid["position"]["components"]["y"];
      this.balls[i].position.set(x, y);
      console.log(this.balls[i].x, this.balls[i].y);
    });
  }
}

window.onload = () => {

  const renderer = new Renderer();
  const simulation = new BoidWorld({ 
    numOfBoids: 1, 
    bounds: {
      x: [0, width],
      y: [0, height]
    },
    boidRadius: 10,
    maxSpeed: 5
  });
  
  const app = new App(simulation, renderer);
  app.reset()

  // Setup UI listeners
  const addButton = document.querySelector("#addButton");
  addButton.addEventListener('click', event => {
    const amount = document.getElementById("amount").value;
    app.addBoids(amount);
  });

  const resetButton = document.querySelector("#resetButton");
  resetButton.addEventListener('click', event => {
    app.reset();
  });
};

import BoidWorld from "./simulation/boids/BoidWorld.js";

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
      maxSpeed: 5
    });

    // PIXI setup
    let type = "WebGL";
    if(!PIXI.utils.isWebGLSupported()){
      type = "canvas"
    }
    PIXI.utils.sayHello(type)
    this.app = new PIXI.Application({width: width, height: height, forceCanvas: true});
    this.app.renderer.backgroundColor = 0xFFFFFF;
    this.app.view.style.border = "solid";
    document.body.appendChild(this.app.view);

    // Set texture
    const circle = new PIXI.Graphics();
    circle.beginFill(0x000000);
    circle.lineStyle(0);
    circle.drawCircle(10, 10, 10);
    circle.endFill();

    const texture = PIXI.RenderTexture.create(circle.width, circle.height);
    this.app.renderer.render(circle, texture);
    this.texture = texture;


    // load
    PIXI.loader
      .add(this.image)
      .load(this.init.bind(this));
  }

  init() {
    this._simulation.boids.forEach(value => {
      this.addSprite();
    });

    this.loop();
  }

  addBoids(amount) {
    Array.from({length: amount}, () => {
      this._simulation.addBoid();
      this.addSprite();
    });
  }

  addSprite() {
    // let ball = new PIXI.Sprite(PIXI.loader.resources[this.image].texture);
    let ball = new PIXI.Sprite(this.texture);
    ball.anchor.set(0.5);
    this.app.stage.addChild(ball);
    this.balls.push(ball);
  }

  render() {
    this._simulation.boids.forEach((boid, i) => {
      if (this.balls[i] !== undefined) {
        let x = boid["position"]["components"]["x"];
        let y = boid["position"]["components"]["y"];
        this.balls[i].position.set(x, y);
      }
    });
  }

  loop() {
    this._simulation.tick();
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }
}
  
export default App;
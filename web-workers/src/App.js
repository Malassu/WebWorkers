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
    // let type = "canvas";
    // if(!PIXI.utils.isWebGLSupported()){
    //   type = "canvas"
    // }
    PIXI.utils.sayHello(type)
    this.app = new PIXI.Application({width: width, height: height, forceCanvas: true});
    this.app.renderer.backgroundColor = 0xFFFFFF;
    this.app.view.style.border = "solid";
    document.body.appendChild(this.app.view);

    // Set texture
    this.colors = ['FF0000', 'F5161B', 'EC2C37', 'E24253', 'D9586F', 'CF6E8A', 'C684A6', 'BC9AC2', 'B3B0DE', 'AAC7FA'];
    this.radius = 10;
    this.animationSpeed = 0.5; // default 1, higher is faster
    this.textureArray = this.textureGradient(this.colors, this.radius);

    // load
    PIXI.loader
      .add(this.image)
      .load(this.init.bind(this));
  }

  textureGradient(colors, radius) {
    const textures = [];
    for (const color of colors) {
      const circle = new PIXI.Graphics();
      circle.beginFill(`0x${color}`);
      circle.lineStyle(0);
      circle.drawCircle(radius, radius, radius);
      circle.endFill();

      const texture = PIXI.RenderTexture.create(circle.width, circle.height);
      this.app.renderer.render(circle, texture);
      textures.push(texture);
    }
    return textures;
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
    let ball = new PIXI.AnimatedSprite(this.textureArray);
    ball.loop = false;
    ball.animationSpeed = this.animationSpeed;
    ball.anchor.set(0.5);
    this.app.stage.addChild(ball);
    this.balls.push(ball);
    ball.play();
  }

  setWorldState(option, value) {
    this._simulation.setState(option, value);
  }

  render() {
    this._simulation.boids.forEach((boid, i) => {
      if (this.balls[i] !== undefined) {
        let sprite = this.balls[i];
        let x = boid["position"]["components"]["x"];
        let y = boid["position"]["components"]["y"];
        sprite.position.set(x, y);
        
        // play animations
        if (boid.collided) {
          sprite.gotoAndPlay(0);
        }
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
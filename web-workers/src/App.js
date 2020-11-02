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
      explosionIntesity: 100,
      explosionRadius: 100,
      maxSpeed: 1
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
    this.radius = this._simulation.getState('boidRadius');
    this.animationSpeed = 0.5; // default 1, higher is faster
    this.textureArray = this.getCollisionTexture(this.colors, this.radius);

    // Set explosion texture
    const explosionRadius = this._simulation.getState('explosionRadius')
    this.explosionTexture = this.getExplosionTexture(explosionRadius);
    

    // load
    PIXI.loader
      .add(this.image)
      .load(this.init.bind(this));
  }

  getExplosionTexture(radius) {
    const textures = [];
    const colors = ['000000','FFFFFF'];

    for (const color of colors) {
      const circle = new PIXI.Graphics();
      circle.beginFill(`0x${color}`);
      // circle.lineStyle(2, `0x${color}`);
      circle.drawCircle(radius, radius, radius);
      circle.beginHole();
      circle.drawCircle(radius, radius, radius - 1);
      circle.endHole();
      circle.endFill();
      const texture = PIXI.RenderTexture.create(circle.width, circle.height);
      this.app.renderer.render(circle, texture);
      textures.push(texture);
    }
    return textures;
  }

  getCollisionTexture(colors, radius) {
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

  playExplosionAnimation(x, y) {
    let explosion = new PIXI.AnimatedSprite(this.explosionTexture);
    explosion.scale.set(1);
    // explosion.position.set(x, y);
    explosion.onComplete = () => {
      explosion.destroy();
    }
    explosion.x = x;
    explosion.y = y;
    explosion.loop = false;
    explosion.animationSpeed = this.animationSpeed * 0.7;
    explosion.anchor.set(0.5);
    this.app.stage.addChild(explosion);
    explosion.gotoAndPlay(0);
    // const explosion = new PIXI.AnimatedSprite(this.explosionTextures);
    
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
        if (boid.exploded) {
          // TODO add animation
          this.playExplosionAnimation(x, y)
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
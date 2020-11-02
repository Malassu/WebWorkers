//import BoidWorld from "./simulation/boids/BoidWorld.js";

class App {
  constructor() {

    const width = 765;
    const height = 765;
    this.image = "images/blue_ball_small.png";
    this.balls = [];

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
    this.addSprite();
    this.loop();
  }

  loop() {
    requestAnimationFrame(this.loop.bind(this));
  }

  addBoids(amount) {
    Array.from({length: amount}, () => {
      this.addSprite();
    });
  }

  addSprite() {
    let ball = new PIXI.Sprite(this.texture);
    ball.anchor.set(0.5);
    this.app.stage.addChild(ball);
    this.balls.push(ball);
  }

  reset() {
    location.reload();
  }

}
  
export default App;

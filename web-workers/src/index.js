//import BoidWorld from "./simulation/boids/BoidWorld.js";

let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}
PIXI.utils.sayHello(type)

let app = new PIXI.Application({width: 768, height: 768, forceCanvas: true});

document.body.appendChild(app.view);

let image = "images/blue_ball_small.png";

PIXI.loader
  .add(image)
  .load(setup);

function setup() {
  var x = 100;
  var y = 100;
  let ball = new PIXI.Sprite(
    PIXI.loader.resources[image].texture
  );
  ball.position.set(x, y)
  app.stage.addChild(ball);
}

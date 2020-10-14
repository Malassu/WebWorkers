import BoidWorld from "./simulation/boids/BoidWorld.js";

let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}
PIXI.utils.sayHello(type)

let app = new PIXI.Application({width: 768, height: 768, forceCanvas: true});

document.body.appendChild(app.view);

let image = "images/blue_ball_small.png";
let world = new BoidWorld();

for(var i = 0; i < 1; i++) {
  world.addBoid();
}

world.boids.forEach(boidRender);

function boidRender(value, index, array) {
  let x = value["position"]["components"]["x"];
  let y = value["position"]["components"]["y"];
  PIXI.loader
    .add(image)
    .load(setup);

  function setup() {
    let ball = new PIXI.Sprite(
      PIXI.loader.resources[image].texture
    );
    ball.position.set(x, y)
    app.stage.addChild(ball);
  }
}

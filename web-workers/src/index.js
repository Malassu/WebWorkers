import BoidWorld from "./simulation/boids/BoidWorld.js";

const canvas = document.getElementById('testCanvas');
const { width, height } = canvas;
canvas.style.border = "1px solid black";


const ctx = canvas.getContext('2d');

window.onload = () => {
  const world = new BoidWorld({ 
    numOfBoids: 1000, 
    bounds: {
      x: [0, width],
      y: [0, height]
    },
    boidRadius: 10,
    maxSpeed: 5
  });
  
  world.boids.forEach(value => {
    const circle = new Path2D();
    circle.arc(value.x, value.y, value.radius, 0, 2 * Math.PI);
    ctx.fill(circle);
  });

  world.tick();

  setInterval(() => {
    ctx.clearRect(0, 0, width, height);
  
    world.boids.forEach(value => {
      const circle = new Path2D();
      circle.arc(value.x, value.y, value.radius, 0, 2 * Math.PI);
      ctx.fill(circle);
    });
    
    world.tick();
  
  }, 33);
  
  

  
};
  

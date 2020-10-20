import BoidWorld from "./simulation/boids/BoidWorld.js";
import App from "./App.js";

const canvas = document.getElementById('testCanvas');
const { width, height } = canvas;
canvas.style.border = "1px solid black";


const ctx = canvas.getContext('2d');

const Renderer = class {
    constructor(ctx, canvas) {
        this.ctx = ctx
        this.canvas = canvas
    }
    
}

window.onload = () => {

  const renderer = new Renderer(ctx, canvas);
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

  // UI listeners
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
  

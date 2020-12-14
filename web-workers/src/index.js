import App from "./App.js";

let worldConfig = {
  bounds: {
    x: [0, 1800],
    y: [0, 900]
  },
  boidRadius: 3,
  collision: true,
  explosion: true,
  explosionIntesity: 100,
  explosionsPerTick: 1,
  explosionRadius: 100,
  maxSpeed: 2,
}

/**
 * START SCRIPT EXAMPLE:
 * WORKERS=2 INTERFACE=shared-binary BOIDS=8000 npm start
 * 
 * WORKERS
 * 1, 2, 3, 4
 * 
 * INTERFACE
 * json
 * structured-cloning
 * shared-binary
 * transferable-binary
 * 
 * BOIDS
 * 4000, 8000, 16000, 50000
 * 
 */

const workerCount = WORKERS !== undefined ? parseInt(WORKERS) : 1;
const interfaceType = INTERFACE !== undefined ? INTERFACE : 'json';
const numOfBoids = BOIDS !== undefined ? parseInt(BOIDS) : 4000;

console.log("WORKERS: ", workerCount);
console.log("INTERFACE: ", interfaceType);
console.log("BOIDS: ", numOfBoids);

worldConfig.numOfBoids = numOfBoids;

window.onload = () => {
  const app = new App(worldConfig, workerCount, interfaceType);
  app.reset();

  app.on("simulation-timestamps", ({ parallelTick, timeTook, workers }) => {
    const parallelTickElement = document.querySelector("#parallelTick");
    const avgEntireWorkerElement = document.querySelector("#avgEntireWorker");
    const avgTickElement = document.querySelector("#avgTick");
    const timeTookElement = document.querySelector("#timeTook");

    if(Math.round(1 / parallelTick * 100000) / 100 != Infinity) {
      app.report.appendTick(parallelTick);
    }

    timeTookElement.innerHTML = Math.round(1 / parallelTick * 100000) / 100;
    parallelTickElement.innerHTML = parallelTick;
    avgEntireWorkerElement.innerHTML = workers.reduce((acc, curr) => acc + curr.allTime, 0) / workers.length;
    avgTickElement.innerHTML = workers.reduce((acc, curr) => acc + curr.tickTime, 0) / workers.length;
  });

  const addButton = document.querySelector("#addButton");
  addButton.addEventListener('click', event => {
    const amount = document.getElementById("amount").value;
    app.addBoids(amount);
  });

  const interfaceInitial = document.querySelector(`[data-interface-type="${interfaceType}"]`);
  interfaceInitial.checked = "checked"

  document.querySelectorAll(".interface-selector").forEach(radioButton => {
    radioButton.onclick = () => {
      app.changeDataIntreface(radioButton.dataset.interfaceType);
    };
  });

  const startButton = document.querySelector("#startButton");
  startButton.addEventListener('click', event => {
    app.start();
  });
};

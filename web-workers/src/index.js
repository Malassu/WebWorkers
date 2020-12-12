import App from "./App.js";

const config = {
  numOfBoids: 4000,
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

const workerCount = 1;

window.onload = () => {
  const app = new App(config, workerCount);
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

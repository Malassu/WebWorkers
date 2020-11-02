import App from "./App.js";

// Canvas setup
// const canvas = document.getElementById('testCanvas');
// const { width, height } = canvas;
// canvas.style.border = "1px solid black";
// const ctx = canvas.getContext('2d');
const core = new Worker('src/core_worker.js')

window.onload = () => {
  const app = new App();
  
  function handleMessageFromWorker(msg) {
    console.log('incoming message from worker, msg:', msg);
    if(msg.data.msg == "init") {
      for(let i = 0; i < msg.data.boids.length; i++) {
        app.addSprite();
      }
    }
    if(msg.data.msg == "ticked") {
      var boids = msg.data.boids
      for(let i = 0; i < boids.length; i++){
        if (app.balls[i] !== undefined) {
          let x = boids[i]["x"];
          let y = boids[i]["y"];
          app.balls[i].position.set(x, y);
          core.postMessage({msg: 'tick'});
        }
      }
    }
  }
  core.addEventListener('message', handleMessageFromWorker);
  core.postMessage({msg: 'start', height: 765, width: 765})

  // Setup UI
  const toggleOverlay = document.querySelector("#toggleOverlay");
  toggleOverlay.addEventListener('click', event => {
    const overlay = document.querySelector(".overlay");
    overlay.style.display === "none" ? overlay.style.display = "table" : overlay.style.display = "none";
  });

  const addButton = document.querySelector("#addButton");
  addButton.addEventListener('click', event => {
    const amount = document.getElementById("amount").value;
    core.postMessage({msg: 'add', amount:  amount}, [amount]);
    app.addBoids(amount);
  });

  const resetButton = document.querySelector("#resetButton");
  resetButton.addEventListener('click', event => {
    app.reset();
  });
  
  core.postMessage({msg: 'tick'});
};

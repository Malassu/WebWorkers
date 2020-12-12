import App from "./App.js";

const config = {
    numOfBoids: 500,
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

window.onload = () => {
  const app = new App(config);

  // Setup UI
  const toggleOverlay = document.querySelector("#toggleOverlay");
  toggleOverlay.addEventListener('click', event => {
    const overlay = document.querySelector(".overlay");
    overlay.style.display === "none" ? overlay.style.display = "table" : overlay.style.display = "none";
  });

  const addButton = document.querySelector("#addButton");
  addButton.addEventListener('click', event => {
    const amount = document.getElementById("amount").value;
    app.addBoids(amount);
  });

  // const collisionsCheckbox = document.querySelector("#collisions");
  // collisionsCheckbox.addEventListener('click', event => {
  //   app.setWorldState('collision', collisionsCheckbox.checked);
  // });

  // const explosionsSlider = document.querySelector("#explosions");
  // const explosionFreq = document.querySelector("#explosionFreq")
  // explosionsSlider.addEventListener('change', event => {
  //   const freq = explosionsSlider.value / 100;
  //   explosionFreq.innerHTML = freq; 
  //   if (freq > 0) {
  //     app.setWorldState('explosion', true);
  //     app.setWorldState('explosionProb', freq / 10);
  //   } else {
  //     app.setWorldState('explosion', false);
  //   }
  // });

  const resetButton = document.querySelector("#resetButton");
  resetButton.addEventListener('click', event => {
    app.restart();
  });
};

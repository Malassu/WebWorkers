import App from "./App.js";

// Canvas setup
// const canvas = document.getElementById('testCanvas');
// const { width, height } = canvas;
// canvas.style.border = "1px solid black";
// const ctx = canvas.getContext('2d');

window.onload = () => {
  const app = new App();

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

  const resetButton = document.querySelector("#resetButton");
  resetButton.addEventListener('click', event => {
    app.reset();
  });
};

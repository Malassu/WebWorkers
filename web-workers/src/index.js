const core = new Worker('src/core_worker.js')
const canvas = document.getElementById('testCanvas');
const { width, height } = canvas;
canvas.style.border = "1px solid black";
const ctx = canvas.getContext('2d');

var boids = [];

window.onload = () => {
  
  function handleMessageFromWorker(msg) {
    if(msg.data.msg == "ticked") {
      boids = JSON.parse(msg.data.boids);
      ctx.clearRect(0, 0, width, height);
      boids.forEach(value => {
        const circle = new Path2D();
        circle.arc(value.x, value.y, 10, 0, 2 * Math.PI);
        ctx.fill(circle);
      });
    }
  }
  core.addEventListener('message', handleMessageFromWorker);
  core.postMessage({msg: 'start', height: height, width: width})

};

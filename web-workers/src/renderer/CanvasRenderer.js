class CanvasRenderer {
  constructor(config) {
    this.width = config.bounds["x"][1];
    this.height = config.bounds["y"][1];
    
    var canvas = document.createElement("canvas");
    canvas.setAttribute("width", this.width);
    canvas.setAttribute("height", this.height);
    const simulation = document.querySelector("#simulation");
    simulation.appendChild(canvas);
    this.ctx = canvas.getContext('2d');
  }
  
  render(boids) {
    this.ctx.clearRect(0, 0, this.width, this.height);
    boids.forEach(boid => {
      let x = boid["position"]["x"];
      let y = boid["position"]["y"];
      const circle = new Path2D();
      circle.arc(x, y, 5, 0, 2 * Math.PI);
      this.ctx.fill(circle);
    });
  }
}

export default CanvasRenderer;
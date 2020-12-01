class CanvasRenderer {
  constructor(simulation) {
    this._simulation = simulation;
    this.width = this._simulation.getState('bounds').x[1];
    this.height = this._simulation.getState('bounds').y[1];
    
    var canvas = document.createElement("canvas");
    canvas.setAttribute("width", this.width);
    canvas.setAttribute("height", this.height);
    document.body.appendChild(canvas);
    this.ctx = canvas.getContext('2d');
  }
  
  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this._simulation.boids.forEach((boid, i) => {
      let x = boid["position"]["components"]["x"];
      let y = boid["position"]["components"]["y"];
      const circle = new Path2D();
      circle.arc(x, y, 10, 0, 2 * Math.PI);
      this.ctx.fill(circle);
    });
  }
}

export default CanvasRenderer;
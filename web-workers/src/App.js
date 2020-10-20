class App {
    constructor(simulation, renderer) {
      // super();
        
      this._renderer = renderer;
      this._simulation = simulation;

      // const appTemplate = document.createElement('template');
      // appTemplate.innerHTML = `
      //   <style>
      //     .controls {
      //       position: absolute;
      //       margin-left:auto;
      //       margin-right:0;
      //       padding: 10px;
      //       background-color: rgba(0,0,0,0.8);
      //       border: solid 1px;
      //       width: 200px;
      //       height: 300px;
      //     }
      //   </style>
      //   <div class="controls">
      //     <input type="number" id="amount" value="10">
      //     <button id="add">Add</button>
      //   </div>
      // `;

      // const addButton = appTemplate.getElementById("add")
      // console.log(addButton);
      // //addButton.onclick = this.addBoids;

      // this.attachShadow({mode: 'open'});
      // this.shadowRoot.appendChild(appTemplate.content.cloneNode(true));
    }

    addBoids(amount) {
      Array.from({length: amount}, () => this._simulation.addBoid());
    }

    reset() {
      this._simulation.boids.forEach(value => {
        const circle = new Path2D();
        circle.arc(value.x, value.y, value.radius, 0, 2 * Math.PI);
        this._renderer.ctx.fill(circle);
      });
    
      // simulation tick
      this._simulation.tick();
        // render tick
      setInterval(() => {
        this._renderer.ctx.clearRect(0, 0, this._renderer.canvas.width, this._renderer.canvas.height);
      
        this._simulation.boids.forEach(value => {
          const circle = new Path2D();
          circle.arc(value.x, value.y, value.radius, 0, 2 * Math.PI);
          this._renderer.ctx.fill(circle);
        });
        
        this._simulation.tick();
      
      }, 33);
    }

    set simulation(value) {
      this._simulation = value;
    }

    set renderer(value) {
      this._renderer = value;
    }

    draw() {
      this.simulation.iterate();
      this.renderer.render();
    }
}
  
export default App;
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
      // TODO: call add PIXI sprites
    }

    reset() {
      console.log("JEEJAA");
      this._simulation.boids.forEach(value => {
        this._renderer.addBall()
        //circle.arc(value.x, value.y, value.radius, 0, 2 * Math.PI);
        //this._renderer.ctx.fill(circle);
      });

      this.draw();
    }

    set simulation(value) {
      this._simulation = value;
    }

    set renderer(value) {
      this._renderer = value;
    }

    draw() {
      console.log("DRAW");
      this._simulation.tick();
      this._renderer.render(this._simulation.boids);
      requestAnimationFrame(this.draw.bind(this));
    }
}
  
export default App;
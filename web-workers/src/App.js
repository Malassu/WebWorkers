class KonvaView extends HTMLElement {
    constructor() {
      self = super();
        
      this.renderer = undefined;
      this.simulation = undefined;

    }

    init() {
      //window.requestAnimationFrame(this.draw.bind(this));
    }

    updateSettings() {
      // TODO pass UI settings to simulation
    }

    draw() {
      this.simulation.iterate();
      this.renderer.render();
      //window.requestAnimationFrame(this.draw.bind(this));
    }
}
  
customElements.define('konva-view', KonvaView);

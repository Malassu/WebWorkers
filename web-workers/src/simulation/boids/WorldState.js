class WorldState {
  constructor(options) {

    const defaultState = {
      bounded: true,          // The worlds should have "walls" that boids bounce off of.
      maxSpeed: 1.0,          // Max speed all boids should follow.
      numOfBoids: 0,          // Current number of boids
      collision: true,        // Boids can bounce off of each other.
      explosion: true,        // Boids can randomly "explode" pushing surrounding boids away. 
      explosionsPerTick: 1,   // Maximum number of explosions per tick NOTE: Should be at most numOfBoids
      explosionProb: 0.01,    // probability of explosion per tick,
      expolsionRadius: 0.01,  // Radius of explosion
      explosionIntesity: 2.0  // Intensity of explosion.
    };

    Object.keys(defaultState).forEach(key => this[key] = (typeof options[key] === defaultState[key] ) ? options[key] : defaultState[key]);
    
  };

  setState(option, value) {
    if (this[option !== undefined])
      this[option] = value;
  };

  getState(option) {
    if (this[option !== undefined])
      return this[option];

    return Error("Value not defined");
  };

  // Get active behaviors that should be used for the next tick of the simulation.
  get behaviors() {
    return ["collision", "explosion"].filter(type => this[type]);
  }

};

export default WorldState;
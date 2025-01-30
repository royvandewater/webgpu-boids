const FPS_HISTORY_LENGTH = 100;

export class FpsTracker {
  constructor() {
    this.fps = 0;
    this.lastTime = performance.now();
    this.deltaTimes = [];
  }

  update() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (this.deltaTimes.length >= FPS_HISTORY_LENGTH) {
      this.deltaTimes.shift();
    }
    this.deltaTimes.push(deltaTime);

    const fps =
      (1000 / this.deltaTimes.reduce((a, b) => a + b, 0)) * FPS_HISTORY_LENGTH;
    this.fps = fps;
  }
}

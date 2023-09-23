import EventInput from "./EventInput";

export default class BasicCanvas extends EventInput {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  currentAnimation: number = 0;
  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    super(width, height);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;

    this.setHeight(height);
    this.setWidth(width);
  }

  setHeight(height: number) {
    this.canvas.height = height;
  }

  setWidth(width: number) {
    this.canvas.width = width;
  }

  cancelAnimation() {
    if (0 === this.currentAnimation) {
      return;
    }
    cancelAnimationFrame(this.currentAnimation);
  }

  dt: number;
  lastTimestamp: number;

  drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    borderRadius: number
  ) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + borderRadius, y);
    this.ctx.lineTo(x + width - borderRadius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + borderRadius);
    this.ctx.lineTo(x + width, y + height - borderRadius);
    this.ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - borderRadius,
      y + height
    );
    this.ctx.lineTo(x + borderRadius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - borderRadius);
    this.ctx.lineTo(x, y + borderRadius);
    this.ctx.quadraticCurveTo(x, y, x + borderRadius, y);
    this.ctx.closePath();
  }

  run(timestamp?: number) {
    //this actually is pre-run
    this.dt = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    if (isNaN(this.dt)) {
      this.currentAnimation = requestAnimationFrame(this.run.bind(this));
      return;
    }
    this.currentAnimation = requestAnimationFrame(this._run.bind(this));
  }
  _run(timestamp: number) {
    this.dt = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    //content

    //!content

    this.currentAnimation = requestAnimationFrame(this.run.bind(this));
  }
}

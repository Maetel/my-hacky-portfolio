import { clientHeight, clientWidth } from "@/utils";
import { EmptyFourWayPixels, RenderableSize } from "./Renderable";

export default class CanvasObserver {
  private theCanvas: HTMLCanvasElement = null;
  cached: RenderableSize = null;

  constructor(canvas: HTMLCanvasElement) {
    this.theCanvas = canvas;
  }

  resize(canvas: HTMLCanvasElement) {
    this.theCanvas = canvas;
    this.cached = null;
  }

  get size(): RenderableSize {
    if (this.cached) {
      return this.cached;
    }

    const w = this.theCanvas.width;
    const h = this.theCanvas.height;
    this.cached = {
      x: 0,
      y: 0,
      right: w,
      bottom: h,
      innerWidth: w,
      width: w,
      widthTotal: w,
      innerHeight: h,
      height: h,
      heightTotal: h,
      padding: EmptyFourWayPixels,
      margin: EmptyFourWayPixels,
      childrenFlexTotal: 0,
      texts: [],
      maxTextWidth: 0,
    };

    return this.cached;
  }
}

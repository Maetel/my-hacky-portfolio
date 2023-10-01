import { clientHeight, clientWidth } from "@/utils";
import {
  EmptyFourWayPixels,
  RenderableSize,
  RenderableCoord,
} from "./Renderable";

export default class CanvasObserver {
  private theCanvas: HTMLCanvasElement = null;
  cachedSize: RenderableSize = null;
  cachedCoord: RenderableCoord = null;

  constructor(canvas: HTMLCanvasElement) {
    this.theCanvas = canvas;
  }

  resize(canvas: HTMLCanvasElement) {
    this.theCanvas = canvas;
    this.cachedSize = null;
    this.cachedCoord = null;
  }

  get coord(): RenderableCoord {
    if (this.cachedCoord) {
      return this.cachedCoord;
    }

    const x = 0;
    const y = 0;
    const w = this.theCanvas.width;
    const h = this.theCanvas.height;
    this.cachedCoord = {
      x,
      y,
      right: w,
      bottom: h,
    };

    return this.cachedCoord;
  }

  get size(): RenderableSize {
    if (this.cachedSize) {
      return this.cachedSize;
    }

    const w = this.theCanvas.width;
    const h = this.theCanvas.height;
    this.cachedSize = {
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
      totalTextHeight: 0,
    };

    return this.cachedSize;
  }
}

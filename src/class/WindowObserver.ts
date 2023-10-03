import {
  EmptyFourWayPixels,
  RenderableSize,
  RenderableCoord,
} from "./Renderable";

/**
 * Init when VDOM is imported
 */
export default class CanvasObserver {
  private static theCanvas: HTMLCanvasElement = null;
  static cachedSize: RenderableSize = null;
  static cachedCoord: RenderableCoord = null;

  constructor() {}

  static init(canvas: HTMLCanvasElement) {
    CanvasObserver.theCanvas = canvas;
  }

  static resize() {
    CanvasObserver.cachedSize = null;
    CanvasObserver.cachedCoord = null;
  }

  static get coord(): RenderableCoord {
    if (CanvasObserver.cachedCoord) {
      return CanvasObserver.cachedCoord;
    }

    const x = 0;
    const y = 0;
    const w = CanvasObserver.theCanvas.width;
    const h = CanvasObserver.theCanvas.height;
    CanvasObserver.cachedCoord = {
      x,
      y,
      right: w,
      bottom: h,
    };

    return CanvasObserver.cachedCoord;
  }

  static get size(): RenderableSize {
    if (CanvasObserver.cachedSize) {
      return CanvasObserver.cachedSize;
    }

    const w = CanvasObserver.theCanvas.width;
    const h = CanvasObserver.theCanvas.height;
    CanvasObserver.cachedSize = {
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

    return CanvasObserver.cachedSize;
  }
}

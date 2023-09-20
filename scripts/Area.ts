import { AreaType, KeyCode } from "./types";
import { strPercentToFloat, strPxToFloat } from "./utils";

export class Area {
  type: AreaType;
  topRatio: number; //0~1
  bottomRatio: number; //0~1
  screenWidth: number; //px
  screenHeight: number; //px

  /**
   * @param type AreaType
   * @param topRatioOrPercent ratio or percent
   * @param bottomRatioOrPercent ratio or percent
   * @param screenHeight px
   * @param screenWidth px
   */
  constructor(
    type: AreaType,
    topRatioOrPercent: number | string,
    bottomRatioOrPercent: number | string,
    screenWidth: number,
    screenHeight: number
  ) {
    this.type = type;
    this.setTop(topRatioOrPercent);
    this.setBottom(bottomRatioOrPercent);
    this.setScreenHeight(screenHeight);
    this.setScreenWidth(screenWidth);
  }

  widthInPx = () => this.screenWidth;
  heightInPx = () => this.screenHeight * (this.bottomRatio - this.topRatio);
  innerWidth: () => number = this.widthInPx;
  innerHeight: () => number = this.heightInPx;

  setScreenHeight(screenHeight: number) {
    this.screenHeight = screenHeight;
  }

  setScreenWidth(screenWidth: number) {
    this.screenWidth = screenWidth;
  }

  setTop(top: number | string) {
    if (typeof top === "string") {
      if (top.includes("%")) {
        this.topRatio = strPercentToFloat(top);
      }
      if (top.includes("px")) {
        let px = strPxToFloat(top);
        if (px < 0) {
          px = this.screenHeight + px;
        }
        const ratio = px / this.screenHeight;
        this.topRatio = ratio;
      }
    } else {
      if (top < 0 || top > 1) {
        throw new Error("top must be 0~1");
      }
      this.topRatio = top;
    }
  }

  setBottom(bottom: number | string) {
    if (typeof bottom === "string") {
      if (bottom.includes("%")) {
        this.bottomRatio = strPercentToFloat(bottom);
      }
      if (bottom.includes("px")) {
        let px = strPxToFloat(bottom);
        if (px < 0) {
          px = this.screenHeight + px;
        }
        const ratio = px / this.screenHeight;
        this.bottomRatio = ratio;
      }
    } else {
      if (bottom < 0 || bottom > 1) {
        debugger;
        console.log({ bottom });
        throw new Error("bottom must be 0~1");
      }
      this.bottomRatio = bottom;
    }
  }

  topPx = () => this.topRatio * this.screenHeight;
  bottomPx = () => this.bottomRatio * this.screenHeight;

  isInArea(x: number, y: number) {
    return (
      this.topPx() <= y &&
      y < this.bottomPx() &&
      0 <= x &&
      x <= this.widthInPx()
    );
  }

  copied() {
    return new Area(
      this.type,
      this.topRatio,
      this.bottomRatio,
      this.screenWidth,
      this.screenHeight
    );
  }
}

export class KeyArea {
  x: number;
  y: number;
  w: number;
  h: number;
  code: KeyCode;
  constructor(x, y, w, h, code: KeyCode) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.code = code;
  }
  contains(x: number, y: number) {
    return (
      this.x <= x && x < this.x + this.w && this.y <= y && y < this.y + this.h
    );
  }
}

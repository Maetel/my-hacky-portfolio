import StyleLength, { Length } from "@/class/StyleLength";
import { KeyCode } from "../types";
import {
  hasNullish,
  isNullish,
  notNullish,
  strPercentToFloat,
  strPxToFloat,
} from "../utils";
import error from "@/class/IError";

interface LengthElement {}
interface HorizontalElement extends LengthElement {}
interface VerticalElement extends LengthElement {}
interface AreaInputHorLengths extends HorizontalElement {
  left?: Length; // ratio | % | px
  right?: Length; // ratio | % | px
  width?: Length; // ratio | % | px
}
interface AreaInputVerLengths extends VerticalElement {
  top?: Length; // ratio | % | px
  bottom?: Length; // ratio | % | px
  height?: Length; // ratio | % | px
}
export interface AreaInputSize
  extends AreaInputHorLengths,
    AreaInputVerLengths {}
interface AreaHorLengths extends HorizontalElement {
  left: StyleLength;
  right: StyleLength;
  width: StyleLength;
}
interface AreaVerLengths extends VerticalElement {
  top: StyleLength;
  bottom: StyleLength;
  height: StyleLength;
}
interface AreaSize extends AreaHorLengths, AreaVerLengths {}

function inputSizeToAreaSize<
  T extends AreaInputHorLengths | AreaInputVerLengths
>(screenBasePx: number, inputSizes: T): AreaHorLengths | AreaVerLengths {
  if (Object.values(inputSizes).every((e) => e.isStyleLength())) {
    return inputSizes as AreaHorLengths | AreaVerLengths;
  }

  const copied = { ...inputSizes };
  const keys = Object.keys(copied);
  const styles = keys.map((key) => {
    const inputSize: Length = copied[key];
    if (inputSize.isNullish()) {
      return null;
    }
    const retval = copied[key].isStyleLength()
      ? copied[key]
      : new StyleLength(screenBasePx, inputSize.length);
    return retval;
  });
  const contains3StyleLengths =
    styles.reduce((prev, cur) => {
      return prev + (cur?.isStyleLength() ? 1 : 0);
    }, 0) === 3;
  if (styles.every((s) => s !== null) && contains3StyleLengths) {
    //early return if just updating one element
    const retval = {};
    keys.forEach((key, i) => {
      retval[key] = styles[i];
    });
    return retval as AreaHorLengths | AreaVerLengths;
  }

  // initialize
  if (styles.filter((e) => e !== null).length !== 2) {
    error("Input size must have 2 non-null elements : ", { copied });
  }
  const nullIdx = styles.findIndex((e) => e === null);

  let px = null;
  if (nullIdx === 0) {
    // null : left or top
    px = styles[1].px - styles[2].px;
    // console.log("0 : ", px);
  }

  if (nullIdx === 1) {
    // null : right or bottom
    px = styles[0].px + styles[2].px;
    // console.log("1 : ", px);
  }

  if (nullIdx === 2) {
    // null : width or height
    px = styles[1].px - styles[0].px;
    // console.log("2 : ", px);
  }

  if (isNullish(px)) {
    error("Px cannot be nullish : ", { px, copied });
  }

  styles[nullIdx] = new StyleLength(screenBasePx, `${px}px`);
  const retval = {};
  keys.forEach((key, i) => {
    retval[key] = styles[i];
  });
  return retval as AreaHorLengths | AreaVerLengths;
}

export class Area {
  horStyle: AreaHorLengths;
  verStyle: AreaVerLengths;
  screenWidth: number; //px
  screenHeight: number; //px

  constructor(
    screenWidth: number,
    screenHeight: number,
    styles: AreaInputSize
  ) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    // when right and bottom, inverts
    let right = new Length();
    let bottom = new Length();
    if (styles.right) {
      const rightPx =
        screenWidth - new StyleLength(screenWidth, styles.right.length).px;
      console.log({ rightPx });
      right = new StyleLength(screenWidth, `${rightPx}px`);
      console.log({ right });
    }
    if (styles.bottom) {
      const bottomPx =
        screenHeight - new StyleLength(screenHeight, styles.bottom.length).px;
      console.log({ bottomPx });
      bottom = new StyleLength(screenHeight, `${bottomPx}px`);
      console.log({ bottom });
    }
    const horInputs = {
      left: styles.left ?? new Length(),
      right,
      width: styles.width ?? new Length(),
    };
    const verInputs = {
      top: styles.top ?? new Length(),
      bottom,
      height: styles.height ?? new Length(),
    };
    const horSizes = inputSizeToAreaSize(
      screenWidth,
      horInputs
    ) as AreaHorLengths;
    const verSizes = inputSizeToAreaSize(
      screenHeight,
      verInputs
    ) as AreaVerLengths;

    this.horStyle = horSizes;
    this.verStyle = verSizes;
  }

  protected setStyle(style: AreaInputSize) {
    const horInputs = {
      left: style.left ?? this.horStyle.left,
      right: style.right ?? this.horStyle.right,
      width: style.width ?? this.horStyle.width,
    } as AreaInputHorLengths;
    const verInputs = {
      top: style.top ?? this.verStyle.top,
      bottom: style.bottom ?? this.verStyle.bottom,
      height: style.height ?? this.verStyle.height,
    } as AreaInputVerLengths;
    // console.log({ horInputs, verInputs });
    const horSizes = inputSizeToAreaSize(
      this.screenWidth,
      horInputs
    ) as AreaHorLengths;
    const verSizes = inputSizeToAreaSize(
      this.screenHeight,
      verInputs
    ) as AreaVerLengths;

    if (horSizes.right.px < horSizes.left.px || horSizes.width.px < 0) {
      horSizes.right = horSizes.left.copied();
      horSizes.width = new StyleLength(this.screenWidth, "0px");
    }
    if (verSizes.bottom.px < verSizes.top.px || verSizes.height.px < 0) {
      verSizes.bottom = verSizes.top.copied();
      verSizes.height = new StyleLength(this.screenHeight, "0px");
    }
    this.horStyle = horSizes;
    this.verStyle = verSizes;
  }

  get xywh(): {
    left: number;
    top: number;
    width: number;
    height: number;
    right: number;
    bottom: number;
  } {
    return {
      left: this.left as number,
      top: this.top as number,
      width: this.width as number,
      height: this.height as number,
      right: this.right as number,
      bottom: this.bottom as number,
    };
  }
  get xywhRatio(): {
    left: number;
    top: number;
    width: number;
    height: number;
    right: number;
    bottom: number;
  } {
    const retval = { ...this.xywh };
    retval.left /= this.screenWidth;
    retval.right /= this.screenWidth;
    retval.width /= this.screenWidth;

    retval.top /= this.screenHeight;
    retval.bottom /= this.screenHeight;
    retval.height /= this.screenHeight;
    return retval;
  }
  get left() {
    return this.horStyle.left.px as number;
  }
  get right() {
    return this.horStyle.right.px;
  }
  get width() {
    return this.horStyle.width.px;
  }
  get top() {
    return this.verStyle.top.px;
  }
  get bottom() {
    // console.log({ verstyleBottom: this.verStyle.bottom.px });
    return this.verStyle.bottom.px;
  }
  get height() {
    return this.verStyle.height.px;
  }

  setScreenHeight(screenHeight: number) {
    this.screenHeight = screenHeight;
    Object.keys(this.horStyle).forEach((key) => {
      //update screen height
      this.horStyle[key].screenPx = screenHeight;
    });
  }

  setScreenWidth(screenWidth: number) {
    this.screenWidth = screenWidth;
    Object.keys(this.verStyle).forEach((key) => {
      //update screen width
      this.verStyle[key].screenPx = screenWidth;
    });
  }

  set top(top: number | string) {
    this.setStyle({
      top: new Length(top),
      height: new Length(),
    });
  }

  set bottom(bottom: number | string) {
    this.setStyle({
      height: new Length(),
      bottom: new Length(bottom),
    });
  }

  set left(left: number | string) {
    this.setStyle({ left: new Length(left) });
  }

  set right(right: number | string) {
    this.setStyle({ right: new Length(right) });
  }

  set width(width: number | string) {
    this.setStyle({ width: new Length(width) });
  }

  set height(height: number | string) {
    this.setStyle({ height: new Length(height) });
  }

  contains = (x: number, y: number) => this.isInArea(x, y);

  isInArea(x: number, y: number) {
    const left = this.left as number;
    const right = this.right as number;
    const top = this.top as number;
    const bottom = this.bottom as number;
    return top <= y && y <= bottom && left <= x && x <= right;
  }

  copied() {
    return new Area(this.screenWidth, this.screenHeight, {
      ...this.horStyle,
      ...this.verStyle,
    });
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

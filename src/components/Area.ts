import { KeyCode } from "../types";
import {
  clientHeight,
  clientWidth,
  hasNullish,
  isNullish,
  isPx,
  notNullish,
  parsePx,
  strPercentToFloat,
  strPxToFloat,
  toPx,
} from "../utils";
import error from "@/class/IError";

type AreaLength = {
  start: number | string;
  length: number | string;
  align: AreaAlign;
};

export const AreaAlignType = {
  left: 1,
  top: 1,
  right: 2,
  bottom: 2,
  center: 3,
} as const;

export type AreaAlign = keyof typeof AreaAlignType;

type AreaHorL = {
  left?: number | string;
  width?: number | string;
  right?: null;
};
type AreaHorR = {
  left?: null;
  right?: number | string;
  width?: number | string;
};
type AreaVerT = {
  top?: number | string;
  bottom?: null;
  height?: number | string;
};
type AreaVerB = {
  top?: null;
  bottom?: number | string;
  height?: number | string;
};
export type AreaInputSize = (AreaHorL | AreaHorR) & (AreaVerT | AreaVerB);

type AreaSizeInputHorType = "AreaHorL" | "AreaHorR";
type AreaSizeInputVerType = "AreaVerT" | "AreaVerB";
type AreaSizeInputType = {
  hor: AreaSizeInputHorType;
  ver: AreaSizeInputVerType;
};
const getAreaSizeInputType = (size: AreaInputSize): AreaSizeInputType => {
  const retval = {} as AreaSizeInputType;
  // debugger;
  const n = notNullish;
  if (n(size.left) && n(size.width)) {
    retval.hor = "AreaHorL";
  }
  // console.log({ right: size.right });
  if (n(size.right) && n(size.width)) {
    retval.hor = "AreaHorR";
  }
  if (n(size.top) && n(size.height)) {
    retval.ver = "AreaVerT";
  }
  if (n(size.bottom) && n(size.height)) {
    retval.ver = "AreaVerB";
  }

  return retval;
};

export abstract class Area {
  abstract parent: Area | null;
  abstract children: Area[];
  abstract copied();
  abstract addChild(child: Area): void;
  // parentHorSize: AreaLength; // screenWidth if parent is null
  // parentVerSize: AreaLength; // screenHeight if parent is null
  screenWidth: number; // screenwidth
  screenHeight: number; // screenheight
  horSize: AreaLength = {} as AreaLength;
  verSize: AreaLength = {} as AreaLength;
  areaType: AreaSizeInputType;
  constructor(
    parent: Area | null = null,
    size: AreaInputSize | "full" = "full",
    verAlign: AreaAlign = "top",
    horAlign: AreaAlign = "left"
  ) {
    // parent?.addChild(this);
    this.updateScreenSize();
    this.horSize.align = horAlign;
    this.verSize.align = verAlign;
    this.setSize(
      size === "full"
        ? { left: 0, width: 1, top: 0, height: 1, right: null, bottom: null }
        : size
    );
    // console.log({ hor: this.horSize, ver: this.verSize });
  }

  updateScreenSize() {
    this.screenWidth = clientWidth();
    this.screenHeight = clientHeight();
  }

  // left, top based px
  // paddingL(): number {
  //   return this.parent?.left ?? 0;
  // }
  // paddingR(): number {
  //   return this.parent?.right ?? clientWidth();
  // }
  // paddingT(): number {
  //   return this.parent?.top ?? 0;
  // }
  // paddingB(): number {
  //   return this.parent?.bottom ?? clientHeight();
  // }
  abstract paddingL(): number;
  abstract paddingR(): number;
  abstract paddingT(): number;
  abstract paddingB(): number;
  abstract get innerPaddingL(): number;
  abstract get innerPaddingR(): number;
  abstract get innerPaddingT(): number;
  abstract get innerPaddingB(): number;
  abstract speak(...args): void;

  // left & top
  padding(): { left: number; right: number; top: number; bottom: number } {
    return {
      left: this.paddingL(),
      right: this.paddingR(),
      top: this.paddingT(),
      bottom: this.paddingB(),
    };
  }

  get left(): number {
    const { start, length, align } = this.horSize;
    if (align === "right") {
      return this.right - this.width;
    }
    const startPx = this.horPx(start);
    const lengthPx = this.horPx(length);
    const parentPaddingL = this.parent?.innerPaddingL ?? 0;
    const parentLeft = this.parent?.left ?? 0;
    const sibilingsWidth = this.sibilings.left.reduce(
      (acc, cur) => acc + cur.width,
      0
    );
    switch (align) {
      case "left":
        return startPx + parentLeft + parentPaddingL + sibilingsWidth;
      case "center":
        return Math.max(
          this.center.x - this.width * 0.5,
          parentLeft + parentPaddingL
        );
    }
    error("invalid left", { horSize: this.horSize });
  }
  get leftRelative(): number {
    return this.left - this.paddingL();
  }
  get right(): number {
    const { start, length, align } = this.horSize;
    if (align === "left") {
      return this.left + this.width;
    }
    const startPx = this.horPx(start);
    const parentPaddingR = this.parent?.innerPaddingR ?? clientWidth();
    const parentRight = this.parent?.right ?? clientWidth();
    const sibilingsWidth = this.sibilings.right.reduce(
      (acc, cur) => acc + cur.width,
      0
    );
    switch (align) {
      case "right":
        return parentRight - parentPaddingR - startPx - sibilingsWidth;
      case "center":
        return Math.max(
          this.center.x + this.width * 0.5,
          parentRight - parentPaddingR
        );
    }
    error("invalid right", { horSize: this.horSize });
  }
  get rightRelative(): number {
    return this.right - this.paddingL();
  }
  get inputWidth(): number {
    const { length } = this.horSize;
    const px = this.horPx(length);
    return px;
  }
  get inputHeight(): number {
    const { length } = this.verSize;
    const px = this.verPx(length);
    return px;
  }
  get width(): number {
    const { length } = this.horSize;
    const px = this.horPx(length);
    return px;
    // if (typeof length === "string" && isPx(length)) {
    //   return px;
    // }
    // return Math.max(px - this.innerPaddingL - this.innerPaddingR, 0);
  }

  abstract get sibilings(): {
    left: Area[];
    right: Area[];
    top: Area[];
    bottom: Area[];
  };

  get top(): number {
    const { start, length, align } = this.verSize;
    if (align === "bottom") {
      return this.bottom - this.height;
    }
    const parentPaddingT = this.parent?.innerPaddingT ?? 0;
    const parentTop = this.parent?.top ?? 0;
    const sibilingsHeight = this.sibilings.top.reduce(
      (acc, cur) => acc + cur.height,
      0
    );
    const startPx = this.verPx(start);
    switch (align) {
      case "top":
        return parentTop + parentPaddingT + startPx + sibilingsHeight;
      case "center":
        return Math.max(
          this.center.y - this.height * 0.5,
          parentTop + parentPaddingT
        );
    }
    error("invalid top", { verSize: this.verSize });
  }
  get center(): { x: number; y: number } {
    return {
      x: (this.left + this.right) * 0.5,
      y: (this.top + this.bottom) * 0.5,
    };
  }
  get topRelative(): number {
    return this.top - this.paddingT();
  }
  get bottom(): number {
    const { start, length, align } = this.verSize;
    if (align === "top") {
      return this.top + this.height;
    }
    const startPx = this.verPx(start);
    const parentPaddingB = this.parent?.innerPaddingB ?? clientHeight();
    const parentBottom = this.parent?.bottom ?? clientHeight();
    const sibilingsHeight = this.sibilings.bottom.reduce(
      (acc, cur) => acc + cur.height,
      0
    );

    switch (align) {
      case "bottom":
        return parentBottom - parentPaddingB - startPx - sibilingsHeight;
      case "center":
        return Math.max(
          this.center.y + this.height * 0.5,
          parentBottom - parentPaddingB
        );
    }

    error("invalid bottom", { verSize: this.verSize });
  }
  get bottomRelative(): number {
    return this.bottom - this.paddingT();
  }
  get height(): number {
    const { length } = this.verSize;
    const px = this.verPx(length);
    return px;
    // if (typeof length === "string" && isPx(length)) {
    //   return px;
    // }
    // return Math.max(px - this.innerPaddingT - this.innerPaddingB, 0);
  }

  protected horPx(number: number | string) {
    const p = this.parent;
    if (p) {
      return parsePx(p.width - (p.innerPaddingL + p.innerPaddingR), number);
    }
    return parsePx(this.screenWidth, number);
  }

  protected verPx(number: number | string) {
    // return parsePx(this.parent?.height ?? this._height, number);
    const p = this.parent;
    if (p) {
      return parsePx(p.height - (p.innerPaddingT + p.innerPaddingB), number);
    }
    return parsePx(this.screenHeight, number);
  }

  forChildren(
    callback: (child: Area, index: number, children: Area[]) => void
  ) {
    this.children.forEach(callback);
  }

  moveX(dx: number | string) {
    const s = this.horPx(this.horSize.start);
    const direction = this.horSize.align === "left" ? 1 : -1;
    const d = this.horPx(toPx(dx)) * direction;
    this.horSize.start = toPx(s + d);
  }

  moveY(dy: number | string) {
    const s = this.verPx(this.verSize.start);
    const direction = this.verSize.align === "top" ? 1 : -1;
    const d = this.verPx(toPx(dy)) * direction;
    // console.log({ s, dy, d });
    this.verSize.start = toPx(s + d);
  }

  move(dx: number | string, dy: number | string) {
    this.moveX(dx);
    this.moveY(dy);
  }

  setSize(size: AreaInputSize, verAlign?: AreaAlign, horAlign?: AreaAlign) {
    const areaType = getAreaSizeInputType(size);
    if (verAlign) {
      this.verSize.align = verAlign;
    }
    if (horAlign) {
      this.horSize.align = horAlign;
    }

    // console.log({ size, areaType });

    switch (areaType.hor) {
      case "AreaHorL":
        this.horSize = {
          ...this.horSize,
          start: size.left,
          length: size.width,
        };
        break;
      case "AreaHorR":
        this.horSize = {
          ...this.horSize,
          start: size.right,
          length: size.width,
        };
        break;
    }
    switch (areaType.ver) {
      case "AreaVerT":
        this.verSize = {
          ...this.verSize,
          start: size.top,
          length: size.height,
        };
        break;
      case "AreaVerB":
        this.verSize = {
          ...this.verSize,
          start: size.bottom,
          length: size.height,
        };
        break;
    }
  }

  // force align to left
  setLeftRelative(
    left: number | string,
    width: number | string | "update" | "keep" = "keep"
  ) {
    let length = this.horSize.length;
    switch (width) {
      case "keep":
        break;
      case "update":
        length = this.horPx(this.horSize.length) + this.horPx(left);
        break;
      default:
        length = width;
    }
    this.horSize = {
      start: left,
      length,
      align: "left",
    };
  }

  // force align to right
  setRightRelative(
    right: number | string,
    width: number | string | "update" | "keep" = "keep"
  ) {
    let length = this.horSize.length;
    switch (width) {
      case "keep":
        break;
      case "update":
        length = this.horPx(this.horSize.length) + this.horPx(right);
        break;
      default:
        length = width;
    }
    this.horSize = {
      start: right,
      length,
      align: "right",
    };
  }

  // force align to top
  setTopRelative(
    top: number | string,
    height: number | string | "update" | "keep" = "keep"
  ) {
    let length = this.verSize.length;
    switch (height) {
      case "keep":
        break;
      case "update":
        length = this.verPx(this.verSize.length) + this.verPx(top);
        break;
      default:
        length = height;
    }
    this.verSize = {
      start: top,
      length,
      align: "top",
    };
  }

  // force align to bottom
  setBottomRelative(
    bottom: number | string,
    height: number | string | "update" | "keep" = "keep"
  ) {
    let length = this.verSize.length;
    switch (height) {
      case "keep":
        break;
      case "update":
        length = this.verPx(this.verSize.length) + this.verPx(bottom);
        break;
      default:
        length = height;
    }
    this.verSize = {
      start: bottom,
      length,
      align: "bottom",
    };
  }

  setWidth(width: number | string) {
    this.horSize.length = width;
  }

  setHeight(height: number | string) {
    this.verSize.length = height;
  }

  setHorAlign(align: AreaAlign) {
    this.horSize.align = align;
  }

  setVerAlign(align: AreaAlign) {
    this.verSize.align = align;
  }

  contains = (x: number, y: number) => this.isInArea(x, y);

  isInArea(x: number, y: number) {
    const left = this.left;
    const right = this.right;
    const top = this.top;
    const bottom = this.bottom;
    return top <= y && y <= bottom && left <= x && x <= right;
  }

  get xywh() {
    return {
      x: this.left,
      y: this.top,
      w: this.width,
      h: this.height,
    };
  }
  get xywhRelative() {
    return {
      x: this.leftRelative,
      y: this.topRelative,
      w: this.width,
      h: this.height,
    };
  }

  // global
  get lrwh() {
    return {
      left: this.left,
      right: this.right,
      width: this.width,
      top: this.top,
      bottom: this.bottom,
      height: this.height,
    };
  }

  // relative to parent
  get lrwhRelative() {
    return {
      left: this.leftRelative,
      right: this.rightRelative,
      width: this.width,
      top: this.topRelative,
      bottom: this.bottomRelative,
      height: this.height,
    };
  }

  get xywhRatio() {
    const retval = { ...this.xywh };
    retval.x /= this.screenWidth;
    retval.y /= this.screenHeight;
    retval.w /= this.screenWidth;
    retval.h /= this.screenHeight;
    return retval;
  }

  get lrwhRatio() {
    const retval = { ...this.lrwh };
    retval.left /= this.screenWidth;
    retval.right /= this.screenWidth;
    retval.width /= this.screenWidth;
    retval.top /= this.screenHeight;
    retval.bottom /= this.screenHeight;
    retval.height /= this.screenHeight;
    return retval;
  }

  setHor(hor: AreaLength) {
    this.horSize = { ...hor };
  }

  setVer(ver: AreaLength) {
    this.verSize = { ...ver };
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

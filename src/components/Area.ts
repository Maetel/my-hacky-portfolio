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
  inherit: 4,
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

  forChildren(
    callback: (child: Area, index: number, children: Area[]) => void
  ) {
    this.children.forEach(callback);
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

import {
  as,
  clientHeight,
  clientWidth,
  isNullish,
  isPx,
  notNullish,
  parseIfCombo,
  parseIfPixel,
  parsePx,
} from "@/utils";
import Widget, { getRootWidget } from "../components/Widget";
import WidgetStyle, { DefaultStyle } from "../components/WidgetStyle";
import Tree from "@/class/Tree";
import error from "@/class/IError";
import * as C from "@/constants";
import {
  FourWayPixels,
  EmptyFourWayPixels,
  RenderableSize,
  RenderableText,
  RenderableCoord,
} from "./Renderable";
import CanvasObserver from "./WindowObserver";

const helpers = {
  // used to refine padding, margin, border
  parsePaddingAndMargin: (str: string | undefined | null): FourWayPixels => {
    if (!str) {
      return { ...EmptyFourWayPixels };
    }
    const values = str
      .replaceAll("px", "")
      .trim()
      .split(" ")
      .filter((v) => v !== "")
      .map((v) => Number(v));
    if (values.length === 0) {
      return { ...EmptyFourWayPixels };
    }

    const len = values.length;
    if (len === 1) {
      const v = values[0];
      const hor = v;
      const ver = v;
      // console.log("hor, ver : ", hor, ver);
      return {
        left: hor,
        right: hor,
        top: ver,
        bottom: ver,
      };
    }

    if (len === 2) {
      const hor = values[1];
      const ver = values[0];
      return {
        left: hor,
        right: hor,
        top: ver,
        bottom: ver,
      };
    }

    if (len === 3) {
      const top = values[0];
      const hor = values[1];
      const bottom = values[2];
      return {
        left: hor,
        right: hor,
        top: top,
        bottom: bottom,
      };
    }

    if (len === 4) {
      const top = values[0];
      const right = values[1];
      const bottom = values[2];
      const left = values[3];
      return {
        left: left,
        right: right,
        top: top,
        bottom: bottom,
      };
    }

    error("Failed to parse padding|margin : ", {
      str,
    });
  },
  createTextSegments: (
    ctx: CanvasRenderingContext2D,
    text: string,
    textWritableWidth: number,
    style: WidgetStyle
  ): RenderableText[] => {
    ctx.save();
    const fontSize = (style.fontSize ?? C.System.fontSize) as number;
    const font = style.font ?? C.System.font;
    const lineheight = (style.lineHeight ??
      fontSize ??
      C.System.lineHeight) as number;
    const fontCombo = `${fontSize}px ${font}`;
    ctx.font = fontCombo;

    const totalText = text ?? "";
    const texts: RenderableText[] = [];
    // const segments: string[] = [];
    let segment = "";
    let textIdx = 0;
    const pushSegment = () => {
      texts.push({
        index: textIdx,
        text: segment,
        width: ctx.measureText(segment).width,
        yOffset: lineheight * textIdx,
      });
      segment = "";
      textIdx++;
    };
    for (let i = 0; i < totalText.length; i++) {
      // this.speak("getTextHeight", { i, char: totalText[i] });
      if (totalText[i] === "\n") {
        pushSegment();
        continue;
      }
      segment += totalText[i];
      const textWidth =
        ctx.measureText(segment).width + C.System.textMinPadding;
      if (textWidth >= textWritableWidth) {
        pushSegment();
      }
    }
    if (segment.length > 0) {
      pushSegment();
    }
    ctx.restore();
    return texts;
  },
};

export class InflatedWidget {
  parent: InflatedWidget | null;
  children: InflatedWidget[];
  _widget: Widget;
  inflatedStyle: WidgetStyle;
  id: string;
  isInflated: boolean = false;
  _globalCoord: RenderableCoord = null;
  _globalSize: RenderableSize = null;
  /**
   *
   */
  constructor(widget: Widget, parent: InflatedWidget | null = null) {
    this._widget = widget;
    this.inflatedStyle = {
      ...DefaultStyle,
      ...widget.style,
    };

    this.id = widget.id;
    if (widget.id === "root") {
      this._globalCoord = { ...VDOM.canvasCoord };
      this._globalSize = { ...VDOM.canvasSize };
    }
    this.parent = parent;
    this.children = widget.children.map((w) => new InflatedWidget(w, this));
  }

  get style() {
    return this.inflatedStyle;
  }

  inflate() {
    if (this.isInflated) {
      return;
    }
    this.isInflated = true;
    const style = this.inflatedStyle;
    const styleKeys = Object.keys(style);
    styleKeys.forEach((key) => {
      const v = style[key];

      // 1. handle inheritted styles
      if (v === "inherit") {
        let topParent: InflatedWidget | null = this.parent;
        // let val =
        let depth = 0;
        while (topParent && topParent.inflatedStyle[key] === "inherit") {
          depth++;
          topParent = topParent.parent;
        }
        if (!topParent) {
          error("topParent is null", {
            key,
            v,
            id: this.id,
            depth,
          });
        }
        const usableValue = topParent.inflatedStyle[key];
        // if (topParent.id !== "root") {
        //   console.log({
        //     key,
        //     topParent: topParent.id,
        //     usableValue,
        //     v,
        //     id: this.id,
        //     depth,
        //   });
        // }

        style[key] = usableValue;
      }
    });

    // 3. finally, convert to global renderable pixel system
  }

  get relativeSibilings(): {
    left: InflatedWidget[];
    right: InflatedWidget[];
    top: InflatedWidget[];
    bottom: InflatedWidget[];
  } {
    if (!this.parent) {
      return {
        left: [],
        right: [],
        top: [],
        bottom: [],
      };
    }
    const myIndex = this.parent.children.indexOf(this) ?? -1;
    if (myIndex === -1) {
      error("Parent not contains me", { ...this });
      // return {
      //   left: [],
      //   right: [],
      //   top: [],
      //   bottom: [],
      // };
    }
    const hasHor =
      this.parent.inflatedStyle.display === "flex" &&
      this.parent.inflatedStyle.flexDirection === "row";
    const hasVer = !hasHor;
    const relativeSibilings = this.parent.children.filter(
      (iw) => iw.inflatedStyle.position === "relative"
    );
    const beforeMe = relativeSibilings.slice(0, myIndex) ?? [];
    const afterMe = relativeSibilings.slice(myIndex + 1) ?? [];
    return {
      left: hasHor ? beforeMe : [],
      right: hasHor ? afterMe : [],
      top: hasVer ? beforeMe : [],
      bottom: hasVer ? afterMe : [],
    };
  }

  renderData(ctx: CanvasRenderingContext2D): RenderableSize & RenderableCoord {
    return {
      ...this.globalSize(ctx),
      ...this.globalCoord(ctx),
    };
  }

  globalSize(ctx: CanvasRenderingContext2D): RenderableSize {
    if (this._globalSize) {
      return this._globalSize;
    }
    /////////////////////////////////////////////////////////////
    // padding & margin
    const screenWidth = VDOM.canvasSize.width;
    const screenHeight = VDOM.canvasSize.height;
    const s = this.inflatedStyle;
    // 2-1. padding
    const padding = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      ...helpers.parsePaddingAndMargin(s.padding),
    };
    padding.left = s.paddingLeft ?? padding.left;
    padding.right = s.paddingRight ?? padding.right;
    padding.top = s.paddingTop ?? padding.top;
    padding.bottom = s.paddingBottom ?? padding.bottom;
    const paddingVer = padding.top + padding.bottom;
    const paddingHor = padding.left + padding.right;

    // 2-2. margin
    const margin = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      ...helpers.parsePaddingAndMargin(s.margin),
    };
    margin.left = s.marginLeft ?? margin.left;
    margin.right = s.marginRight ?? margin.right;
    margin.top = s.marginTop ?? margin.top;
    margin.bottom = s.marginBottom ?? margin.bottom;
    const marginVer = margin.top + margin.bottom;
    const marginHor = margin.left + margin.right;

    /////////////////////////////////////////////////////////////
    // necessaries
    const { position, display } = s;

    const relativeChildren = this.children.filter(
      (iw) => iw.inflatedStyle.position === "relative"
    );
    const childrenFlexTotal = relativeChildren.reduce((acc, w) => {
      return w.inflatedStyle.flex ?? 1;
    }, 0);
    const fixedWidth = notNullish(s.size?.width);
    const fixedHeight = notNullish(s.size?.height);

    const getParentSize = () =>
      position === "global" ? VDOM.canvasSize : this.parent.globalSize(ctx);
    const getFixedWidth = () => {
      let width = parseIfPixel(s.size.width as string);
      if (isNullish(width)) {
        // ratio or percent or combo
        width = parsePx(getParentSize().innerWidth, s.size.width);
      }
      return width;
    };
    const getFixedHeight = () => {
      let height = parseIfPixel(s.size.height as string);
      if (isNullish(height)) {
        // ratio or percent or combo
        height = parsePx(getParentSize().innerHeight, s.size.height);
      }
      return height;
    };

    const isParentFlex =
      this.parent.style.display === "flex" &&
      this.parent.style.flexDirection === "row";
    const myFlexRatio = s.flex;
    const hasFlexRatio = notNullish(myFlexRatio);
    const getMyFlexWidth = () => {
      //assume isParentFlex && hasFlexRatio
      const fixedWidthSibilings = this.parent.children.filter(
        (w) =>
          w.style.position === "relative" && w.style.size?.width !== undefined
      );
      const sumOfFixedWidthSibilings = fixedWidthSibilings.reduce(
        (acc, w) => acc + parsePx(parentWidth, w.style.size.width),
        0
      );
      const { innerWidth: parentWidth, childrenFlexTotal: sibilingsFlexTotal } =
        getParentSize();
      const widthLeftForFlex = parentWidth - sumOfFixedWidthSibilings;

      // console.log({ id: this.id, widthLeftForFlex });
      const retval = (widthLeftForFlex * myFlexRatio) / sibilingsFlexTotal;
      console.log("myFlexWidth of ", this.id, { retval });
      return retval;
    };

    /////////////////////////////////////////////////////////////
    // build texts
    let texts: RenderableText[] = [];
    let maxTextWidth = 0;
    // calc only if text exists and length > 0
    if (this._widget.text?.length > 0) {
      if (fixedWidth || (isParentFlex && hasFlexRatio)) {
        const width =
          isParentFlex && hasFlexRatio ? getMyFlexWidth() : getFixedWidth();
        texts = helpers.createTextSegments(
          ctx,
          this._widget.text,
          width - paddingHor,
          s
        );
        maxTextWidth = texts.reduce((acc, t) => {
          return Math.max(acc, t.width);
        }, 0);
      } else {
        //grows
        ctx.save();
        ctx.font = `${s.fontSize}px ${s.font}`;
        const textWidth = ctx.measureText(this._widget.text).width;
        texts.push({
          index: 0,
          text: this._widget.text,
          width: textWidth,
          yOffset: 0,
        });
        maxTextWidth = textWidth;
        ctx.restore();
      }
    }
    const totalTextHeight = texts.length * (s.lineHeight as number);
    const getRelChildrenHeightTotal = () => {
      return relativeChildren.reduce((total, iw) => {
        return total + iw.globalSize(ctx).heightTotal;
      }, 0);
    };

    const width =
      isParentFlex && hasFlexRatio
        ? getMyFlexWidth()
        : fixedWidth
        ? getFixedWidth()
        : maxTextWidth + paddingHor;
    const height = fixedHeight
      ? getFixedHeight()
      : totalTextHeight + getRelChildrenHeightTotal() + paddingVer;

    this._globalSize = {
      innerWidth: width - paddingHor,
      width,
      widthTotal: width + margin.left + margin.right,
      innerHeight: height - paddingVer,
      height,
      heightTotal: height + margin.top + margin.bottom,
      padding,
      margin,
      childrenFlexTotal,
      texts,
      maxTextWidth,
      totalTextHeight,
    };

    return this._globalSize;
  }

  globalCoord(ctx: CanvasRenderingContext2D): RenderableCoord {
    // 2. handle parent derived properties
    // ex) relative size
    if (this._globalCoord) {
      return this._globalCoord;
    }
    const size = this.globalSize(ctx);
    const {
      width,
      height,
      padding,
      margin,
      childrenFlexTotal,
      texts,
      maxTextWidth,
    } = size;
    const s = this.style;
    const { display, position } = s;
    const { width: canvasWidth, height: canvasHeight } =
      VDOM.canvasObserver.size;

    // const screenWidth = clientWidth();
    // const screenHeight = clientHeight();
    const isRelative = position === "relative";
    const isGlobal = position === "global";
    const isAbsolute = position === "absolute";

    // case 1. global
    const isBlock = display === "block";
    const isFlex = display === "flex";
    const topSibilingsHeight = this.relativeSibilings.top.reduce((acc, w) => {
      return acc + w.globalSize(ctx).heightTotal;
    }, 0);

    if (this.id === "w1") {
      // debugger;
    }
    const inRight = notNullish(s.size?.right) && (isGlobal || isAbsolute);
    const inBottom = notNullish(s.size?.bottom) && (isGlobal || isAbsolute);
    // const inTop = notNullish(s.size?.top) && s.verAlign === "top";
    // const inLeft = notNullish(s.size?.left) && s.horAlign === "left";
    const inLeft = !inRight;
    const inTop = !inBottom;
    const ps = this.parent.globalSize(ctx);
    const pc = this.parent.globalCoord(ctx);
    const parseHor = (length: string | number) => {
      const { innerWidth } = ps;
      return parsePx(innerWidth, length);
    };
    const parseVer = (length: string | number) => {
      const { innerHeight } = ps;
      return parsePx(innerHeight, length);
    };
    if (this.id === "w3") {
      console.log({ inRight, canvasWidth });
    }
    const parentLeft = pc.x + ps.padding.left;
    const parentTop =
      pc.y + ps.padding.top + ps.totalTextHeight + topSibilingsHeight;
    const parentRight = pc.right - ps.padding.right;
    const parentBottom = pc.bottom - ps.padding.bottom;
    const x = inLeft
      ? (isGlobal ? 0 : parentLeft) +
        (isRelative ? 0 : parseHor(s.size?.left ?? 0)) +
        margin.left
      : inRight
      ? (isGlobal ? canvasWidth : parentRight) -
        parseHor(s.size.right) -
        width -
        margin.right
      : undefined;
    const y = inTop
      ? (isGlobal ? 0 : parentTop) +
        (isRelative ? 0 : parseVer(s.size?.top ?? 0)) +
        margin.top
      : inBottom
      ? (isGlobal ? canvasHeight : parentBottom) -
        parseVer(s.size.bottom) -
        height -
        margin.bottom
      : undefined;

    //verifies
    const verifies = true;
    if (verifies) {
      if (!inLeft && !inRight) {
        error("inLeft && inRight are both false", {
          id: this.id,
          inLeft,
          inRight,
          s,
        });
      }
      if (!inTop && !inBottom) {
        error("inTop && inBottom are both false", {
          id: this.id,
          inTop,
          inBottom,
          s,
        });
      }
      if (isNullish(x)) {
        error("x is undefined", {
          id: this.id,
          inLeft,
          inRight,
          s,
        });
      }
      if (isNullish(y)) {
        error("y is undefined", {
          id: this.id,
          inTop,
          inBottom,
          s,
        });
      }
    }

    // const widthTotal = width + margin.left + margin.right;
    // const heightTotal = height + margin.top + margin.bottom;

    this._globalCoord = {
      x, // margin.left + left
      y, // margin.top + top
      right: x + width,
      bottom: y + height,
    };
    return this._globalCoord;
  }
  speakGlobalSize() {
    console.log(`Global size of [${this.id}]`, { ...this._globalCoord });
  }
}

export default class VDOM {
  _root: Widget = getRootWidget();
  _inflatedRoot: InflatedWidget;
  isInflated = false;
  static canvas: HTMLCanvasElement;
  static canvasObserver: CanvasObserver;
  static get canvasCoord(): RenderableCoord {
    return VDOM.canvasObserver.coord;
  }
  static get canvasSize(): RenderableSize {
    return VDOM.canvasObserver.size;
  }

  // used to calc text size
  static _canvasBuffer: HTMLCanvasElement = null;
  static get ctx() {
    return VDOM.canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  constructor(canvas: HTMLCanvasElement) {
    VDOM.canvas = canvas;
    VDOM.canvasObserver = new CanvasObserver(canvas);
    VDOM._canvasBuffer = canvas;
    this._inflatedRoot = new InflatedWidget(this._root);
  }
  inflate() {
    Tree.iterate(this._inflatedRoot, (w) => w.inflate(), "DFS_ParentFirst");
    // this.inputStyle.this.isInflated = true;
  }
  prepareRender() {
    //update inflated root
    this._inflatedRoot = new InflatedWidget(this._root);
    this.inflate();
    Tree.iterate(
      this._inflatedRoot,
      (w) => w.globalSize(VDOM.ctx),
      "DFS_ParentFirst"
    );
  }

  resize() {
    VDOM.canvasObserver.resize(VDOM.canvas);
  }
}

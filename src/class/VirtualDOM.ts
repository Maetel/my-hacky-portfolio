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
import Widget, { RootWidget, getRootWidget } from "../components/Widget";
import WidgetStyle, { DefaultStyle } from "../components/WidgetStyle";
import Tree from "@/class/Tree";
import error from "@/class/IError";
import * as C from "@/constants";
import {
  FourWayPixels,
  EmptyFourWayPixels,
  RenderableSize,
  RenderableText,
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
};

export class InflatedWidget {
  parent: InflatedWidget | null;
  children: InflatedWidget[];
  _widget: Widget;
  inflatedStyle: WidgetStyle;
  id: string;
  isInflated: boolean = false;
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
    if (this.id === "w1") {
      console.log("w1 style : ", { ...widget.style });
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

  get sibilings(): {
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
      return {
        left: [],
        right: [],
        top: [],
        bottom: [],
      };
    }
    const hasHor =
      this.parent.inflatedStyle.display === "flex" &&
      this.parent.inflatedStyle.flexDirection === "row";
    const hasVer = !hasHor;
    const beforeMe = this.parent.children.slice(0, myIndex) ?? [];
    const afterMe = this.parent.children.slice(myIndex + 1) ?? [];
    return {
      left: hasHor ? beforeMe : [],
      right: hasHor ? afterMe : [],
      top: hasVer ? beforeMe : [],
      bottom: hasVer ? afterMe : [],
    };
  }

  globalSize(ctx: CanvasRenderingContext2D): RenderableSize {
    // 2. handle parent derived properties
    // ex) relative size
    if (this._globalSize) {
      return this._globalSize;
    }

    // const screenWidth = clientWidth();
    // const screenHeight = clientHeight();
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

    // necessaries
    const { position, display } = s;
    const sibilings = this.sibilings;
    const relativeChildren = this.children.filter(
      (iw) => iw.inflatedStyle.position === "relative"
    );
    const childrenFlexTotal = relativeChildren.reduce((acc, w) => {
      return w.inflatedStyle.flex ?? 1;
    }, 0);
    const fixedWidth = notNullish(s.size.width);
    const fixedHeight = notNullish(s.size.height);
    const getRelChildrenWidthTotal = () => {
      return relativeChildren.reduce((total, iw) => {
        return total + iw.globalSize(ctx).widthTotal;
      }, 0);
    };
    const getRelChildrenHeightTotal = () => {
      return relativeChildren.reduce((total, iw) => {
        return total + iw.globalSize(ctx).heightTotal;
      }, 0);
    };
    const createTextSegments = (
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
      console.log(this.id, "fontCombo : ", fontCombo);
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
    };
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

    // build texts
    let texts: RenderableText[] = [];
    let maxTextWidth = 0;
    // calc only if text exists and length > 0
    if (this._widget.text?.length > 0) {
      if (fixedWidth) {
        const width = getFixedWidth();
        texts = createTextSegments(
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
    const textHeightTotal = texts.length * (s.lineHeight as number);

    // case 1. global
    const isBlock = display === "block";
    const isFlex = display === "flex";
    if (position === "global") {
      if (isBlock) {
        const width = fixedWidth
          ? getFixedWidth()
          : maxTextWidth + getRelChildrenWidthTotal() + paddingHor;
        console.log({
          width,
          maxTextWidth,
          relChild: getRelChildrenWidthTotal(),
        });
        const height = fixedHeight
          ? getFixedHeight()
          : textHeightTotal + getRelChildrenHeightTotal() + paddingVer;
        const inLeft = notNullish(s.size.left) && s.horAlign === "left";
        const inRight = notNullish(s.size.right) && s.horAlign === "right";
        const inTop = notNullish(s.size.top) && s.verAlign === "top";
        const inBottom = notNullish(s.size.bottom) && s.verAlign === "bottom";

        const x = inLeft
          ? parsePx(screenWidth, s.size.left) + margin.left
          : inRight
          ? screenWidth -
            parsePx(screenWidth, s.size.right) -
            width -
            margin.right
          : undefined;
        const y = inTop
          ? parsePx(screenHeight, s.size.top) + margin.top
          : inBottom
          ? screenHeight -
            parsePx(screenHeight, s.size.bottom) -
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

        this._globalSize = {
          x, // margin.left + left
          y, // margin.top + top
          right: x + width,
          bottom: y + height,
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
        };
        if (this.id === "w1") {
          this.speakGlobalSize();
        }
        return this._globalSize;
      }
      if (isFlex) {
        error("Flex not implemented");
      }
    }

    // case 2. relative
    if (position === "relative") {
      if (isBlock) {
        const width =
          (fixedWidth
            ? parsePx(screenWidth, s.size.width)
            : maxTextWidth + getRelChildrenWidthTotal()) + paddingHor;
        const height =
          (fixedHeight
            ? parsePx(screenHeight, s.size.height)
            : textHeightTotal + getRelChildrenHeightTotal()) + paddingVer;
        const inLeft = notNullish(s.size.left) && s.horAlign === "left";
        const inRight = notNullish(s.size.right) && s.horAlign === "right";
        const inTop = notNullish(s.size.top) && s.verAlign === "top";
        const inBottom = notNullish(s.size.bottom) && s.verAlign === "bottom";

        const x = inLeft
          ? parsePx(screenWidth, s.size.left) + margin.left
          : inRight
          ? screenWidth -
            parsePx(screenWidth, s.size.right) -
            width -
            margin.right
          : undefined;
        const y = inTop
          ? parsePx(screenHeight, s.size.top) + margin.top
          : inBottom
          ? screenHeight -
            parsePx(screenHeight, s.size.bottom) -
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

        this._globalSize = {
          x, // margin.left + left
          y, // margin.top + top
          right: x + width,
          bottom: y + height,
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
        };
        return this._globalSize;
      }
      if (isFlex) {
        error("Flex not implemented");
      }
    }

    // case 2. relative
    if (position === "absolute") {
      if (isBlock) {
        const textWidth = ctx.measureText(this._widget.text).width;
        const width =
          (fixedWidth
            ? getRelChildrenWidthTotal()
            : parsePx(screenWidth, s.size.width)) + paddingHor;
        const height =
          (fixedHeight
            ? getRelChildrenHeightTotal()
            : parsePx(screenHeight, s.size.height)) + paddingVer;
        const inLeft = notNullish(s.size.left) && s.horAlign === "left";
        const inRight = notNullish(s.size.right) && s.horAlign === "right";
        const inTop = notNullish(s.size.top) && s.verAlign === "top";
        const inBottom = notNullish(s.size.bottom) && s.verAlign === "bottom";

        const x = inLeft
          ? parsePx(screenWidth, s.size.left)
          : inRight
          ? screenWidth - parsePx(screenWidth, s.size.right) - width
          : undefined;
        const y = inTop
          ? parsePx(screenHeight, s.size.top)
          : inBottom
          ? screenHeight - parsePx(screenHeight, s.size.bottom) - height
          : undefined;

        this._globalSize = {
          x,
          y,
          width,
          widthTotal: width + margin.left + margin.right,
          height,
          heightTotal: height + margin.top + margin.bottom,
          padding,
          margin,
          childrenFlexTotal,
        };
        return this._globalSize;
      }
      if (isFlex) {
        error("Flex not implemented");
      }
    }

    const width = 0;
    const height = 0;
    this._globalSize = {
      x: 0,
      y: 0,
      width: 0,
      widthTotal:
        width + padding.left + padding.right + margin.left + margin.right,
      height: 0,
      heightTotal:
        height + padding.top + padding.bottom + margin.top + margin.bottom,
      padding,
      margin,
      childrenFlexTotal,
    };
  }
  speakGlobalSize() {
    console.log(`Global size of [${this.id}]`, { ...this._globalSize });
  }
}

export default class VDOM {
  _root: Widget = getRootWidget();
  _inflatedRoot: InflatedWidget;
  isInflated = false;
  static canvas: HTMLCanvasElement;
  static canvasObserver: CanvasObserver;
  static get canvasSize(): RenderableSize {
    return VDOM.canvasObserver.size;
  }

  // used to calc text size
  static _canvasBuffer: HTMLCanvasElement = null;
  static get ctx() {
    return VDOM.canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  constructor(canvas: HTMLCanvasElement) {
    this._inflatedRoot = new InflatedWidget(this._root);
    VDOM.canvas = canvas;
    VDOM.canvasObserver = new CanvasObserver(canvas);
    VDOM._canvasBuffer = canvas;
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

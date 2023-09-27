import { Area, AreaInputSize } from "./Area";
import WidgetStyle from "./WidgetStyle";
import TimerJob from "./TimerJob";
import WidgetState from "@/class/WidgetState";
import error from "@/class/IError";
import Store from "@/class/Store";
import { parsePx } from "@/utils";
import * as C from "@/constants";

export const DefaultStatelessWidgetStyle: WidgetStyle = {
  horAlign: "left",
  verAlign: "top",
  position: "relative",
  display: "block",
  visible: true,
  cursor: "default",
  opacity: 1,
  backgroundColor: "transparent",
  font: "Arial",
  fontStyle: "normal",
  fontWeight: 400,
  fontSize: 16,
  textAlign: "left",
  color: "black",
};

export type WidgetCallback = (stls: StatelessWidget) => any;
export type OnDestoryWithoutCleanup = WidgetCallback;
export type OnDestoryWithCleanup = (
  stls: StatelessWidget,
  cleanUp: () => any
) => any;
export type OnCreate = WidgetCallback;
export interface StatelessWidgetOption {
  parent?: StatelessWidget;
  style?: WidgetStyle;
  id?: string;
  copiedFrom?: StatelessWidget;
  callbacks?: WidgetCallbacks;
  text?: string;
}

export type WidgetCallbacks = {
  onClick?: WidgetCallback;
  onBeforeCreate?: WidgetCallback;
  onAfterCreate?: WidgetCallback;
  onDestroy?: WidgetCallback;
  onDestroyWithCleanup?: OnDestoryWithCleanup;
};

export default class StatelessWidget extends Area {
  addOrder: number;
  _speak: string[] = [];
  copiedFrom?: StatelessWidget;
  id: string;
  parent: StatelessWidget | null = null;
  children: StatelessWidget[] = [];
  _style: WidgetStyle;
  timerJob?: TimerJob;
  inputOption?: StatelessWidgetOption;
  _callbacks: WidgetCallbacks;
  text?: string;

  setSpeak(id: string) {
    this._speak = this._speak.concat(id);
  }
  speak(id: string, ...args) {
    if (this._speak.includes(id)) {
      console.log(`[${this.id} - ${id}]`, ...args);
    }
  }

  getTextSegments(ctx: CanvasRenderingContext2D) {
    const prevFont = ctx.font;
    const fontSize = this.style.fontSize ?? C.System.fontSize;
    const font = this.style.font ?? C.System.font;
    ctx.font = `${fontSize}px ${font}`;

    const totalText = this.text ?? "";
    const maxWidth =
      this.width ??
      (this.parent?.width
        ? this.parent.width -
          this.parent.innerPaddingL -
          this.parent.innerPaddingR
        : this.screenWidth);
    const segments = [];
    let segment = "";
    const textWritableWidth =
      maxWidth - this.innerPaddingL - this.innerPaddingR;
    for (let i = 0; i < totalText.length; i++) {
      // this.speak("getTextHeight", { i, char: totalText[i] });
      if (totalText[i] === "\n") {
        segments.push(segment);
        segment = "";
        continue;
      }
      segment += totalText[i];
      const textWidth = ctx.measureText(segment).width;
      if (textWidth > textWritableWidth) {
        segments.push(segment);
        segment = "";
      }
    }
    if (segment.length > 0) {
      segments.push(segment);
    }
    ctx.font = prevFont;
    return segments;
  }

  constructor(option?: StatelessWidgetOption) {
    const { parent, style: inputStyle, id, copiedFrom } = option;
    const style = {
      ...DefaultStatelessWidgetStyle,
      ...(inputStyle ? { ...inputStyle } : {}),
    };
    const size = {
      left: 0,
      top: 0,
      width: 1,
      height: 0,
      right: undefined,
      bottom: undefined,
      ...(inputStyle?.size ? { ...inputStyle?.size } : {}),
    };
    //@ts-ignore
    style.size = size;

    const verAlign = style?.verAlign ?? (style?.size?.top ? "top" : "bottom");
    const horAlign = style?.horAlign ?? (style?.size?.left ? "left" : "right");
    super(parent, style.size, verAlign, horAlign);

    this.addOrder = Store.getNewWidgetAddOrder();
    this.text = option?.text ?? null;
    this.inputOption = option;
    this.parent = parent;
    this._callbacks = { ...(option?.callbacks ?? {}) };
    // console.log({ pcl: parent?.children.length, ao: this.addOrder });
    this.id =
      id ??
      `${parent?.id ?? "stls"}-${parent?.children.length ?? this.addOrder}`;
    this.copiedFrom = copiedFrom;
    this._style = { ...style };
    parent?.addChild(this);
    option?.callbacks?.onBeforeCreate?.(this);
    Store.onStatelessWidgetCreate(this);
    option?.callbacks?.onAfterCreate?.(this);
    console.log("Created : ", this.id);
  }
  buildOption() {
    return {
      ...this.inputOption,
      id: this.id,
      style: { ...this._style },
      parent: this.parent,
      copiedFrom: this.copiedFrom,
      children: [...this.children],
    };
  }
  animate(
    ms: number,
    start: (w: StatelessWidget) => any,
    cleanup?: (w: StatelessWidget) => any
  ) {
    if (cleanup) {
      this.timerJob = new TimerJob();
      this.timerJob.timeout(ms, () => {
        cleanup(this);
      });
    }
    start(this);
  }

  get depth(): number {
    let retval = 0;
    let parent = this.parent;
    while (parent) {
      retval++;
      parent = parent.parent;
    }
    return retval;
  }

  get state(): WidgetState | null {
    return null;
  }
  set state(state: WidgetState | null) {
    error("StatelessWidget cannot have state : ", { state });
  }

  get style(): WidgetStyle {
    return this._style;
  }

  set style(style: WidgetStyle) {
    this._style = { ...this._style, ...style };
    const size = { ...this._style.size };
    this.setSize(size, this._style.verAlign, this._style.horAlign);
  }

  //@override
  copied(id?: string): StatelessWidget {
    const retval = new StatelessWidget({
      ...this.buildOption(),
      id: id ?? `${this.id}-copy`,
      copiedFrom: this,
    });
    return retval;
  }

  addChild(child: StatelessWidget) {
    child.parent = this;
    this.children.push(child);
    console.log("Added child : ", child.id);
    Store.sortWidgets();
    return this;
  }

  addChildren(...children: StatelessWidget[]) {
    children.forEach(this.addChild.bind(this));
  }

  async deleteChild(child: StatelessWidget) {
    if (!this.children.some((c) => c.id === child.id)) {
      error("Cannot find child : ", { child });
    }
    return child.delete();
  }

  async deleteAllChildren() {
    return Promise.all(this.children.map((c) => c.delete()));
  }

  async delete() {
    return new Promise(async (resolve) => {
      return this.deleteAllChildren().then(() => {
        if (this._callbacks.onDestroyWithCleanup) {
          this._callbacks.onDestroyWithCleanup(this, () => {
            Store.removeWidgetFromList(this);
            if (this.parent) {
              this.parent.children = this.parent.children.filter(
                (c) => c.id !== this.id
              );
            }
            resolve(this);
          });
          return;
        }
        if (this._callbacks.onDestroy) {
          this._callbacks.onDestroy(this);
        }
        Store.removeWidgetFromList(this);
        if (this.parent) {
          this.parent.children = this.parent.children.filter(
            (c) => c.id !== this.id
          );
        }
        resolve(this);
      });
    });
  }

  set callbacks(callbacks: WidgetCallbacks) {
    this._callbacks = callbacks;
  }

  appendCallbacks(callbacks: WidgetCallbacks) {
    this._callbacks = { ...this._callbacks, ...callbacks };
  }

  set onClick(callback: WidgetCallback) {
    this._callbacks.onClick = callback;
  }

  get onClick() {
    return this._callbacks.onClick;
  }

  set onBeforeCreate(callback: WidgetCallback) {
    this._callbacks.onBeforeCreate = callback;
  }

  get onBeforeCreate() {
    return this._callbacks.onBeforeCreate;
  }

  set onAfterCreate(callback: WidgetCallback) {
    this._callbacks.onAfterCreate = callback;
  }

  get onAfterCreate() {
    return this._callbacks.onAfterCreate;
  }

  set onDestroy(callback: WidgetCallback) {
    this._callbacks.onDestroy = callback;
  }

  get onDestroy() {
    return this._callbacks.onDestroy;
  }

  set onDestroyWithCleanup(callback: OnDestoryWithCleanup) {
    this._callbacks.onDestroyWithCleanup = callback;
  }

  get onDestroyWithCleanup() {
    return this._callbacks.onDestroyWithCleanup;
  }

  private get innerPaddingStrings(): null | string[] {
    if (!this._style.padding) {
      return null;
    }
    const p = this._style.padding;
    const values = p
      .trim()
      .split(" ")
      .filter((v) => v !== "");
    if (values.length === 0) {
      return null;
    }
    return values;
  }

  get sibilings(): {
    left: StatelessWidget[];
    right: StatelessWidget[];
    top: StatelessWidget[];
    bottom: StatelessWidget[];
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
      this.parent.style.display === "flex" &&
      this.parent.style.flexDirection === "row";
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

  get innerPadding(): {
    left: number;
    right: number;
    top: number;
    bottom: number;
  } {
    if (!this._style.padding) {
      return {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      };
    }

    const values = this.innerPaddingStrings;
    // this.speak("innerPadding", { innerPaddingStrings: values });
    if (!values) {
      return {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      };
    }
    const len = values.length;
    if (len === 1) {
      const v = values[0];
      const hor = parsePx(this.inputWidth, v);
      const ver = parsePx(this.inputHeight, v);
      // console.log("hor, ver : ", hor, ver);
      return {
        left: hor,
        right: hor,
        top: ver,
        bottom: ver,
      };
    }

    if (len === 2) {
      const hor = parsePx(this.inputWidth, values[1]);
      const ver = parsePx(this.inputHeight, values[0]);
      return {
        left: hor,
        right: hor,
        top: ver,
        bottom: ver,
      };
    }

    if (len === 3) {
      const top = parsePx(this.inputHeight, values[0]);
      const hor = parsePx(this.inputWidth, values[1]);
      const bottom = parsePx(this.inputHeight, values[2]);
      return {
        left: hor,
        right: hor,
        top: top,
        bottom: bottom,
      };
    }

    if (len === 4) {
      const top = parsePx(this.inputHeight, values[0]);
      this.speak("innerPadding()", { top });
      const right = parsePx(this.inputWidth, values[1]);
      const bottom = parsePx(this.inputHeight, values[2]);
      const left = parsePx(this.inputWidth, values[3]);
      return {
        left: left,
        right: right,
        top: top,
        bottom: bottom,
      };
    }

    error("Failed to parse padding : ", {
      padding: this._style.padding,
      widgetId: this.id,
    });
  }

  get innerPaddingL(): number {
    return this.innerPadding.left;
  }

  get innerPaddingR(): number {
    return this.innerPadding.right;
  }

  get innerPaddingT(): number {
    return this.innerPadding.top;
  }

  get innerPaddingB(): number {
    return this.innerPadding.bottom;
  }

  paddingL(): number {
    if (!this.parent) {
      return 0;
    }
    const absoluteL = this.parent?.left ?? 0;
    if (this._style.position === "absolute") {
      return absoluteL;
    }
    // position === "relative"
    // let relativeL = absoluteL + this.innerPadding.left;
    let relativeL =
      absoluteL + (this.parent?.innerPaddingL ?? 0) + this.innerPaddingL;
    // this.speak("paddingL", {
    //   relativeL,
    //   absoluteL,
    //   parentInnerPaddingL: this.parent?.innerPaddingL ?? 0,
    //   innerPaddingL: this.innerPaddingL,
    // });
    // console.log({
    //   relativeL,
    //   absoluteL,
    //   parentInnerPaddingL: this.parent?.innerPaddingL,
    //   innerPaddingL: this.innerPaddingL,
    // });

    const myIndex = this.parent?.children.findIndex((c) => c.id === this.id);
    const beforeMe = this.parent?.children.slice(0, myIndex);
    if (
      beforeMe?.length > 0 &&
      this._style.display === "flex" &&
      this._style.flexDirection === "row"
    ) {
      const sumOfWidth = beforeMe?.reduce((acc, cur) => acc + cur.width, 0);
      relativeL += sumOfWidth;
    }
    return relativeL;
  }
  paddingR(): number {
    if (!this.parent || this._style.position === "global") {
      return this.screenWidth;
    }
    const absoluteR = this.parent?.right ?? 0;
    if (this._style.position === "absolute") {
      return absoluteR;
    }
    // position === "relative"
    let relativeR =
      absoluteR - (this.parent?.innerPaddingR ?? 0) - this.innerPaddingR;

    const myIndex = this.parent?.children.findIndex((c) => c.id === this.id);
    const afterMe = this.parent?.children.slice(myIndex + 1);
    if (
      afterMe?.length > 0 &&
      this._style.display === "flex" &&
      this._style.flexDirection === "row"
    ) {
      const sumOfWidth = afterMe?.reduce((acc, cur) => acc + cur.width, 0);
      relativeR -= sumOfWidth;
    }
    return relativeR;
  }
  paddingT(): number {
    if (!this.parent || this._style.position === "global") {
      return 0;
    }
    const absoluteT = this.parent?.top ?? 0;
    if (this._style.position === "absolute") {
      return absoluteT;
    }
    // position === "relative"
    let relativeT =
      absoluteT + (this.parent?.innerPaddingT ?? 0) + this.innerPaddingT;

    const myIndex = this.parent?.children.findIndex((c) => c.id === this.id);
    const aboveMe = this.parent?.children.slice(0, myIndex);
    if (
      aboveMe?.length > 0 &&
      (this._style.display === "block" ||
        (this._style.display === "flex" &&
          this._style.flexDirection === "column"))
    ) {
      const sumOfHeight = aboveMe?.reduce(
        (acc, cur) => acc + cur.bottomRelative,
        0
      );
      this.speak("paddingT", { sumOfHeight, topper: aboveMe[0] });
      relativeT += sumOfHeight;
    }

    return relativeT;
  }
  paddingB(): number {
    if (!this.parent || this._style.position === "global") {
      return this.screenHeight;
    }
    const absoluteB = this.parent?.bottom ?? 0;
    if (this._style.position === "absolute") {
      return absoluteB;
    }
    // position === "relative"
    let relativeB =
      absoluteB - (this.parent?.innerPaddingB ?? 0) - this.innerPaddingB;

    const myIndex = this.parent?.children.findIndex((c) => c.id === this.id);
    const beneathMe = this.parent?.children.slice(myIndex + 1);
    if (
      beneathMe?.length > 0 &&
      (this._style.display === "block" ||
        (this._style.display === "flex" &&
          this._style.flexDirection === "column"))
    ) {
      const sumOfHeight = beneathMe?.reduce((acc, cur) => acc + cur.height, 0);
      relativeB -= sumOfHeight;
    }

    return relativeB;
  }
}

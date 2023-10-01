import { Area, AreaInputSize } from "./Area";
import WidgetStyle, { DefaultStyle } from "./WidgetStyle";
import TimerJob from "./TimerJob";
import WidgetState from "@/class/WidgetState";
import error from "@/class/IError";
import Store from "@/class/Store";
import { parsePx } from "@/utils";
import * as C from "@/constants";

export type WidgetCallback = (stls: Widget) => any;
export type OnDestoryWithoutCleanup = WidgetCallback;
export type OnDestoryWithCleanup = (stls: Widget, cleanUp: () => any) => any;
export type OnCreate = WidgetCallback;
export interface WidgetOption {
  parent?: Widget;
  style?: WidgetStyle;
  id?: string;
  copiedFrom?: Widget;
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

export default class Widget extends Area {
  addOrder: number;
  _speak: string[] = [];
  copiedFrom?: Widget;
  id: string;
  parent: Widget | null = null;
  children: Widget[] = [];
  _style: WidgetStyle;
  timerJob?: TimerJob;
  inputOption?: WidgetOption;
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

  constructor(option?: WidgetOption) {
    const { parent: inputParent, style: inputStyle, id, copiedFrom } = option;
    const parent =
      inputParent && option?.id !== "root" ? inputParent : RootWidget;
    const style = {
      ...DefaultStyle,
      ...(inputStyle ? { ...inputStyle } : {}),
    };
    if (option?.id === "w1") {
      console.log("w1 ctor, inputstyle : ", { ...style });
    }
    // const size = {
    //   left: 0,
    //   top: 0,
    //   width: 1,
    //   height: 0,
    //   right: undefined,
    //   bottom: undefined,
    //   ...(inputStyle?.size ? { ...inputStyle?.size } : {}),
    // };
    // //@ts-ignore
    // style.size = size;

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
    // Store.onStatelessWidgetCreate(this);
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
  animate(ms: number, start: (w: Widget) => any, cleanup?: (w: Widget) => any) {
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
  copied(id?: string): Widget {
    const retval = new Widget({
      ...this.buildOption(),
      id: id ?? `${this.id}-copy`,
      copiedFrom: this,
    });
    return retval;
  }

  addChild(child: Widget) {
    child.parent = this;
    this.children.push(child);
    console.log("Added child : ", child.id);
    // Store.sortWidgets();
    return this;
  }

  addChildren(...children: Widget[]) {
    children.forEach(this.addChild.bind(this));
    return this;
  }

  async deleteChild(child: Widget) {
    if (!this.children.some((c) => c.id === child.id)) {
      error("Cannot find child : ", { child });
    }
    return child.delete();
  }

  async deleteAllChildren() {
    return Promise.all(this.children.map((c) => c.delete()));
  }

  async delete() {
    console.log("Delete : ", this.id);
    return new Promise(async (resolve) => {
      return this.deleteAllChildren().then(() => {
        if (this._callbacks.onDestroyWithCleanup) {
          this._callbacks.onDestroyWithCleanup(this, () => {
            // Store.removeWidgetFromList(this);
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
        // Store.removeWidgetFromList(this);
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

  as<T extends Widget>() {
    return this as unknown as T;
  }

  // returns parent if found
  get parents(): Widget[] | null {
    let retval = [];
    let parent = this.parent;
    while (parent) {
      retval.push(parent);
      parent = parent.parent;
    }
    return retval.length > 0 ? retval : null;
  }
  childOf(id: string): Widget | null {
    return this.parents?.find((p) => p.id === id);
  }
}

var RootWidget = new Widget({
  style: {
    ...DefaultStyle,
    size: {
      left: 0,
      top: 0,
      width: 1,
      height: 1,
    },
    verAlign: "top",
    horAlign: "left",
    backgroundColor: "#b0b0b0",
    visible: true,
    zIndex: 0,
    cursor: "default",
    font: C.System.font,
    lineHeight: C.System.lineHeight,
    textAlign: "left",
    fontSize: C.System.fontSize,
    fontWeight: 400,
    fontStyle: "#000000",
    color: "#000000",
    position: "global",
  },
  parent: null,
  id: "root",
});

export var getRootWidget = () => RootWidget;

import { Area } from "./Area";
import WidgetStyle from "./WidgetStyle";
import TimerJob from "./TimerJob";
import WidgetState from "@/class/WidgetState";
import error from "@/class/IError";
import Store from "@/class/Store";

export const DefaultStatelessWidgetStyle: WidgetStyle = {
  position: "relative",
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
  copiedFrom?: StatelessWidget;
  id: string;
  parent: StatelessWidget | null = null;
  children: StatelessWidget[] = [];
  _style: WidgetStyle;
  timerJob?: TimerJob;
  inputOption?: StatelessWidgetOption;
  _callbacks: WidgetCallbacks;
  text?: string;
  constructor(option?: StatelessWidgetOption) {
    const { parent, style: inputStyle, id, copiedFrom } = option;
    const style = {
      ...DefaultStatelessWidgetStyle,
      ...(inputStyle ? { ...inputStyle } : {}),
    };
    const size = style?.size ?? {
      left: 0,
      top: 0,
      width: 1,
      height: 1,
      right: null,
      bottom: null,
    };
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
}

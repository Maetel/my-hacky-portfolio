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
  fontStyle: "normal",
  fontWeight: 400,
  fontSize: "16px",
  textAlign: "left",
  color: "black",
};

export type OnDestoryWithoutCleanup = (stls: StatelessWidget) => any;
export type OnDestoryWithCleanup = (
  stls: StatelessWidget,
  cleanUp: () => any
) => any;
export type OnCreate = (stls: StatelessWidget) => any;
export interface StatelessWidgetOption {
  parent?: StatelessWidget;
  style?: WidgetStyle;
  id?: string;
  copiedFrom?: StatelessWidget;
  onClick?: (stls: StatelessWidget) => any;
  onCreate?: OnCreate;
  onDestroy?: OnDestoryWithoutCleanup;
  onDestroyWithCleanup?: OnDestoryWithCleanup;
}

export default class StatelessWidget extends Area {
  addOrder: number;
  copiedFrom?: StatelessWidget;
  id: string;
  parent: StatelessWidget | null = null;
  children: StatelessWidget[] = [];
  _style: WidgetStyle;
  timerJob?: TimerJob;
  inputOption?: StatelessWidgetOption;
  constructor(option?: StatelessWidgetOption) {
    const { parent, style, id, copiedFrom } = option;
    const verAlign = style?.verAlign ?? (style?.size?.top ? "top" : "bottom");
    const horAlign = style?.horAlign ?? (style?.size?.left ? "left" : "right");
    super(parent, style?.size ?? "full", verAlign, horAlign);

    this.addOrder = Store.getNewWidgetAddOrder();
    this.inputOption = option;
    this.parent = parent;
    // console.log({ pcl: parent?.children.length, ao: this.addOrder });
    this.id =
      id ??
      `${parent?.id ?? "stls"}-${parent?.children.length ?? this.addOrder}`;
    this.copiedFrom = copiedFrom;
    this._style = {
      ...DefaultStatelessWidgetStyle,
      ...(style ? { ...style } : {}),
    };
    parent?.addChild(this);
    Store.onStatelessWidgetCreate(this);
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
        if (this.inputOption?.onDestroyWithCleanup) {
          this.inputOption.onDestroyWithCleanup(this, () => {
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
        if (this.inputOption?.onDestroy) {
          this.inputOption.onDestroy(this);
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
}

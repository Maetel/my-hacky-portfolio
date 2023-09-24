import { Area } from "./Area";
import WidgetStyle from "./WidgetStyle";
import TimerJob from "./TimerJob";
import WidgetState from "@/class/WidgetState";
import error from "@/class/IError";

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

export default class StatelessWidget extends Area {
  id: string;
  parent: StatelessWidget | null = null;
  children: StatelessWidget[] = [];
  _style: WidgetStyle;
  timerJob?: TimerJob;
  constructor(id: string, parent?: StatelessWidget, style?: WidgetStyle) {
    const verAlign = style?.verAlign ?? (style?.size?.top ? "top" : "bottom");
    const horAlign = style?.horAlign ?? (style?.size?.left ? "left" : "right");
    // console.log({ verAlign, horAlign });
    super(parent, style?.size ?? "full", verAlign, horAlign);
    if (parent) {
      parent.children.push(this);
    }
    this.parent = parent;
    this.id = id;
    this._style = {
      ...DefaultStatelessWidgetStyle,
      ...(style ? { ...style } : {}),
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
    const retval = new StatelessWidget(id ?? this.id, this.parent, {
      ...this._style,
    });
    return retval;
  }
}

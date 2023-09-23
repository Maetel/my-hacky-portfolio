import { Area, AreaInputSize } from "./Area";
import { Length } from "@/class/StyleLength";
import StyleLength from "@/class/StyleLength";
import WidgetManager from "./WidgetManager";
import WidgetStyle from "./WidgetStyle";
import TimerJob from "./TimerJob";
import WidgetState from "@/class/WidgetState";
import error from "@/class/IError";

export const DefaultStatelessWidgetStyle: WidgetStyle = {
  position: "absolute",
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
  parent?: StatelessWidget | null = null;
  children: StatelessWidget[] = [];
  _style: WidgetStyle;
  timerJob?: TimerJob;
  constructor(id: string, parent?: StatelessWidget, style?: WidgetStyle) {
    const defaultArea = () => {
      if (parent) {
        const { left, width, top, height } = parent.xywhRatio;
        return {
          left: new Length(left),
          width: new Length(width),
          top: new Length(top),
          height: new Length(height),
        };
      } else {
        return {
          top: new Length(0),
          left: new Length(0),
          width: new Length(0),
          height: new Length(0),
        };
      }
    };
    const inputArea = style?.size ?? defaultArea();
    const { clientHeight, clientWidth } = document.documentElement;

    super(clientWidth, clientHeight, inputArea);
    this.id = id;
    this.parent = parent;
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
    this._style = { ...style };
    this.left = style.size.left.length;
    this.top = style.size.top.length;
    this.width = style.size.width.length;
    this.height = style.size.height.length;
    // this.right = style.size.right.length;
    // this.bottom = style.size.bottom.length;
  }
}

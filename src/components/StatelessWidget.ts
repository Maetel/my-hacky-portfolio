import { Area, AreaInputSize } from "./Area";
import { Length } from "@/class/StyleLength";
import StyleLength from "@/class/StyleLength";
import WidgetManager from "./WidgetManager";
import WidgetStyle from "./WidgetStyle";

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
  style: WidgetStyle;
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
    const { innerWidth, innerHeight } = window;
    const hover = style?.hover
      ? {
          ...style,
          ...style.hover,
          hover: null,
          mouseDown: null,
          mouseUp: null,
        }
      : null;
    const mouseDown = style?.mouseDown
      ? {
          ...style,
          ...style.mouseDown,
          hover: null,
          mouseDown: null,
          mouseUp: null,
        }
      : null;
    const mouseUp = style?.mouseUp
      ? {
          ...style,
          ...style.mouseUp,
          hover: null,
          mouseDown: null,
          mouseUp: null,
        }
      : null;
    const updatedStyle = style ? { ...style, hover, mouseDown, mouseUp } : {};
    super(innerWidth, innerHeight, inputArea);
    this.id = id;
    this.parent = parent;
    this.style = {
      ...DefaultStatelessWidgetStyle,
      ...updatedStyle,
    };
    console.log({ updatedStyle });
    WidgetManager.push(this);
  }
}

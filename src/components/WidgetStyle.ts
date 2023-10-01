import error from "@/class/IError";
import { AreaInputSize } from "./Area";

export type Omittable = null | undefined;
export type Inherit = "inherit";

export const DefaultStyle: WidgetStyle = {
  // size: {
  //   width: 1,
  // },
  verAlign: "inherit",
  horAlign: "inherit",
  backgroundColor: "inherit",
  borderWidth: 0,
  borderRadius: 0,
  borderColor: "transparent",
  visible: "inherit",
  zIndex: "inherit",
  grabbable: false,
  position: "relative",
  padding: "0px",
  opacity: 1,
  cursor: "inherit",
  font: "inherit",
  lineHeight: "inherit",
  textAlign: "inherit",
  fontSize: "inherit",
  fontWeight: "inherit",
  fontStyle: "inherit",
  display: "block",
  flexDirection: null,
  hover: null,
  pointerDown: null,
  pointerUp: null,
  color: "inherit",
  margin: "0px",
  showScrollBar: false,
  overflowX: "grow",
  overflowY: "grow",
} as const;

export const spreadStyle = (style: WidgetStyle) => {
  const {
    size,
    verAlign,
    horAlign,
    backgroundColor,
    borderWidth,
    borderRadius,
    borderColor,
    visible,
    zIndex,
    grabbable,
    position,
    padding,
    opacity,
    cursor,
    font,
    lineHeight,
    textAlign,
    fontSize,
    fontWeight,
    fontStyle,
    display,
    flexDirection,

    // on action
    hover,
    pointerDown,
    pointerUp,

    // TODOS
    color,
    margin,
    showScrollBar,
    overflowX,
    overflowY,
  } = style;
};

export default interface WidgetStyle {
  size?: AreaInputSize;
  verAlign?: "top" | "center" | "bottom" | Inherit;
  horAlign?: "left" | "center" | "right" | Inherit;
  backgroundColor?: string | CanvasGradient | CanvasPattern | Inherit;
  borderWidth?: number | Inherit;
  borderRadius?: number | Inherit;
  borderColor?: string | CanvasGradient | CanvasPattern | Inherit;
  visible?: boolean | Inherit;
  zIndex?: number | Inherit;
  grabbable?: boolean;
  position?: "relative" | "absolute" | "global";
  padding?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  margin?: string;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginBottom?: number;
  opacity?: number | Inherit;
  cursor?:
    | "pointer"
    | "default"
    | "none"
    | "text"
    | "move"
    | "grab"
    | "grabbing"
    | "zoom-in"
    | "zoom-out"
    | Inherit;
  font?: string | Inherit;
  lineHeight?: number | Inherit;
  textAlign?: "left" | "center" | "right" | Inherit;
  fontSize?: number | Inherit; //px
  fontWeight?: number | Inherit;
  fontStyle?: string | Inherit;
  display?: "block" | "flex";
  flexDirection?: "row" | "column" | Omittable;
  flex?: number;

  // on action
  hover?: WidgetStyle | Omittable;
  pointerDown?: WidgetStyle | Omittable;
  pointerUp?: WidgetStyle | Omittable;

  // TODOS
  color?: string | Inherit;
  showScrollBar?: boolean;
  overflowX?: "grow" | "hidden" | "scroll";
  overflowY?: "grow" | "hidden" | "scroll";
}

export const background = (
  color: string | CanvasGradient | CanvasPattern,
  alpha?: number
) => {
  if (typeof color === "string" && color.startsWith("#")) {
    if (color.length === 7) {
      // convert hex to decimal r,g,b
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const a = alpha ?? 1;
      return `rgba(${r},${g},${b},${a})`;
    }
    if (color.length === 9) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const a = alpha ?? parseInt(color.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${a})`;
    }
  }
  return color;
};

import error from "@/class/IError";
import { AreaInputSize } from "./Area";

export default interface WidgetStyle {
  size?: AreaInputSize;
  verAlign?: "top" | "center" | "bottom";
  horAlign?: "left" | "center" | "right";
  backgroundColor?: string | CanvasGradient | CanvasPattern;
  borderWidth?: number;
  borderRadius?: number;
  borderColor?: string | CanvasGradient | CanvasPattern;
  visible?: boolean;
  zIndex?: number;
  grabbable?: boolean;
  position?: "relative" | "global";
  opacity?: number;
  hover?: WidgetStyle;
  pointerDown?: WidgetStyle;
  pointerUp?: WidgetStyle;
  cursor?:
    | "pointer"
    | "default"
    | "none"
    | "text"
    | "move"
    | "grab"
    | "grabbing"
    | "zoom-in"
    | "zoom-out";

  // TODOS
  color?: string;
  textAlign?: "left" | "center" | "right";
  fontSize?: string;
  fontWeight?: number;
  fontStyle?: string;
  lineHeight?: string;

  padding?: string;
  margin?: string;
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

import { AreaInputSize } from "./Area";

export default interface WidgetStyle {
  size?: AreaInputSize;
  color?: string;
  textAlign?: "left" | "center" | "right";
  fontSize?: string;
  fontWeight?: number;
  fontStyle?: string;
  lineHeight?: string;
  backgroundColor?: string | CanvasGradient | CanvasPattern;
  opacity?: number;
  cursor?: "pointer" | "default" | "none";
  visible?: boolean;
  zIndex?: number;
  position?: "absolute" | "relative" | "fixed";

  // TODOS
  borderWidth?: number;
  borderRadius?: number;
  borderColor?: string | CanvasGradient | CanvasPattern;
  padding?: string;
  margin?: string;
}

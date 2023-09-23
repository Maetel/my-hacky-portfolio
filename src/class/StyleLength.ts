import {
  isNullish,
  isPx,
  parseIfCombo,
  parseIfPercent,
  parseIfPixel,
} from "@/utils";

// either horizontal or vertical
export class Length {
  length?: number | string;
  constructor(length?: number | string) {
    this.length = length;
  }
  isNullish() {
    return isNullish(this.length);
  }

  isStyleLength = () => false;
}
export default class StyleLength extends Length {
  screenPx: number;

  constructor(screenPx: number, length?: number | string) {
    super(length);
    this.screenPx = screenPx;
  }

  // @override
  isStyleLength = () => true;
  get px(): number {
    if (this.isNullish()) {
      throw new Error("length is nullish");
    }
    if (typeof this.length === "number") {
      return this.screenPx * this.length;
    }
    if (typeof this.length === "string") {
      const px = parseIfPixel(this.length);
      if (px !== null) {
        return px;
      }
      const percent = parseIfPercent(this.length);
      if (percent !== null) {
        return this.screenPx * percent * 0.01;
      }

      const combo = parseIfCombo(this.screenPx, this.length);
      if (combo !== null) {
        return combo;
      }
    }
    throw new Error(`length is not valid. [length] = [${this.length}]`);
  }

  copied() {
    return new StyleLength(this.screenPx, this.length);
  }
}

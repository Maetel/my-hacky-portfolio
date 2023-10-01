export const EmptyFourWayPixels: FourWayPixels = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
} as const;

export type FourWayPixels = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};
export type RenderableText = {
  index: number; // 0-base index
  text: string;
  width: number;
  yOffset: number;
};
export type RenderableCoord = {
  x: number;
  y: number;
  right: number;
  bottom: number;
};
export type RenderableSize = {
  innerWidth: number; // exclude padding
  width: number; // innerWidth + padding
  widthTotal: number; // innerWidth + padding + margin
  innerHeight: number; // exclude padding
  height: number;
  heightTotal: number;
  padding: FourWayPixels;
  margin: FourWayPixels;
  childrenFlexTotal: number;
  texts: RenderableText[];
  maxTextWidth: number;
  totalTextHeight: number;
};

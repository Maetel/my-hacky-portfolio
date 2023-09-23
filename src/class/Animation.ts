import StatelessWidget from "@/components/StatelessWidget";

export default interface Animation {
  widget: StatelessWidget;
  start: number; // timestamp in ms
  duration: number;
  everyFrame: (dt: number) => any;
  onFinish?: () => any;
}

export const buildAnimation = (
  widget: StatelessWidget,
  duration: number,
  everyFrame: (dt: number) => any,
  onFinish?: () => any
): Animation => {
  return {
    widget,
    start: performance.now(),
    duration,
    everyFrame,
    onFinish,
  };
};

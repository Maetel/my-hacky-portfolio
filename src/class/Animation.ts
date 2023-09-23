import StatefulWidget, { setState } from "@/components/StatefulWidget";
import WidgetStyle from "@/components/WidgetStyle";
import { deepCopy, uuid } from "@/utils";

export type AnimationCallback = (elapsedMs: number, dtMs: number) => any;
export type AnimationOnFinish = (
  elapsedMs: number,
  widget: StatefulWidget
) => any;

export default interface Animation {
  id: string;
  widget: StatefulWidget;
  startTimestamp: number; // timestamp in ms
  duration: number;
  everyFrame: AnimationCallback;
  onFinish?: AnimationOnFinish;
  returnOnFinish?: boolean;
  startStyle?: WidgetStyle;
}

export interface AnimationOptions {
  widget: StatefulWidget;
  duration: number;
  everyFrame: AnimationCallback;
  onFinish?: AnimationOnFinish;
  returnOnFinish?: boolean;
  animId?: string;
  runOnce?: boolean;
}

// updates state
export const buildAnimation = (options: AnimationOptions): Animation => {
  const { widget, duration, everyFrame, onFinish, animId, returnOnFinish } =
    options;
  const id = animId ?? `${widget.id}-${uuid()}`;
  setState(widget, { animations: [...widget.state.animations, id] });
  return {
    id,
    widget,
    startTimestamp: Date.now(),
    duration,
    everyFrame,
    onFinish,
    returnOnFinish,
    startStyle: deepCopy(widget._style),
  };
};

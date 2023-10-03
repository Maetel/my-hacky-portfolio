import WidgetState, { DefaultWidgetState } from "@/class/WidgetState";
import VirtualWidget, { WidgetOption } from "./Widget";
import WidgetStyle from "./WidgetStyle";
import error from "@/class/IError";

export default class StatefulWidget extends VirtualWidget {
  _state: WidgetState;
  constructor(
    options?: WidgetOption & {
      state?: WidgetState;
    }
  ) {
    const { state, ...rest } = options;
    super(rest);
    this._state = { ...DefaultWidgetState, ...(state ? { ...state } : {}) };
  }

  hasAnimation(animId: string) {
    return this.state.animations.includes(animId);
  }

  // @override
  get state(): WidgetState | null {
    return this._state;
  }
  set state(state: WidgetState | null) {
    if (!state) {
      error("State cannot be null @set state");
    }
    this._state = { ...this._state, ...state };
  }

  // @override
  copied(id?: string) {
    const retval = new StatefulWidget({
      id: id ?? this.id,
      ...this.buildOption(),
      ...this.state,
    });
    return retval;
  }
}

export const asStateful = (widget: VirtualWidget) => {
  if (widget.state) {
    return widget as StatefulWidget;
  }
  error("Widget is not stateful : ", { id: widget.id });
};

export const setState = (widget: VirtualWidget, state: WidgetState) => {
  const w = asStateful(widget);
  w.state = { ...w.state, ...state };
};

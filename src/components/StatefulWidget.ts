import WidgetState, { DefaultWidgetState } from "@/class/WidgetState";
import StatelessWidget from "./StatelessWidget";
import WidgetStyle from "./WidgetStyle";
import error from "@/class/IError";

export default class StatefulWidget extends StatelessWidget {
  _state: WidgetState;
  constructor(
    id: string,
    parent?: StatelessWidget,
    style?: WidgetStyle,
    state?: WidgetState
  ) {
    super(id, parent, style);
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
    const retval = new StatefulWidget(
      id ?? this.id,
      this.parent,
      { ...this.style },
      { ...this.state }
    );
    return retval;
  }
}

export const asStateful = (widget: StatelessWidget) => {
  if (widget.state) {
    return widget as StatefulWidget;
  }
  error("Widget is not stateful : ", { id: widget.id });
};

export const setState = (widget: StatelessWidget, state: WidgetState) => {
  const w = asStateful(widget);
  w.state = { ...w.state, ...state };
};

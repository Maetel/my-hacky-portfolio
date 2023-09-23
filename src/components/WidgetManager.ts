import { notNullish } from "@/utils";
import StatelessWidget from "./StatelessWidget";
import WidgetStyle from "./WidgetStyle";

export default class WidgetManager {
  static highestZ: number = 0;
  static updateIds: string[] = [];
  static widgets: StatelessWidget[] = [];

  static push(...args: StatelessWidget[]) {
    // console.log("pushed : ", args[0].id, " n : ", args.length);
    args.forEach((widget) => {
      WidgetManager._push(widget);
    });
  }

  static _push(widget: StatelessWidget) {
    widget._style.zIndex = widget._style.zIndex ?? WidgetManager.highestZ;
    WidgetManager.highestZ = Math.max(
      widget._style.zIndex,
      WidgetManager.highestZ
    );
    WidgetManager.widgets.push(widget);
    WidgetManager.sort();
  }

  static sort(
    order:
      | "zIndex"
      | ((a: StatelessWidget, b: StatelessWidget) => number) = "zIndex"
  ) {
    if (order === "zIndex") {
      WidgetManager.widgets.sort((a, b) => a._style.zIndex - b._style.zIndex);
    } else {
      WidgetManager.widgets.sort(order);
    }
  }

  static stful() {
    return WidgetManager.widgets.filter((w) => w.state !== null);
  }

  static stless() {
    return WidgetManager.widgets.filter((w) => w.state === null);
  }

  static resetWindowSize() {
    WidgetManager.widgets.forEach((widget) => {
      const { clientHeight, clientWidth } = document.documentElement;
      widget.setScreenHeight(clientHeight);
      widget.setScreenWidth(clientWidth);
    });
  }

  static of(x: number, y: number): StatelessWidget | null {
    const widgets = WidgetManager.widgets;
    for (let i = widgets.length - 1; i >= 0; i--) {
      const widget = widgets[i];
      if (widget.contains(x, y)) {
        return widget;
      }
    }
    return null;
  }

  static id(id: string): StatelessWidget | null {
    return WidgetManager.widgets.find((widget) => widget.id === id) ?? null;
  }

  static pop(): StatelessWidget | null {
    return WidgetManager.widgets.pop() ?? null;
  }

  static remove(id: string): StatelessWidget | null {
    const index = WidgetManager.widgets.findIndex((widget) => widget.id === id);
    if (index === -1) {
      return null;
    }
    return WidgetManager.widgets.splice(index, 1)[0];
  }

  static delete = WidgetManager.remove;
}

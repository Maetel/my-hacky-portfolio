import { notNullish } from "@/utils";
import StatelessWidget from "./StatelessWidget";
import WidgetStyle from "./WidgetStyle";

class ManagedWidget extends StatelessWidget {
  _addOrder: number;
}

export default class WidgetManager {
  static addedOrder = 0;
  static highestZ: number = 0;
  static updateIds: string[] = [];
  private static _widgets: ManagedWidget[] = [];
  static get widgets() {
    return WidgetManager._widgets as StatelessWidget[];
  }

  static push(...args: StatelessWidget[]) {
    // console.log("pushed : ", args[0].id, " n : ", args.length);
    args.forEach((widget) => {
      WidgetManager._push(widget);
    });
  }

  static _push(widget: StatelessWidget) {
    const managed: ManagedWidget = widget as ManagedWidget;
    managed._addOrder = WidgetManager.addedOrder++;
    widget._style.zIndex = widget._style.zIndex ?? WidgetManager.highestZ;
    WidgetManager.highestZ = Math.max(
      widget._style.zIndex,
      WidgetManager.highestZ
    );
    WidgetManager._widgets.push(managed);
    WidgetManager.sort();
  }

  static sort(
    order:
      | "zIndex"
      | ((a: StatelessWidget, b: StatelessWidget) => number) = "zIndex"
  ) {
    if (order === "zIndex") {
      WidgetManager._widgets.sort((a, b) => {
        if (a._style.zIndex - b._style.zIndex === 0) {
          return a._addOrder - b._addOrder;
        }
        return a._style.zIndex - b._style.zIndex;
      });
    } else {
      WidgetManager._widgets.sort(order);
    }
  }

  static stful() {
    return WidgetManager._widgets.filter((w) => w.state !== null);
  }

  static stless() {
    return WidgetManager._widgets.filter((w) => w.state === null);
  }

  static resetWindowSize() {
    WidgetManager._widgets.forEach((widget) => {
      const { clientHeight, clientWidth } = document.documentElement;
      widget.updateScreenSize();
    });
  }

  static of(x: number, y: number): StatelessWidget | null {
    const widgets = WidgetManager._widgets;
    for (let i = widgets.length - 1; i >= 0; i--) {
      const widget = widgets[i];
      if (widget.contains(x, y)) {
        return widget;
      }
    }
    return null;
  }

  static id(id: string): StatelessWidget | null {
    return WidgetManager._widgets.find((widget) => widget.id === id) ?? null;
  }

  static pop(): StatelessWidget | null {
    return WidgetManager._widgets.pop() ?? null;
  }

  static remove(id: string): StatelessWidget | null {
    const index = WidgetManager._widgets.findIndex(
      (widget) => widget.id === id
    );
    if (index === -1) {
      return null;
    }
    return WidgetManager._widgets.splice(index, 1)[0];
  }

  static delete = WidgetManager.remove;
}

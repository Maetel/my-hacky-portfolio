import { notNullish } from "@/utils";
import StatelessWidget from "./StatelessWidget";
import WidgetStyle from "./WidgetStyle";

export default class WidgetManager {
  static highestZ: number = 0;
  static updateIds: string[] = [];
  static widgets: StatelessWidget[] = [];

  static push(...args: StatelessWidget[]) {
    this.widgets.push(...args);

    args.forEach((widget) => {
      WidgetManager._push(widget);
    });
  }

  static _push(widget: StatelessWidget) {
    widget.style.zIndex = widget.style.zIndex ?? WidgetManager.highestZ;
    WidgetManager.highestZ = Math.max(
      widget.style.zIndex,
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
      WidgetManager.widgets.sort((a, b) => a.style.zIndex - b.style.zIndex);
    } else {
      WidgetManager.widgets.sort(order);
    }
  }

  static list(inZorder: boolean = true) {
    if (inZorder) {
      return Array.from(WidgetManager.widgets.values()).sort(
        (a, b) => a.style.zIndex - b.style.zIndex
      );
    } else {
      return Array.from(WidgetManager.widgets.values());
    }
  }
}
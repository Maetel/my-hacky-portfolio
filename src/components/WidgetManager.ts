import { notNullish } from "@/utils";
import StatelessWidget from "./StatelessWidget";
import WidgetStyle from "./WidgetStyle";
import error from "@/class/IError";
import Store, {
  STORE_DELETE_WIDGET as STORE_DELETE_WIDGET,
  STORE_ON_STLES_CREATE,
  STORE_REMOVE_WIDGET_FROM_LIST,
  STORE_SORT_WIDGETS,
} from "@/class/Store";

export default class WidgetManager {
  static highestZ: number = 0;
  static updateIds: string[] = [];
  static _addedOrder = 0;
  static _widgets: StatelessWidget[] = [];
  static get widgets() {
    return WidgetManager._widgets;
  }
  static set widgets(widgets: StatelessWidget[]) {
    WidgetManager._widgets = widgets;
  }

  static push(...args: StatelessWidget[]) {
    // console.log("pushed : ", args[0].id, " n : ", args.length);
    args.forEach((widget) => {
      WidgetManager._push(widget);
    });
    return this;
  }

  static _push(widget: StatelessWidget) {
    this._widgets.some((w) => w.id === widget.id) &&
      error("Widget already exists : ", { id: widget.id });

    widget._style.zIndex = widget._style.zIndex ?? WidgetManager.highestZ;
    WidgetManager.highestZ = Math.max(
      widget._style.zIndex,
      WidgetManager.highestZ
    );
    WidgetManager._widgets.push(widget);
    // WidgetManager.sort();
    sortWidgets();
  }

  // static sort(
  //   order:
  //     | "zIndex"
  //     | ((a: StatelessWidget, b: StatelessWidget) => number) = "zIndex"
  // ) {
  //   if (order === "zIndex") {
  //     WidgetManager._widgets.sort((a, b) => {
  //       if (a._style.zIndex - b._style.zIndex === 0) {
  //         return a.addOrder - b.addOrder;
  //       }
  //       return a._style.zIndex - b._style.zIndex;
  //     });
  //   } else {
  //     WidgetManager._widgets.sort(order);
  //   }
  // }

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

  static async remove(id: string): Promise<StatelessWidget | null> {
    return deleteWidget(id);
  }

  static delete = WidgetManager.remove;
}

export const wmgr = WidgetManager;
export const widgets = () => WidgetManager.widgets;
export const widgetIds = () => WidgetManager.widgets.map((w) => w.id);

function sortWidgets() {
  WidgetManager._widgets.sort((a, b) => {
    if (a._style.zIndex - b._style.zIndex === 0) {
      return a.addOrder - b.addOrder;
    }
    return a._style.zIndex - b._style.zIndex;
  });
  Store.rerender();
}

async function deleteWidget(
  widget: StatelessWidget | string
): Promise<StatelessWidget | null> {
  return new Promise((resolve, reject) => {
    const predicate =
      typeof widget === "string"
        ? (w: StatelessWidget) => w.id === widget
        : (w: StatelessWidget) => w.id !== widget.id;
    const widgetFound = WidgetManager.widgets.find(predicate);
    if (widgetFound) {
      widgetFound.delete().then((w) => {
        resolve(widgetFound);
      });
    } else {
      resolve(null);
    }

    // reject("Widget not found : " + widget.id ?? widget);
  });
}

function removeWidgetFromList(widget: StatelessWidget) {
  WidgetManager.widgets = WidgetManager.widgets.filter(
    (w) => w.id !== widget.id
  );
  // console.log(
  //   "mgr removeWidgetFromList id:",
  //   widget.id,
  //   ", widgets:",
  //   WidgetManager.widgets.map((w) => w.id)
  // );
}

////////////////////////////////////////////////////////////////////
// Predefined value handlers

Store.set(STORE_SORT_WIDGETS, sortWidgets);
Store.set(STORE_ON_STLES_CREATE, (stls) => {
  WidgetManager.push(stls);
  return stls;
});
Store.set(STORE_DELETE_WIDGET, deleteWidget);
Store.set(STORE_REMOVE_WIDGET_FROM_LIST, removeWidgetFromList);

import { as } from "@/utils";
import Widget from "../components/Widget";
import WidgetStyle, { DefaultStyle } from "../components/WidgetStyle";
import Tree from "@/class/Tree";
import error from "@/class/IError";

class InflatedWidget {
  parent: InflatedWidget | null;
  children: InflatedWidget[];
  _widget: Widget;
  inflatedStyle: WidgetStyle;
  id: string;
  isInflated: boolean = false;
  /**
   *
   */
  constructor(widget: Widget, parent: InflatedWidget | null = null) {
    this._widget = widget;
    this.inflatedStyle = {
      ...DefaultStyle,
      ...widget.style,
    };
    this.id = widget.id;
    this.parent = parent;
    this.children = widget.children.map((w) => new InflatedWidget(w, this));
  }

  inflate() {
    if (this.isInflated) {
      return;
    }
    this.isInflated = true;
    const style = this.inflatedStyle;
    const styleKeys = Object.keys(style);
    styleKeys.forEach((key) => {
      const v = style[key];

      // 1. handle inheritted styles
      if (v === "inherit") {
        let topParent: InflatedWidget | null = this.parent;
        // let val =
        let depth = 0;
        while (topParent && topParent.inflatedStyle[key] === "inherit") {
          depth++;
          topParent = topParent.parent;
        }
        if (!topParent) {
          error("topParent is null", {
            key,
            v,
            id: this.id,
            depth,
          });
        }
        const usableValue = topParent.inflatedStyle[key];
        console.log({
          key,
          v,
          id: this.id,
          depth,
          topParent: topParent.id,
          usableValue,
        });
        style[key] = usableValue;
      }

      // 2. handle parent derived properties
      // ex) relative size

      // 3. finally, convert to global renderable pixel system
    });
  }
}

export default class VDOM {
  _root: Widget;
  _inflatedRoot: InflatedWidget;
  isInflated = false;
  constructor(root: Widget) {
    this._root = root;
    this._inflatedRoot = new InflatedWidget(root);
    this.inflate();
  }
  inflate() {
    Tree.iterate(this._inflatedRoot, (w) => w.inflate(), "DFS_ChildrenFirst");
    // this.inputStyle.this.isInflated = true;
  }
}

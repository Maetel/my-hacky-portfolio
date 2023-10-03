import {
  as,
  clientHeight,
  clientWidth,
  isNullish,
  isPx,
  notNullish,
  parseIfCombo,
  parseIfPixel,
  parsePx,
} from "@/utils";
import VirtualWidget, { getRootWidget } from "../components/Widget";
import WidgetStyle, { DefaultStyle } from "../components/WidgetStyle";
import Tree from "@/class/Tree";
import error from "@/class/IError";
import * as C from "@/constants";
import {
  FourWayPixels,
  EmptyFourWayPixels,
  RenderableSize,
  RenderableText,
  RenderableCoord,
} from "./Renderable";
import CanvasObserver from "./WindowObserver";
import { RenderableWidget } from "./RenderableWidget";

export default class VDOM {
  _root: VirtualWidget = getRootWidget();
  _renderableRoot: RenderableWidget;
  isInflated = false;
  static canvas: HTMLCanvasElement;
  static get canvasCoord(): RenderableCoord {
    return CanvasObserver.coord;
  }
  static get canvasSize(): RenderableSize {
    return CanvasObserver.size;
  }

  // used to calc text size
  static _canvasBuffer: HTMLCanvasElement = null;
  static get ctx() {
    return VDOM.canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  get widgetTree(): string {
    const widgets = [];
    Tree.iterate(
      this._renderableRoot,
      (w) => {
        widgets.push(w.id);
      },
      "BFS"
    );
    return widgets.join(", ");
  }

  constructor(canvas: HTMLCanvasElement) {
    CanvasObserver.init(canvas);
    VDOM.canvas = canvas;
    VDOM._canvasBuffer = canvas;
    this._renderableRoot = new RenderableWidget(this._root, VDOM.ctx);
  }

  update(widgetOrId: string | RenderableWidget, withChildren = true) {
    let found =
      typeof widgetOrId === "string"
        ? Tree.find(this._renderableRoot, (w) => w.id === widgetOrId)
        : widgetOrId;

    if (!found) {
      return;
    }

    if (withChildren) {
      Tree.iterate(found, (w) => w.resetSize(), "DFS_ChildrenFirst");
    } else {
      found.resetSize();
    }
  }
  updateCoord(widgetOrId: string | RenderableWidget, withChildren = true) {
    let found =
      typeof widgetOrId === "string"
        ? Tree.find(this._renderableRoot, (w) => w.id === widgetOrId)
        : widgetOrId;

    if (!found) {
      return;
    }

    if (withChildren) {
      Tree.iterate(found, (w) => w.resetCoord(), "DFS_ChildrenFirst");
    } else {
      found.resetCoord();
    }
  }

  inflate() {
    Tree.iterate(this._renderableRoot, (w) => w.inflate(), "DFS_ParentFirst");
    // this.inputStyle.this.isInflated = true;
  }
  prepareRender() {
    //update inflated root
    this._renderableRoot = new RenderableWidget(this._root, VDOM.ctx);
    this.inflate();
    Tree.iterate(
      this._renderableRoot,
      (w) => w.globalCoord(),
      "DFS_ParentFirst"
    );
  }

  resize() {
    CanvasObserver.resize();
  }

  find(id: string) {
    return Tree.find(this._renderableRoot, (w) => w.id === id);
  }
  findAll(predicate: (w: RenderableWidget) => boolean) {
    return Tree.findAll(this._renderableRoot, predicate);
  }

  _cached: {
    widgets?: RenderableWidget[];
    widgetsReversed?: RenderableWidget[];
  } = {};
  resetCache() {
    this._cached = {};
  }
  // returns in z-index, then addOrder
  get widgets(): RenderableWidget[] {
    // if (this._cached.widgets) {
    //   return this._cached.widgets;
    // }
    const widgets = [];
    Tree.iterate(this._renderableRoot, (w) => {
      widgets.push(w);
    });
    // sort in style.zIndex, then style.addOrder
    widgets.sort((l, r) => {
      if (l.style.zIndex === r.style.zIndex) {
        return l._widget.addOrder - r._widget.addOrder;
      }
      return l.style.zIndex - r.style.zIndex;
    });
    // this._cached.widgets = widgets;
    return widgets;
  }

  _widgetsReversed: RenderableWidget[] = null;
  get widgetsReversed(): RenderableWidget[] {
    // if (this._cached.widgetsReversed) {
    //   return this._cached.widgetsReversed;
    // }
    const widgets = [];
    Tree.iterate(this._renderableRoot, (w) => {
      widgets.push(w);
    });
    // sort in style.zIndex, then style.addOrder
    widgets.sort((l, r) => {
      if (l.style.zIndex === r.style.zIndex) {
        return r._widget.addOrder - l._widget.addOrder;
      }
      return r.style.zIndex - l.style.zIndex;
    });
    // this._cached.widgetsReversed = widgets;
    return widgets;
  }

  mouseOn(x, y): RenderableWidget | null {
    const reversed = this.widgetsReversed;
    for (const w of reversed) {
      if (w.style.visible && w.contains(x, y)) {
        return w;
      }
    }
    return null;
  }
}

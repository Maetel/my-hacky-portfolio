import { Area, KeyArea } from "./components/Area";
import EventInput from "./components/EventInput";
import { initWidgets } from "./InitialValues";
import { KeyCode, handlableKeyCodes } from "./types";
import {
  isMobileDevice,
  myround,
  simpleHash,
  strPercentToFloat,
  toPx,
  uuid,
} from "./utils";
import * as C from "./constants";
import VERSION from "./VERSION";
import BasicCanvas from "./components/BasicCanvas";
import Widget, { getRootWidget } from "./components/Widget";
import WidgetManager from "./components/WidgetManager";
import WidgetStyle, { background } from "./components/WidgetStyle";
import Animation, {
  AnimationCallback,
  AnimationOnFinish,
  AnimationOptions,
  buildAnimation,
} from "./class/Animation";
import StatefulWidget, {
  asStateful,
  setState,
} from "./components/StatefulWidget";
import error from "./class/IError";
import Store, { STORE_RERENDER } from "./class/Store";
import VDOM from "./class/VirtualDOM";
import Tree, { TreeSearchType } from "./class/Tree";
import { RenderableWidget } from "./class/RenderableWidget";

let theCanvas: MHPCanvas;

const isMobile = isMobileDevice();
const isPC = !isMobile;
const mobileSlicer = (array: any[]) => {
  if (isPC) {
    array.pop();
  }
  return array;
};

const initMHP = () => {
  const theCanvasElement = document.getElementById(
    "theCanvas"
  ) as HTMLCanvasElement;
  const { clientHeight, clientWidth } = document.documentElement;
  initWidgets();
  theCanvas = new MHPCanvas(theCanvasElement, clientWidth, clientHeight);
  Store.set(STORE_RERENDER, () => theCanvas.redraw());

  window.onresize = (event) => theCanvas.onResize(event);
  window.onpointermove = (event) => theCanvas.onPointerMove(event);
  window.onpointerdown = (event) => theCanvas.onPointerDown(event);
  window.onpointerup = (event) => theCanvas.onPointerUp(event);
  window.onkeydown = (event) => theCanvas.onKeyDown(event);
  window.onkeyup = (event) => theCanvas.onKeyUp(event);

  theCanvas.run();
};

window.onload = initMHP;
// window.onload = TreeTest;

type RulerOption = {
  gridInterval: number;
  lineColor: string;
  highlightInterval: number;
  highlightColor: string;
};
const DefaultRulerOption: RulerOption = {
  gridInterval: 20,
  lineColor: "#a0afbc",
  highlightInterval: 5,
  highlightColor: "#888",
} as const;

class MHPCanvas extends BasicCanvas {
  static version = VERSION;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  currentAnimation: number = 0;
  areas: Area[] = [];
  vdom: VDOM = null;

  speakVDOM(msg: string, iterType: TreeSearchType = "BFS") {
    Tree.iterate(
      getRootWidget(),
      (w) => {
        console.log(msg, w.id);
      },
      iterType
    );
  }

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    super(canvas, width, height);
    this.vdom = new VDOM(this.canvas);
    // this.speakVDOM("Canvas create : ");

    this.prepareWidgets();

    if (isMobile) {
    }
  }
  prepareWidgets() {
    const prepareToggleNoise = () => {
      const tn = "toggleNoise";
      this.vdom.addCallbacks(tn, {
        onClick: (w) => {
          this.toggleNoise();
          w._widget.text = `Noise [${this.turnOnNoise ? "ON" : "OFF"}]`;
          this.redraw();
        },
      });
    };
    const prepareToggleRuler = () => {
      const tr = "toggleRuler";
      this.vdom.addCallbacks(tr, {
        onClick: (w) => {
          this.toggleRuler();
          w._widget.text = `Ruler [${this.ruler ? "ON" : "OFF"}]`;
          this.redraw();
        },
      });
    };
    const prepareToggleFPS = () => {
      const tf = "toggleFPS";
      this.vdom.addCallbacks(tf, {
        onClick: (w) => {
          this.toggleFPS();
          w._widget.text = `FPS [${this.fps ? "ON" : "OFF"}]`;
          this.redraw();
        },
      });
    };
    prepareToggleNoise();
    prepareToggleRuler();
    prepareToggleFPS();
  }
  toggleNoise() {
    this.turnOnNoise = !this.turnOnNoise;
  }

  // @override
  onResize(e: UIEvent) {
    // this.cancelAnimation();
    super.onResize(e);
    this.setHeight(this.height);
    this.setWidth(this.width);
    WidgetManager.resetWindowSize();
    this.vdom.resize();
    this.redraw();
    // this.run();
  }

  pointerMoveOn: RenderableWidget | null = null;
  pointerDownOn: RenderableWidget | null = null;
  // pointerUpOn: StatelessWidget | null = null;

  // @override
  onPointerMove(e: MouseEvent) {
    super.onPointerMove(e);

    // this.vdom.update("w1");
    // this.redraw();

    const prev = this.pointerMoveOn;
    this.pointerMoveOn =
      this.vdom.mouseOn(this.mouseMoveX, this.mouseMoveY) ?? null;
    const next = this.pointerMoveOn;
    if (prev?.id !== next?.id) {
      console.log("Handle state change");
      this.handleStateChange("onPointerMove", prev, next);
      // console.log({ prev: prev?.id, next: next?.id });
    }

    // //find in reverse order
    if (this.isDragging) {
      // console.log("drag");
      this.handleDrag();
    } else {
      // console.log("not drag");
      this.canvas.style.cursor =
        this.pointerMoveOn?.style?.hover?.cursor ?? "default";
      // this.redraw();
    }
  }
  // input event overrides

  ////////////////////////////////////////////////////////
  // overrides

  // @override
  onPointerDown(e: MouseEvent) {
    // console.log({ widgets });
    super.onPointerDown(e);
    this.pointerDownOn =
      this.vdom.mouseOn(this.mouseDownX, this.mouseDownY) ?? null;
    // console.log({ down: this.pointerDownOn?.style?.cursor });

    this.canvas.style.cursor =
      this.pointerDownOn?.style?.pointerDown?.cursor ?? "default";
    this.handlePointerDown();
  }

  // @override
  onPointerUp(e: MouseEvent) {
    super.onPointerUp(e);
    const pointerUpOn =
      this.vdom.mouseOn(this.mouseDownX, this.mouseDownY) ?? null;
    this.handlePointerUp(pointerUpOn);
    this.pointerDownOn = null;
    this.pointerMoveOn = null; // mobile
    // this.redraw();
  }

  // @override
  onKeyDown(e: KeyboardEvent) {
    super.onKeyDown(e);

    // refresh if cmd + R
    if (this.isCommandBeingPressed && e.code === "KeyR") {
      window.location.reload();
    }
  }

  // @override
  onKeyUp(e: KeyboardEvent) {
    super.onKeyUp(e);
  }

  ////////////////////////////////////////////////////////
  // handle events

  handleClick(widget: RenderableWidget) {
    this.vdom.onClickOf(widget)?.(widget);
    // console.log({ widget, onclick: widget?._callbacks?.onClick });
    // widget?._callbacks?.onClick?.(widget);
  }

  direction = 1;

  handlePointerDown() {
    if (!this.pointerDownOn) {
      return;
    }
    const clicked = this.pointerDownOn;
    console.log({ id: clicked.id });
  }

  animations: Animation[] = [];
  addAnimation(options: AnimationOptions): string {
    const { widget, duration, everyFrame, onFinish, animId, returnOnFinish } =
      options;
    if (animId) {
      const found =
        this.animations.find((a: Animation) => a.id === animId) ||
        widget.hasAnimation(animId);
      if (found) {
        error("Animation already exists : ", { animId });
      }
    }

    const anim = buildAnimation(options);

    this.animations.push(anim);

    this.timeout(duration, () => {
      const found = this.animations.find((a: Animation) => a === anim);
      if (!found) {
        // animation is deleted before it ends
        console.log("animation is deleted before it ends");
        return;
      }

      const w = found.widget;
      const filteredAnimationIDs = w.state.animations.filter(
        (animationId: string) => animationId !== anim.id
      );
      setState(w, { animations: filteredAnimationIDs });

      this.animations = this.animations.filter((a: Animation) => a !== found);
      if (anim.returnOnFinish) {
        w.style = { ...found.startStyle };
      }
      onFinish?.(Date.now() - found.startTimestamp, w);
      this.redraw();
    });

    return animId ?? anim.id;
  }

  handlePointerUp(widget: RenderableWidget) {
    console.log({ d: this.pointerDownOn?.id, u: widget?.id });
    if (this.pointerDownOn?.id === widget?.id) {
      this.handleClick(widget);
    }
    this.redraw();
  }

  handleDrag() {
    // if (!this.isDragging || this.pointerDownOn === null) {
    //   return;
    // }

    const {
      mouseMoveX,
      mouseMoveY,
      mouseMovePrevX,
      mouseMovePrevY,
      mouseDownX,
      mouseDownY,
      dx,
      dy,
    } = this;

    // this.vdom.find("w1").style.size.left = mouseMoveX + "px";
    // this.vdom.find("w1").style.size.top = mouseMoveY + "px";

    if (this.pointerDownOn.style?.grabbable) {
      // console.log({ id: this.pointerDownOn.id, dx, dy });
      this.pointerDownOn.move(dx, dy);
      this.vdom.updateCoord(this.pointerDownOn);
    }
    this.redraw();
  }

  ////////////////////////////////////////////////////////
  // render

  dt: number;
  lastTimestamp: number;
  _redraw = true; //draw first frame
  _forceRedraw = false;
  forceRedraw(value: boolean = true) {
    this._forceRedraw = value;
  }
  redraw() {
    this._redraw = true;
  }

  updateScreen(force?: boolean) {
    if (
      this._drawNoise ||
      this._redraw ||
      this.animations.length > 0 ||
      this._forceRedraw
    ) {
      this._redraw = false;
      return true;
    }
    return false;
  }

  _renderWidget(w: RenderableWidget) {
    // console.log("Rendering:", w.id);
    this.ctx.save();

    const size = w.renderData();
    let style = w.style;

    if (w.is(this.pointerMoveOn)) {
      // console.log({ HoveredId: w.id });
      style = { ...style, ...style.hover };
    }
    if (w.is(this.pointerDownOn)) {
      style = { ...style, ...style.pointerDown };
    }

    // 1. background
    this.ctx.fillStyle = style.backgroundColor;
    // if (["w4", "w5", "w6"].includes(w.id)) {
    //   console.log({ size });
    // }
    const clipRoundedRect = true;
    this.drawRoundedRect(
      size.x,
      size.y,
      size.width,
      size.height,
      style.borderRadius as number,
      clipRoundedRect
    );
    this.ctx.fill();
    this.ctx.strokeStyle = style.borderColor;
    this.ctx.lineWidth = style.borderWidth as number;
    this.ctx.stroke();

    // 2. texts
    this.ctx.fillStyle = style.color;
    this.ctx.font = `${style.fontSize}px ${style.font}`;
    this.ctx.textBaseline = "ideographic";
    const textX = size.x + size.padding.left;
    const textYStart = size.y + size.padding.top + (style.lineHeight as number);
    size.texts.forEach((t) => {
      const { text, width, yOffset } = t;
      this.ctx.fillText(text, textX, textYStart + yOffset);
    });

    this.ctx.restore();

    if (this.ruler && w.id === "root") {
      this.drawRuler();
    }
  }

  ruler = false;
  toggleRuler() {
    this.ruler = !this.ruler;
  }
  fps = false;
  toggleFPS() {
    this.fps = !this.fps;
  }

  render() {
    this.vdom.prepareRender();
    this.vdom.widgets.forEach(this._renderWidget.bind(this));
  }

  findUpdateArea() {
    // TODO : find update tree
    return {
      x: 0,
      y: 0,
      w: this.width,
      h: this.height,
    };
  }

  onces: number[] = [];
  doOnce(fn: Function, id?: number) {
    const fnId = id ?? simpleHash(fn.toString());
    if (!this.onces.includes(fnId)) {
      fn();
      this.onces.push(fnId);
    }
  }
  logOnce(id: number, ...args: any[]) {
    this.doOnce(() => console.log(...args), id);
  }

  handleStateChange(key: string, prev: any, next: any) {
    // TODO : handle state change
    // console.log("Handle state change : ", key);
    this.redraw();
  }

  turnOnNoise = true;
  _drawNoise = false;
  drawNoise(force = false) {
    if (!this.turnOnNoise || (force && !this._drawNoise)) {
      return;
    }
    const { width, height } = this;
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const getPixelData = (x: number, y: number) => {
      const index = (y * width + x) * 4; // Each pixel has 4 values (RGBA)

      // Extract individual color values
      const r = imageData.data[index];
      const g = imageData.data[index + 1];
      const b = imageData.data[index + 2];
      const a = imageData.data[index + 3];

      return {
        r,
        g,
        b,
        a,
      };
    };

    const noiseCount = 10;
    const maxX = 220;
    const maxY = 19;
    const getRandomXY = () => {
      const x = Math.round(Math.random() * width);
      const y = Math.round(Math.random() * height);
      const w = Math.round(Math.random() * maxX);
      const h = Math.round(Math.random() * maxY);
      return { x, y, w, h };
    };

    this.ctx.save();
    const plusminus = (range = 30) => range * (Math.random() - 0.5);
    for (let i = 0; i < noiseCount; ++i) {
      const { x, y, w, h } = getRandomXY();
      const { r, g, b, a } = getPixelData(x, y);
      this.ctx.fillStyle = `rgba(${r + plusminus()},${g + plusminus()},${
        b + plusminus()
      },${a})`;
      this.ctx.fillRect(
        x - w * (Math.random() - 0.5),
        y - h * (Math.random() - 0.5),
        w,
        h
      );
    }
    this.ctx.restore();
    this._drawNoise = false;
  }

  drawRuler(rulerOption: RulerOption = DefaultRulerOption) {
    // Define the grid parameters
    if (!this.ruler) {
      return;
    }

    this.ctx.save();
    const { gridInterval, lineColor, highlightInterval, highlightColor } =
      rulerOption;
    const prevStrokeStyle = this.ctx.strokeStyle;
    this.ctx.strokeStyle = lineColor;

    // Draw the grid
    const h = this.height;
    const w = this.width;
    let xCount = 1;
    let yCount = 1;
    for (let x = gridInterval; x <= w; x += gridInterval) {
      this.ctx.beginPath();
      this.ctx.strokeStyle =
        xCount % highlightInterval === 0 ? highlightColor : lineColor;
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
      xCount++;
    }

    for (let y = gridInterval; y <= h; y += gridInterval) {
      this.ctx.beginPath();
      this.ctx.strokeStyle =
        yCount % highlightInterval === 0 ? highlightColor : lineColor;
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
      yCount++;
    }

    this.ctx.strokeStyle = prevStrokeStyle;
    this.ctx.restore();
  }

  clearBase(withRuler = true, rulerOptions = DefaultRulerOption) {
    this.ctx.clearRect(0, 0, this.width, this.height);
    if (!withRuler) {
      return;
    }
    this.drawRuler(rulerOptions);
  }

  accFrame = 0;
  updateNoiseFrame() {
    this.accFrame += 1;
    if (this.accFrame % 10 === 0) {
      this._drawNoise = true;
    }
  }

  // @override
  _run(timestamp: number) {
    // try {
    this.dt = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    //content
    // this.doOnce(this.render.bind(this));
    // this.logOnce(0, "logonce rendered", timestamp);

    this.handleTimerJobs();
    this.handleAnimation();

    if (this._drawNoise) {
      this.clearBase();
    }

    if (this.updateScreen()) {
      const { x, y, w, h } = this.findUpdateArea();
      // this.ctx.clearRect(x, y, w, h);

      this.render();
      this.drawNoise(true);
      // this.clearBase();this.drawNoise();
    } else {
      // this.drawNoise();
      // this.showIdle();
    }
    this.drawNoise();

    if (true) {
      this.renderFPS();
      // this.showWidgets();
    }

    //!content

    this.updateNoiseFrame();
    this.currentAnimation = requestAnimationFrame(this._run.bind(this));
    // } catch (e) {
    //   console.log(e);
    //   debugger;
    // }
  }

  handleAnimation() {
    // console.log(this.animations);
    this.animations.forEach((animation) => {
      animation.everyFrame(Date.now() - animation.startTimestamp, this.dt);
    });
  }

  renderFPS() {
    if (!this.fps) {
      return;
    }
    const fps = myround(1000 / this.dt, 0);
    const prev = {
      fillStyle: this.ctx.fillStyle,
      font: this.ctx.font,
    };

    const padding = 6;
    const x = 0;
    const y = 0;
    const text = `${fps}fps`;
    const fontSize = 20;
    const font = `${fontSize}px sans-serif`;

    this.ctx.font = font;
    const textWidth = this.ctx.measureText(text).width;
    const textHeight = fontSize;
    this.ctx.fillStyle = "rgba(0,0,0,1.0)";
    this.ctx.fillRect(x, y, textWidth + padding, textHeight + padding);
    this.ctx.fillStyle = "#aaa";
    this.ctx.fillText(text, x + padding / 2, y + padding / 2 + textHeight);

    //restore
    this.ctx.fillStyle = prev.fillStyle;
    this.ctx.font = prev.font;
  }

  showIdle() {
    // on the right corner, show isRendering
    const text = "idle";
    const font = "20px sans-serif";
    this.ctx.font = font;
    const textWidth = this.ctx.measureText(text).width;
    const textHeight = 20;
    const padding = 6;
    const x = this.width - textWidth - padding;
    const y = 0;
    const prev = {
      fillStyle: this.ctx.fillStyle,
      font: this.ctx.font,
    };
    this.ctx.fillStyle = "rgba(0,0,0,1.0)";
    this.ctx.fillRect(x, y, textWidth + padding, textHeight + padding);
    this.ctx.fillStyle = "#aaa";
    this.ctx.fillText(text, x + padding / 2, y + padding / 2 + textHeight);

    //restore
    this.ctx.fillStyle = prev.fillStyle;
    this.ctx.font = prev.font;
  }

  showWidgets() {
    // on the right corner, show isRendering
    const text = this.vdom.widgetTree;
    const font = "20px sans-serif";
    this.ctx.font = font;
    const textWidth = this.ctx.measureText(text).width;
    const textHeight = 20;
    const padding = 6;
    const x = padding;
    const y = this.height - textHeight - padding;
    const prev = {
      fillStyle: this.ctx.fillStyle,
      font: this.ctx.font,
    };
    this.ctx.fillStyle = "rgba(0,0,0,1.0)";
    this.ctx.fillRect(x, y, textWidth + padding, textHeight + padding);
    this.ctx.fillStyle = "#aaa";
    this.ctx.fillText(text, x + padding / 2, y + padding / 2 + textHeight);

    //restore
    this.ctx.fillStyle = prev.fillStyle;
    this.ctx.font = prev.font;
  }
}

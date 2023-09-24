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
import * as s from "./styles";
import { defaultCommands } from "./class/Command";
import VERSION from "./VERSION";
import BasicCanvas from "./components/BasicCanvas";
import StatelessWidget from "./components/StatelessWidget";
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
let theCanvas: MHPCanvas;

const isMobile = isMobileDevice();
const isPC = !isMobile;
const mobileSlicer = (array: any[]) => {
  if (isPC) {
    array.pop();
  }
  return array;
};
const widgets = () => WidgetManager.widgets;
const wmgr = WidgetManager;

window.onload = () => {
  const theCanvasElement = document.getElementById(
    "theCanvas"
  ) as HTMLCanvasElement;
  const { clientHeight, clientWidth } = document.documentElement;
  theCanvas = new MHPCanvas(theCanvasElement, clientWidth, clientHeight);
  Store.set(STORE_RERENDER, () => theCanvas.redraw());

  window.onresize = (event) => theCanvas.onResize(event);
  window.onpointermove = (event) => theCanvas.onPointerMove(event);
  window.onpointerdown = (event) => theCanvas.onPointerDown(event);
  window.onpointerup = (event) => theCanvas.onPointerUp(event);
  window.onkeydown = (event) => theCanvas.onKeyDown(event);
  window.onkeyup = (event) => theCanvas.onKeyUp(event);

  initWidgets();
  theCanvas.run();
};

class MHPCanvas extends BasicCanvas {
  static version = VERSION;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  currentAnimation: number = 0;

  areas: Area[] = [];

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    super(canvas, width, height);
    if (isMobile) {
    }
  }

  // @override
  onResize(e: UIEvent) {
    // this.cancelAnimation();
    super.onResize(e);
    this.setHeight(this.height);
    this.setWidth(this.width);
    WidgetManager.resetWindowSize();
    this.redraw();
    // this.run();
  }

  pointerMoveOn: StatelessWidget | null = null;
  pointerDownOn: StatelessWidget | null = null;
  // pointerUpOn: StatelessWidget | null = null;

  // @override
  onPointerMove(e: MouseEvent) {
    super.onPointerMove(e);

    const prev = this.pointerMoveOn;
    this.pointerMoveOn = wmgr.of(this.mouseMoveX, this.mouseMoveY) ?? null;
    const next = this.pointerMoveOn;
    if (prev !== next) {
      this.handleStateChange("onPointerMove", prev, next);
    }

    //find in reverse order
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
    this.pointerDownOn = wmgr.of(this.mouseDownX, this.mouseDownY) ?? null;
    // console.log({ down: this.pointerDownOn?.style?.cursor });
    this.canvas.style.cursor =
      this.pointerDownOn?.style?.pointerDown?.cursor ?? "default";
    this.handlePointerDown();
  }

  // @override
  onPointerUp(e: MouseEvent) {
    super.onPointerUp(e);
    const pointerUpOn = wmgr.of(this.mouseUpX, this.mouseUpY) ?? null;
    this.handlePointerUp(pointerUpOn);
    this.pointerDownOn = null;
    this.pointerMoveOn = null; // mobile
    this.redraw();
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

  handleClick(widget: StatelessWidget) {
    this.pointerDownOn?.inputOption?.onClick?.(widget);
  }

  direction = 1;

  handlePointerDown() {
    if (!this.pointerDownOn) {
      return;
    }
    const clicked = this.pointerDownOn;
    if (clicked.id === "stls-1") {
      const stful = asStateful(clicked);
      const animId = "swing";
      if (!stful.hasAnimation(animId)) {
        this.addAnimation({
          widget: stful,
          duration: 3000,
          everyFrame: (elapsed: number, dt: number) => {
            const FPS = 1000 / dt;
            // console.log({ elapsed });
            clicked.moveY(10 * Math.sin(elapsed / 200));
          },
          onFinish: (elapsed, w) => {},
          animId,
          returnOnFinish: true,
        });
      } else {
        console.log("already running : ", animId);
      }
    }

    if (clicked.id === "stls-2") {
      const stful = clicked;
      const {
        x: orgLeft,
        y: orgTop,
        w: orgWidth,
        h: orgHeight,
      } = stful.xywhRelative;
      // console.log({ thirdLrwh: stful.lrwh });
      const orgStyle = stful.style;

      const jobId = "untiljob";
      const jobTypeId = "untiljobType";
      if (!Store.has(jobId)) {
        Store.set(jobId, true);
        Store.upsert(jobTypeId, (prev) => {
          if (!prev) {
            return "expand";
          }
          // return prev === "expand" ? "swing" : "expand";
          return "expand";
        });

        const duration_ms = 3000;
        const onEveryFrame = (elapsed) => {
          const untilAnimation: "expand" | "swing" = Store.get(jobTypeId);

          const dx = Math.sin(elapsed / 200) * 100;
          switch (untilAnimation) {
            case "expand":
              stful.setLeftRelative(toPx(orgLeft - dx));
              // stful.setWidth(toPx(orgWidth + 2 * dx));
              // stful.setTop(toPx(orgTop + 50 + dx * 0.5));
              // stful.setHeight(toPx(orgTop - dx));
              break;
            case "swing":
              stful.setLeftRelative(toPx(orgLeft + dx));
              break;
          }

          this.redraw();
        };
        const onUntiljobFinish = (elapsed) => {
          console.log("until onFinish, Elapsed : ", elapsed);
          // stful.setLeft(toPx(orgLeft));
          // stful.setWidth(toPx(orgWidth));
          stful.style = orgStyle;
          switch (Store.get(jobTypeId)) {
            case "expand":
              stful.style.backgroundColor = "#a9039c";
              break;
            case "swing":
              stful.style.backgroundColor = "#39ca90";
              break;
          }
          this.redraw();
          Store.delete(jobId);
        };

        this.until(duration_ms, onEveryFrame, onUntiljobFinish);
      }
    }
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

  handlePointerUp(widget: StatelessWidget) {
    // console.log({ d: this.pointerDownOn?.id, u: widget?.id });
    if (this.pointerDownOn?.id === widget?.id) {
      this.handleClick(widget);
    }
    this.redraw();
  }

  handleDrag() {
    if (!this.isDragging || this.pointerDownOn === null) {
      return;
    }

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

    if (this.pointerDownOn.style?.grabbable) {
      this.pointerDownOn.move(dx, dy);
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
    if (this._redraw || this.animations.length > 0 || this._forceRedraw) {
      this._redraw = false;
      return true;
    }
    return false;
  }

  _renderWidget(widget: StatelessWidget) {
    // 1. render self
    if (!widget.style.visible) {
      return;
    }
    const { left, top, width, height, right, bottom } = widget.lrwh;
    // console.log({ left, width, right });
    // console.log({ top, height, bottom });

    const hovered = this.pointerMoveOn?.id === widget.id;
    const pointerDown = this.pointerDownOn?.id === widget.id;

    let style = { ...widget.style };
    if (pointerDown && widget.style.pointerDown) {
      style = { ...style, ...widget.style.pointerDown };
    } else if (hovered && widget.style.hover) {
      style = { ...style, ...widget.style.hover };
      // console.log({ hoverStyle: style });
    }

    if (width === 0 || height === 0) {
      return;
    }

    const backgroundColor = background(style.backgroundColor, style.opacity);
    // this.ctx.fillStyle = widget.style.backgroundColor ?? color;
    const drawBorder = style.borderColor && style.borderWidth;
    const prev = {
      fillStyle: this.ctx.fillStyle,
      strokeStyle: this.ctx.strokeStyle,
      lineWidth: this.ctx.lineWidth,
    };

    this.ctx.fillStyle = backgroundColor;
    this.drawRoundedRect(left, top, width, height, style.borderRadius ?? 0);
    this.ctx.fill();
    if (drawBorder) {
      this.ctx.strokeStyle = style.borderColor;
      this.ctx.lineWidth = style.borderWidth ?? 2;
      this.ctx.stroke();
    }

    //restore
    this.ctx.fillStyle = prev.fillStyle;
    this.ctx.strokeStyle = prev.strokeStyle;
    this.ctx.lineWidth = prev.lineWidth;

    // 2. render children
    // widget.children.forEach((child) => this._renderWidget(child));
  }

  render() {
    // console.log("Rendered");
    widgets().forEach((widget) => {
      // this call will recursively render all children
      this._renderWidget(widget);
    });
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

  // @override
  _run(timestamp: number) {
    try {
      this.dt = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;

      //content
      // this.doOnce(this.render.bind(this));
      // this.logOnce(0, "logonce rendered", timestamp);

      this.handleTimerJobs();
      this.handleAnimation();

      if (this.updateScreen()) {
        const { x, y, w, h } = this.findUpdateArea();
        this.ctx.clearRect(x, y, w, h);
        this.render();
      } else {
        this.showIdle();
      }

      if (true) {
        this.renderFPS();
        this.showWidgets();
      }

      //!content

      this.currentAnimation = requestAnimationFrame(this._run.bind(this));
    } catch (e) {
      console.log(e);
      debugger;
    }
  }

  handleAnimation() {
    // console.log(this.animations);
    this.animations.forEach((animation) => {
      animation.everyFrame(Date.now() - animation.startTimestamp, this.dt);
    });
  }

  renderFPS() {
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
    const text =
      "Widgets:" +
      widgets()
        .map((w) => w.id)
        .join(",");
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

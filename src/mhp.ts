import { Area, KeyArea } from "./components/Area";
import EventInput from "./components/EventInput";
import {
  initialAnimStates,
  initialAreaBreakPoints,
  initialInputStates,
  initialTerminalBottom,
  initialTerminalStates,
  initialTerminalTop,
  initialUIStates,
} from "./InitialValues";
import { KeyCode, handlableKeyCodes } from "./types";
import {
  isMobileDevice,
  myround,
  simpleHash,
  strPercentToFloat,
  uuid,
} from "./utils";
import * as C from "./constants";
import * as s from "./styles";
import { defaultCommands } from "./class/Command";
import VERSION from "./VERSION";
import BasicCanvas from "./components/BasicCanvas";
import { Length } from "./class/StyleLength";
import StatelessWidget from "./components/StatelessWidget";
import WidgetManager from "./components/WidgetManager";
import { background } from "./components/WidgetStyle";
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
let theCanvas: MHPCanvas;

const isMobile = isMobileDevice();
const isPC = !isMobile;
const mobileSlicer = (array: any[]) => {
  if (isPC) {
    array.pop();
  }
  return array;
};
const widgets = WidgetManager.widgets;
const wmgr = WidgetManager;

window.onload = () => {
  const theCanvasElement = document.getElementById(
    "theCanvas"
  ) as HTMLCanvasElement;
  const { clientHeight, clientWidth } = document.documentElement;
  theCanvas = new MHPCanvas(theCanvasElement, clientWidth, clientHeight);

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
    // this.run();
  }

  pointerMoveOn: StatelessWidget | null = null;
  pointerDownOn: StatelessWidget | null = null;
  // pointerUpOn: StatelessWidget | null = null;

  // @override
  onPointerMove(e: MouseEvent) {
    super.onPointerMove(e);

    this.pointerMoveOn = wmgr.of(this.mouseMoveX, this.mouseMoveY) ?? null;

    //find in reverse order
    if (this.isDragging) {
      this.handleDrag();
    } else {
      this.canvas.style.cursor =
        this.pointerMoveOn?.style?.hover?.cursor ?? "default";
    }
  }
  // input event overrides

  ////////////////////////////////////////////////////////
  // overrides

  // @override
  onPointerDown(e: MouseEvent) {
    super.onPointerDown(e);
    this.pointerDownOn = wmgr.of(this.mouseDownX, this.mouseDownY) ?? null;
    // console.log({ down: this.pointerDownOn?.style?.cursor });
    this.canvas.style.cursor =
      this.pointerDownOn?.style?.mouseDown?.cursor ?? "default";
    this.handlePointerDown();
  }

  // @override
  onPointerUp(e: MouseEvent) {
    super.onPointerUp(e);
    this.pointerDownOn = null;
    this.pointerMoveOn = null; // mobile
    const pointerUpOn = wmgr.of(this.mouseUpX, this.mouseUpY) ?? null;
    this.handlePointerUp(pointerUpOn);
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

  handleClick() {
    if (this.pointerMoveOn) {
      console.log(this.pointerMoveOn);
    }
  }

  direction = 1;

  handlePointerDown() {
    if (!this.pointerDownOn) {
      return;
    }
    const clicked = this.pointerDownOn;
    if (clicked.id === "second") {
      const stful = asStateful(clicked);
      const animId = "swing";
      if (!stful.hasAnimation(animId)) {
        this.addAnimation({
          widget: stful,
          duration: 1000,
          everyFrame: (elapsed: number, dt: number) => {
            const FPS = 1000 / dt;
            // console.log({ elapsed });
            clicked.moveY(10 * Math.sin(elapsed / 50));
          },
          onFinish: (elapsed, w) => {},
          animId,
          returnOnFinish: true,
        });
      } else {
        console.log("already running : ", animId);
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

  handlePointerUp(widget: StatelessWidget) {}

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
      this.redraw();
    }
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

  render() {
    // console.log("Rendered");
    widgets.forEach((widget) => {
      if (!widget.style.visible) {
        return;
      }
      const { left, top, width, height, bottom } = widget.xywh;
      const hovered = this.pointerMoveOn?.id === widget.id;
      const pointerDown = this.pointerDownOn?.id === widget.id;

      let style = { ...widget.style };
      if (pointerDown && widget.style.mouseDown) {
        style = { ...style, ...widget.style.mouseDown };
      } else if (hovered && widget.style.hover) {
        style = { ...style, ...widget.style.hover };
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

  // @override
  _run(timestamp: number) {
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
    }

    //!content

    this.currentAnimation = requestAnimationFrame(this._run.bind(this));
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
}

function initWidgets() {
  // console.log("called");
  const background = new StatelessWidget("background", null, {
    size: {
      top: new Length(0),
      left: new Length(0),
      width: new Length(1),
      height: new Length(1),
    },
    backgroundColor: "#dfdfdf",
  });
  const first = new StatelessWidget("first", null, {
    size: {
      top: new Length(0.25),
      left: new Length(0.25),
      width: new Length(0.5),
      height: new Length(0.5),
    },
    backgroundColor: "#ff0000",
    borderRadius: 30,
    grabbable: true,
    hover: {
      borderColor: "#0000ff",
      borderWidth: 2,
      cursor: "pointer",
    },
    mouseDown: {
      backgroundColor: "#dd0000",
      borderColor: "#00ff00",
      borderWidth: 3,
      cursor: "grabbing",
    },
  });
  const second = new StatefulWidget("second", first, {
    size: {
      left: new Length(0.5),
      top: new Length(0.5),
      width: new Length(0.45),
      height: new Length(0.45),
    },
    backgroundColor: "#00ff00",
    // backgroundColor: "transparent",
    opacity: 0.5,
  });
  // WidgetManager.push(background, first, second);
  WidgetManager.push(first, second);
  // console.log(widgets);
}

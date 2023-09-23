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
import {
  AnimState,
  AreaType,
  BreakPoints,
  InputState,
  KeyCode,
  RenderData,
  State,
  TerminalState,
  UIState,
  handlableKeyCodes,
} from "./types";
import {
  isMobileDevice,
  myround,
  simpleHash,
  strPercentToFloat,
  synthImageData,
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
  console.log(isMobile);
  const theCanvasElement = document.getElementById(
    "theCanvas"
  ) as HTMLCanvasElement;
  const { clientHeight, clientWidth } = document.documentElement;
  console.log({ clientWidth, clientHeight });
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
      console.log({ dx, dy });
      this.pointerDownOn.move(dx, dy);
    }
  }

  ////////////////////////////////////////////////////////
  // handle events

  handleClick() {
    if (this.pointerMoveOn) {
      console.log(this.pointerMoveOn);
    }
  }

  handlePointerDown() {}

  handlePointerUp(widget: StatelessWidget) {}

  ////////////////////////////////////////////////////////
  // render

  dt: number;
  lastTimestamp: number;

  updateScreen(force?: boolean) {
    return force ?? true;
  }

  render() {
    WidgetManager.list().forEach((widget) => {
      if (!widget.style.visible) return;
      const { left, top, width, height, bottom } = widget.xywh;
      const hovered = this.pointerMoveOn?.id === widget.id;
      const pointerDown = this.pointerDownOn?.id === widget.id;
      // const pointerUp = this.pointerUpOn?.id === widget.id;
      // console.log({ hovered,  });

      let style = { ...widget.style };
      if (pointerDown && widget.style.mouseDown) {
        style = { ...style, ...widget.style.mouseDown };
      } else if (hovered && widget.style.hover) {
        style = { ...style, ...widget.style.hover };
      }

      // console.log({ style });
      if (width === 0 || height === 0) return;
      const { left: lr, top: tr, width: wr, height: hr } = widget.xywhRatio;

      const backgroundColor = background(style.backgroundColor, style.opacity);
      // this.ctx.fillStyle = widget.style.backgroundColor ?? color;
      const drawBorder = style.borderColor && style.borderWidth;
      const prev = {
        fillStyle: this.ctx.fillStyle,
        strokeStyle: this.ctx.strokeStyle,
        lineWidth: this.ctx.lineWidth,
      };

      this.ctx.fillStyle = backgroundColor;
      if (widget.id === "second") {
        // console.log({ backgroundColor });
      }

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
    if (this.updateScreen()) {
      const { x, y, w, h } = this.findUpdateArea();
      this.ctx.clearRect(x, y, w, h);
      this.render();
    }

    //!content

    this.currentAnimation = requestAnimationFrame(this._run.bind(this));
  }
}

function initWidgets() {
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
  const second = new StatelessWidget("second", first, {
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
  WidgetManager.push(first, second);
}

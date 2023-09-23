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

window.onload = () => {
  console.log(isMobile);
  const theCanvasElement = document.getElementById(
    "theCanvas"
  ) as HTMLCanvasElement;
  const { innerWidth, innerHeight } = window;
  theCanvas = new MHPCanvas(theCanvasElement, innerWidth, innerHeight);

  window.onresize = (event) => theCanvas.onResize(event);
  window.onpointermove = (event) => theCanvas.onPointerMove(event);
  window.onpointerdown = (event) => theCanvas.onPointerDown(event);
  window.onpointerup = (event) => theCanvas.onPointerUp(event);
  window.onkeydown = (event) => theCanvas.onKeyDown(event);
  window.onkeyup = (event) => theCanvas.onKeyUp(event);

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

    this.initAreas();

    if (isMobile) {
    }
  }

  initAreas() {
    const first = new StatelessWidget("first", null, {
      size: {
        top: new Length(0.25),
        left: new Length(0.25),
        width: new Length(0.5),
        height: new Length(0.5),
      },
      backgroundColor: "#ff0000",
    });
    const second = new StatelessWidget("second", first, {
      size: {
        right: new Length(0.01),
        bottom: new Length(0.01),
        width: new Length(0.5),
        height: new Length(0.5),
      },
      backgroundColor: "#00ff00",
      // backgroundColor: "transparent",
      opacity: 0.5,
    });
    WidgetManager.push(first, second);
  }

  // @override
  onResize(e: UIEvent) {
    this.cancelAnimation();
    super.onResize(e);
    this.setHeight(this.height);
    this.setWidth(this.width);
    this.run();
  }

  mouseOn: string | null = null;

  // @override
  onPointerMove(e: MouseEvent) {
    super.onPointerMove(e);

    //find in reverse order
    for (let i = widgets.length - 1; i >= 0; i--) {
      const widget = widgets[i];
      if (widget.contains(this.mouseMoveX, this.mouseMoveY)) {
        this.mouseOn = widget.id;
        break;
      }
    }
  }
  // input event overrides

  ////////////////////////////////////////////////////////
  // overrides

  // @override
  onPointerDown(e: MouseEvent) {
    super.onPointerDown(e);
    this.handleClick();
  }

  // @override
  onPointerUp(e: MouseEvent) {
    super.onPointerUp(e);
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
    if (!this.isDragging) {
      return;
    }
    const { mouseMoveX, mouseMoveY, mouseDownX, mouseDownY } = this;
  }

  ////////////////////////////////////////////////////////
  // handle events

  handleClick() {
    if (this.mouseOn) {
      console.log(this.mouseOn);
    }
  }

  dt: number;
  lastTimestamp: number;

  updateScreen(force?: boolean) {
    return force ?? true;
  }

  render() {
    WidgetManager.list().forEach((widget) => {
      if (!widget.style.visible) return;
      const { left, top, width, height, bottom } = widget.xywh;
      const style = widget.style;
      if (width === 0 || height === 0) return;
      const { left: lr, top: tr, width: wr, height: hr } = widget.xywhRatio;
      // console.log({ xywh: widget.xywh });
      const dst = `${bottom - 0.5}px`;
      if (widget.id === "first") {
        // console.log({ top, height, bottom: `${bottom - 1}px` });
        // widget.setStyle({ bottom: new Length(`${bottom - 1}px`) });
        // widget.bottom = dst;
      }

      // const gradient = this.ctx.createLinearGradient(0, 0, 200, 0);

      // // Add color stops to the gradient
      // gradient.addColorStop(0, "red"); // Start with red at 0%
      // gradient.addColorStop(0.5, "green"); // Transition to green at 50%
      // gradient.addColorStop(1, "blue");

      const backgroundColor = background(
        widget.style.backgroundColor,
        widget.style.opacity
      );
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

      this.drawRoundedRect(left, top, width, height, style.borderRadius ?? 10);
      this.ctx.fill();
      if (drawBorder) {
        this.ctx.strokeStyle = style.borderColor ?? "red";
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

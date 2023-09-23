import { KeyCode } from "../types";
import TimerJob from "./Timer";

export default class EventInput extends TimerJob {
  protected width: number;
  protected height: number;
  protected mouseMoveX: number;
  protected mouseMoveY: number;
  protected mouseMovePrevX: number = 0; // temporary value
  protected mouseMovePrevY: number = 0; // temporary value
  protected dx: number;
  protected dy: number;
  protected mouseDownX: number;
  protected mouseDownY: number;
  protected mouseUpX: number;
  protected mouseUpY: number;
  protected isDragging: boolean = false;
  protected lastKey: KeyCode;
  protected isKeyBeingPressed: boolean = false;
  protected isShiftBeingPressed: boolean = false;
  protected isCommandBeingPressed: boolean = false;
  protected keyInputs: string[] = [];
  constructor(width: number, height: number) {
    super();
    this.width = width;
    this.height = height;
  }

  onMouseMove(e: MouseEvent) {
    this.mouseMoveX = e.clientX;
    this.mouseMoveY = e.clientY;
    this.dx = this.mouseMoveX - this.mouseMovePrevX;
    this.dy = this.mouseMoveY - this.mouseMovePrevY;
    this.mouseMovePrevX = this.mouseMoveX;
    this.mouseMovePrevY = this.mouseMoveY;
  }

  onMouseDown(e: MouseEvent) {
    this.mouseDownX = e.clientX;
    this.mouseDownY = e.clientY;
    this.isDragging = true;
  }

  onMouseUp(e: MouseEvent) {
    this.mouseUpX = e.clientX;
    this.mouseUpY = e.clientY;
    this.isDragging = false;
  }

  onKeyDown(e: KeyboardEvent) {
    e.preventDefault();
    this.lastKey = e.key as KeyCode;
    this.keyInputs.push(e.key);
    if (e.shiftKey) {
      this.isShiftBeingPressed = true;
    }
    if (e.metaKey || e.ctrlKey) {
      this.isCommandBeingPressed = true;
    }
    this.isKeyBeingPressed = true;
  }

  onKeyUp(e: KeyboardEvent) {
    this.isKeyBeingPressed = false;
    if (e.shiftKey) {
      this.isShiftBeingPressed = false;
    }
    if (e.metaKey || e.ctrlKey) {
      this.isCommandBeingPressed = false;
    }
  }

  onResize(e: UIEvent) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }
}

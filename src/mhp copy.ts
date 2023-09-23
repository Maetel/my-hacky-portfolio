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
  strPercentToFloat,
  synthImageData,
  uuid,
} from "./utils";
import * as C from "./constants";
import * as s from "./styles";
import { defaultCommands } from "./class/Command";
import VERSION from "./VERSION";
let theCanvas: Canvas;

const isMobile = isMobileDevice();
const isPC = !isMobile;
const mobileSlicer = (array: any[]) => {
  if (isPC) {
    array.pop();
  }
  return array;
};

window.onload = () => {
  console.log(isMobile);
  const theCanvasElement = document.getElementById(
    "theCanvas"
  ) as HTMLCanvasElement;
  const { innerWidth, innerHeight } = window;
  theCanvas = new Canvas(theCanvasElement, innerWidth, innerHeight);

  window.onresize = (event) => theCanvas.onResize(event);
  window.onpointermove = (event) => theCanvas.onMouseMove(event);
  window.onpointerdown = (event) => theCanvas.onMouseDown(event);
  window.onpointerup = (event) => theCanvas.onMouseUp(event);
  window.onkeydown = (event) => theCanvas.onKeyDown(event);
  window.onkeyup = (event) => theCanvas.onKeyUp(event);
  theCanvas.run();
};

class Canvas extends EventInput {
  static version = VERSION;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  currentAnimation: number = 0;
  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    super(width, height);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    this.screenArea = new Area(
      "screen",
      this.screenTop(),
      this.screenBottom(),
      width,
      height
    );
    this.terminalArea = new Area(
      "terminal",
      this.terminalTop(),
      this.terminalBottom(),
      width,
      height
    );

    // set dst
    this.screenDstArea = this.screenArea.copied();
    this.terminalDstArea = this.terminalArea.copied();

    this.setHeight(height);
    this.setWidth(width);

    if (isMobile) {
      this.keyboardArea = new Area(
        "keyboard",
        this.keyboardTop(),
        this.keyboardBottom(),
        width,
        height
      );
      this.keyboardDstArea = this.keyboardArea.copied();
    }

    // set initial events
    // this.termianlTrailerToggler = this.onEveryMs(
    //   C.terminalBlinkInterval,
    //   this.toggleTerminalTrailer
    // );

    // init commands
    const initCommands = () => {
      const commandsAndFunctions: {
        //@ts-ignore
        [key: keyof typeof defaultCommands]: (...args: any[]) => any;
      } = {
        clear: () => {
          this.handleTerminalClear();
          this.nextTerminalState.consoleHistory = [];
        },
        help: () => {
          this.myconsole.info("Available commands: ");
          Object.keys(this.commands)
            .filter((key) => key !== "help")
            .forEach((key) => {
              const desc = this.commands[key].description;
              this.myconsole.log(` - ${key} ${desc ? `: ${desc}` : ""}`);
            });
        },
        close: () => {
          this.closeKeyboard();
        },
      };

      Object.keys(commandsAndFunctions).forEach((key) => {
        this.commands[key] = defaultCommands[key].set(
          commandsAndFunctions[key]
        );
      });
    };
    initCommands();

    this.updateKeyAreas();
  }

  // !ctor
  //////////////////////////////////////////////

  autoCompletableCommands = () =>
    Object.keys(this.commands).filter((key) =>
      key.startsWith(this.nextTerminalState.terminalText)
    );

  myconsole = {
    log: (...args) => {
      const content: string = args.join("");
      this.nextTerminalState.consoleHistory = [
        ...this.nextTerminalState.consoleHistory,
        {
          content,
          type: "common",
          caller: "system",
        },
      ];
      console.log(...args);
    },
    warn: (...args) => {
      const content: string = args.join("");
      this.nextTerminalState.consoleHistory = [
        ...this.nextTerminalState.consoleHistory,
        {
          content,
          type: "warning",
          caller: "system",
        },
      ];
      console.warn(...args);
    },
    error: (...args) => {
      const content: string = args.join("");
      this.nextTerminalState.consoleHistory = [
        ...this.nextTerminalState.consoleHistory,
        {
          content,
          type: "error",
          caller: "system",
        },
      ];
      console.error(...args);
    },
    info: (...args) => {
      const content: string = args.join("");
      this.nextTerminalState.consoleHistory = [
        ...this.nextTerminalState.consoleHistory,
        {
          content,
          type: "info",
          caller: "system",
        },
      ];
      console.info(...args);
    },
    success: (...args) => {
      const content: string = args.join("");
      this.nextTerminalState.consoleHistory = [
        ...this.nextTerminalState.consoleHistory,
        {
          content,
          type: "success",
          caller: "system",
        },
      ];
      console.log(...args);
    },
  };

  runCommand = () => {
    const curText = this.nextTerminalState.terminalText.trim();
    if (curText.length === 0) {
      return;
    }
    const splitArgs = (text: string) => {
      // parse args by spacing and ignore if double quotes
      let args = [];
      let arg = "";
      let inQuote = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
          inQuote = !inQuote;
          continue;
        }
        if (char === " " && !inQuote) {
          args.push(arg);
          arg = "";
          continue;
        }
        arg += char;
      }
      args.push(arg);
      args = args.filter((arg) => arg.trim().length > 0);
      console.log({ args });
      return args;
    };
    const args: string[] = splitArgs(curText);
    const f = this.commands[args[0]]?.f;
    if (!f) {
      this.nextTerminalState.consoleHistory = [
        ...this.nextTerminalState.consoleHistory,
        {
          content: `command not found: ${args[0]}`,
          type: "error",
          caller: "system",
        },
      ];
      return;
    }
    f(...args.slice(1));
  };

  terminalTrailerToggleId: string;
  toggleTerminalTrailer = () => {
    const empty = "";
    this.terminalTrailer =
      this.terminalTrailer === empty || this.terminalTrailer.length === 0
        ? C.terminalTrailer
        : empty;
  };
  terminalTrailer = "";
  terminalTrailerPos = 0;
  terminalHistoryCursor = initialTerminalStates.commandHistory.length;

  setHeight(height: number) {
    this.canvas.height = height;
    this.areas().forEach((area) => area.setScreenHeight(height));
    this.dstAreas().forEach((area) => area.setScreenHeight(height));
  }

  setWidth(width: number) {
    this.canvas.width = width;
    this.areas().forEach((area) => area.setScreenWidth(width));
    this.dstAreas().forEach((area) => area.setScreenWidth(width));
  }

  // @override
  onResize(e: UIEvent) {
    this.cancelAnimation();
    super.onResize(e);
    this.setHeight(this.height);
    this.setWidth(this.width);
    this.run();
  }

  mouseMoveArea: AreaType = "none";
  mouseDownArea: AreaType = "none";
  mouseUpArea: AreaType = "none";
  dragStartArea: AreaType = "none";
  dragEndArea: AreaType = "none";

  getAreaType = (x: number, y: number): AreaType => {
    if (this.screenArea.isInArea(x, y)) {
      return "screen";
    }
    if (this.terminalArea.isInArea(x, y)) {
      return "terminal";
    }
    if (this.keyboardArea.isInArea(x, y)) {
      return "keyboard";
    }
    return "none";
  };

  // @override
  onMouseMove(e: MouseEvent) {
    super.onMouseMove(e);
    this.mouseMoveArea = this.getAreaType(this.mouseMoveX, this.mouseMoveY);
  }

  resetAfterInput: (keyof InputState)[] = ["keyboardCode", "keyCode"];

  prevInputState: InputState = {
    ...initialInputStates,
  };
  prevUIState: UIState = {
    ...initialUIStates,
  };
  prevAnimState: AnimState = {
    ...initialAnimStates,
  };
  prevTerminalState: TerminalState = {
    ...initialTerminalStates,
  };
  prevState: () => State = () => ({
    ...this.prevInputState,
    ...this.prevUIState,
    ...this.prevAnimState,
    ...this.prevTerminalState,
  });

  nextInputState: InputState = {
    ...initialInputStates,
  } as InputState;
  nextUIState: UIState = {
    ...initialUIStates,
  } as UIState;
  nextAnimState: AnimState = {
    ...initialAnimStates,
  };
  nextTerminalState: TerminalState = {
    ...initialTerminalStates,
  };
  nextState: () => State = () => ({
    ...this.nextInputState,
    ...this.nextUIState,
    ...this.nextAnimState,
    ...this.nextTerminalState,
  });

  setUIState = (key: keyof UIState, value: boolean) => {
    this.nextState[key] = value;
  };

  handleTerminalEnter() {
    this.nextTerminalState.commandHistory = [
      ...this.nextTerminalState.commandHistory,
      this.nextTerminalState.terminalText,
    ];
    this.nextTerminalState.consoleHistory = [
      ...this.nextTerminalState.consoleHistory,
      {
        content: this.nextTerminalState.terminalText,
        caller: "terminal",
        type: "common",
      },
    ];
    this.runCommand();
    this.nextTerminalState.terminalText = "";
  }

  handleTerminalClear() {
    this.nextTerminalState.terminalText = "";
    this.terminalTrailerPos = 0;
    this.terminalHistoryCursor = this.nextTerminalState.commandHistory.length;
  }

  handleVirtualKeyInput() {
    if (this.mouseDownArea !== "keyboard") {
      return;
    }
    const x = this.mouseDownX;
    const y = this.mouseDownY;
    const keyInput = this.keyAreas.find((area) => area.contains(x, y));
    if (!keyInput) {
      return;
    }
    console.log({ keyInput });
    this.nextInputState.keyboardCode = keyInput.code;
  }

  handleKeyCode(key: KeyCode) {
    if (!key || !handlableKeyCodes.includes(key)) {
      return;
    }

    this.terminalAreaOffset = 0;

    switch (key) {
      case "Enter":
        this.handleTerminalEnter();
        this.terminalTrailerPos = 0;
        this.terminalTrailer = C.terminalTrailer;
        this.handleTerminalClear();
        break;
      case "Escape":
        this.terminalTrailer = C.terminalTrailer;
        this.handleTerminalClear();
        break;
      case "Backspace":
        if (this.terminalTrailerPos > 0) {
          this.nextTerminalState.terminalText =
            this.nextTerminalState.terminalText.slice(
              0,
              this.terminalTrailerPos - 1
            ) +
            this.nextTerminalState.terminalText.slice(this.terminalTrailerPos);
          this.terminalTrailerPos -= 1;
        }

        this.terminalTrailer = C.terminalTrailer;
        break;
      case "ArrowLeft":
        this.terminalTrailerPos = Math.max(0, this.terminalTrailerPos - 1);
        this.terminalTrailer = C.terminalTrailer;
        break;
      case "ArrowRight":
        this.terminalTrailerPos = Math.min(
          this.nextTerminalState.terminalText.length,
          this.terminalTrailerPos + 1
        );
        this.terminalTrailer = C.terminalTrailer;
        break;
      case "Delete":
        this.nextTerminalState.terminalText =
          this.nextTerminalState.terminalText.slice(
            0,
            this.terminalTrailerPos
          ) +
          this.nextTerminalState.terminalText.slice(
            this.terminalTrailerPos + 1
          );
        this.terminalTrailer = C.terminalTrailer;
        break;
      // TODO
      case "Shift":
      case "Control":
      case "Alt":
      case "Meta":
      case "CapsLock":
      case "Tab":
        break;
      case "ArrowUp":
        console.log({ cursor: this.terminalHistoryCursor });
        if (this.terminalHistoryCursor === -1) {
          break;
        }
        this.terminalHistoryCursor = Math.max(
          0,
          this.terminalHistoryCursor - 1
        );

        this.nextTerminalState.terminalText =
          this.nextTerminalState.commandHistory[this.terminalHistoryCursor] ??
          this.nextTerminalState.terminalText;
        this.terminalTrailerPos = this.nextTerminalState.terminalText.length;
        break;
      case "ArrowDown":
        // console.log({ prevCursor: this.terminalHistoryCursor });
        this.terminalHistoryCursor = Math.min(
          this.nextTerminalState.commandHistory.length,
          this.terminalHistoryCursor + 1
        );
        // console.log({ nextCursor: this.terminalHistoryCursor });
        if (
          this.terminalHistoryCursor ===
          this.nextTerminalState.commandHistory.length
        ) {
          this.handleTerminalClear();
        } else {
          this.nextTerminalState.terminalText =
            this.nextTerminalState.commandHistory[this.terminalHistoryCursor];
        }
        this.terminalTrailerPos = this.nextTerminalState.terminalText.length;

        break;
      default:
        const isCursorAtEnd =
          this.terminalTrailerPos ===
          this.nextTerminalState.terminalText.length;
        if (isCursorAtEnd) {
          this.nextTerminalState.terminalText += key;
          this.terminalTrailerPos = this.nextTerminalState.terminalText.length;
        } else {
          // in the middle
          this.nextTerminalState.terminalText =
            this.nextTerminalState.terminalText.slice(
              0,
              this.terminalTrailerPos
            ) +
            key +
            this.nextTerminalState.terminalText.slice(this.terminalTrailerPos);
          this.terminalTrailerPos += 1;
        }

        this.terminalTrailer = C.terminalTrailer;
        break;
    }
  }

  handleInputStateChange(key: keyof InputState) {
    const prev = this.prevInputState[key];
    const next = this.nextInputState[key];
    // console.log("InputState changed : ", key, { prev, next });
    if (prev === next) {
      return;
    }

    switch (key) {
      case "terminalFocused":
        // open key input
        if (isMobile) {
          console.log("in terminalFocused");
          if (
            next &&
            !this.prevState().keyboardOpened &&
            !this.prevState().keyboardOpening
          ) {
            console.log("open keyboard");
            this.openKeyboard();
          }
        } else {
          if (
            next &&
            !this.prevState().terminalOpened &&
            !this.prevState().terminalOpening
          ) {
            this.openTerminal();
          }
        }
        if (!prev && next) {
          // back to focused
          this.terminalTrailerToggleId = this.onEveryMs(
            C.terminalBlinkInterval,
            this.toggleTerminalTrailer
          );
          this.terminalTrailer = "";
        }
        if (prev && !next) {
          // blurred
          this.killTimerJob(this.terminalTrailerToggleId);
          this.terminalTrailer = "";
        }

        break;
      case "screenFocused":
        // close key input
        if (
          this.prevState().keyboardOpened ||
          this.prevState().keyboardOpening
        ) {
          console.log("close keyboard");
          this.closeKeyboard();
        }
        if (
          this.prevState().terminalOpened ||
          this.prevState().terminalOpening
        ) {
          console.log("close terminal");
          this.closeTerminal();
        }
        break;
      case "keyCode":
      case "keyboardCode":
        if (next) {
          // keyboard input
          this.handleKeyCode(next as KeyCode);
        }
        break;
    }
  }

  handleUIStateChange(key: keyof UIState) {
    const prev = this.prevUIState[key];
    const next = this.nextUIState[key];

    if (prev === next) {
      return;
    }

    switch (key) {
      case "keyboardOpening":
        this.updateKeyAreas();
        if (!prev && next) {
          // animation started
          console.log("keyboard open animation started state watcher");
        }
        if (prev && !next) {
          // animation finished
          console.log("keyboard open animation finished state watcher");
        }
        break;
      case "keyboardClosing":
        if (!prev && next) {
          // animation started
          console.log("keyboard close animation started state watcher");
        }
        if (prev && !next) {
          // animation finished
          console.log("keyboard close animation finished state watcher");
        }
        break;
      case "keyboardOpened":
        if (prev && !next) {
          // keyboard closed
        }
        if (!prev && next) {
          // keyboard opened
          console.log("Set after", { prev, next });
          // this.after(1000, () => {
          //   this.closeKeyboard();
          // });
        }
        break;
      case "terminalOpening":
        if (!prev && next) {
          // animation started
          console.log("terminal open animation started state watcher");
        }
        if (prev && !next) {
          // animation finished
          console.log("terminal open animation finished state watcher");
        }
        break;
      case "terminalClosing":
        if (!prev && next) {
          // animation started
          console.log("terminal close animation started state watcher");
        }
        if (prev && !next) {
          // animation finished
          console.log("terminal close animation finished state watcher");
        }
        break;
      default:
        break;
    }
  }

  handleTerminalStateChange(key: keyof TerminalState) {
    const prev = this.prevTerminalState[key];
    const next = this.nextTerminalState[key];

    if (prev === next) {
      return;
    }

    switch (key) {
      case "consoleHistory":
        this.terminalMaxOffset =
          this.nextTerminalState.consoleHistory.length * 20;
        console.log({ maxOffset: this.terminalMaxOffset });
        break;
      default:
        break;
    }
  }

  handleStateChange() {
    //handle input states first
    const handleInputStateChange = () => {
      const prevInputState = this.prevInputState;
      const nextInputState = this.nextInputState;

      const diffInputKeys = Object.keys(prevInputState).filter(
        (key) =>
          prevInputState[key as keyof InputState] !==
          nextInputState[key as keyof InputState]
      );

      diffInputKeys.forEach((key) => {
        this.handleInputStateChange(key as keyof InputState);
      });
    };
    handleInputStateChange();

    //then handle UI states
    const handleUIStateChange = () => {
      const prevUIState = this.prevUIState;
      const nextUIState = this.nextUIState;

      const diffUIKeys = Object.keys(prevUIState).filter(
        (key) =>
          prevUIState[key as keyof UIState] !==
          nextUIState[key as keyof UIState]
      );

      diffUIKeys.forEach((key) => {
        this.handleUIStateChange(key as keyof UIState);
      });
    };
    handleUIStateChange();

    const handleTerminalStateChange = () => {
      const prevTerminalState = this.prevTerminalState;
      const nextTerminalState = this.nextTerminalState;

      const diffTerminalKeys = Object.keys(prevTerminalState).filter(
        (key) =>
          prevTerminalState[key as keyof TerminalState] !==
          nextTerminalState[key as keyof TerminalState]
      );

      // console.log(prevTerminalState);
      diffTerminalKeys.forEach((key) => {
        this.handleTerminalStateChange(key as keyof TerminalState);
      });
    };
    handleTerminalStateChange();

    // then update prev state
    this.prevInputState = { ...this.nextInputState };
    this.prevUIState = { ...this.nextUIState };
    this.prevTerminalState = { ...this.nextTerminalState };
    this.resetAfterInput.forEach((key) => {
      // @ts-ignore
      this.nextInputState[key] = initialInputStates[key];
    });
  }

  /////////////////////////////////////////////////
  // UI control

  closeKeyboard() {
    this.nextUIState.keyboardClosing = true;
    const onCloseKeyInputFinish = () => {
      this.nextUIState.keyboardClosing = false;
      this.nextUIState.keyboardOpened = false;
      console.log("keyboard fully closed");
    };
    this.setDstTerminalTop(initialTerminalTop, null, onCloseKeyInputFinish);
    this.setDstTerminalBottom(initialTerminalBottom);
  }
  openKeyboard() {
    this.nextUIState.keyboardOpening = true;
    const onOpenKeyboardFinish = () => {
      this.nextUIState.keyboardOpening = false;
      this.nextUIState.keyboardOpened = true;
      console.log("keyboard fully opened");
    };
    this.setDstTerminalTop("200px", null, onOpenKeyboardFinish);
    this.setDstTerminalBottom(`-550px`);
  }

  openTerminal() {
    this.nextUIState.terminalOpening = true;
    const onOpenTerminalFinish = () => {
      this.nextUIState.terminalOpening = false;
      this.nextUIState.terminalOpened = true;
      console.log("terminal fully opened");
    };
    this.setDstTerminalTop("200px", null, onOpenTerminalFinish);
    // this.setDstTerminalBottom(initialTerminalBottom);
  }

  closeTerminal() {
    this.nextUIState.terminalClosing = true;
    const onCloseTerminalFinish = () => {
      this.nextUIState.terminalClosing = false;
      this.nextUIState.terminalOpened = false;
      console.log("terminal fully closed");
    };
    console.log({ initialTerminalTop });
    this.setDstTerminalTop(initialTerminalTop, null, onCloseTerminalFinish);
    // this.setDstTerminalBottom(initialTerminalBottom);
  }

  /////////////////////////////////////////////////
  // input event overrides

  // @override
  onMouseDown(e: MouseEvent) {
    super.onMouseDown(e);
    this.mouseDownArea = this.getAreaType(this.mouseDownX, this.mouseDownY);
    this.dragStartArea = this.mouseDownArea;
    // console.log({ mouseDownArea: this.mouseDownArea });

    this.nextInputState.screenFocused = this.mouseDownArea === "screen";
    this.nextInputState.terminalFocused = this.mouseDownArea === "terminal";
    this.nextInputState.keyboardFocused = this.mouseDownArea === "keyboard";
    if (this.mouseDownArea === "none") {
      this.nextInputState.screenFocused = false;
      this.nextInputState.terminalFocused = false;
      this.nextInputState.keyboardFocused = false;
    }

    if (this.mouseDownArea === "keyboard") {
      this.handleVirtualKeyInput();
    }
  }

  // @override
  onMouseUp(e: MouseEvent) {
    super.onMouseUp(e);
    this.mouseUpArea = this.getAreaType(this.mouseUpX, this.mouseUpY);
    this.dragEndArea = this.mouseUpArea;
  }

  // @override
  onKeyDown(e: KeyboardEvent) {
    super.onKeyDown(e);
    this.nextInputState.keyCode = e.key as KeyCode;
  }

  handleDrag() {
    if (!this.isDragging) {
      return;
    }
    const { mouseMoveX, mouseMoveY, mouseDownX, mouseDownY } = this;
    if (this.dragStartArea === "terminal") {
      // const dx = this.terminalAreaOffset + this.dx;
      if (!isNaN(this.dy)) {
        const dstOffset = this.terminalAreaOffset + this.dy;
        this.terminalAreaOffset = Math.min(
          Math.max(dstOffset, 0),
          this.terminalMaxOffset
        );
      }
    }
  }

  screenAreaOffset = 0;
  terminalAreaOffset = 0;
  terminalMaxOffset = 100;

  screenTop = () => this.areaBreakPoints[0];
  screenBottom = () => this.areaBreakPoints[1];
  terminalTop = () => this.areaBreakPoints[1];
  terminalBottom = () => this.areaBreakPoints[2];
  keyboardTop = () => this.areaBreakPoints[2];
  keyboardBottom = () => this.areaBreakPoints[3];

  screenTopPx = () => this.screenArea.topPx();
  screenBottomPx = () => this.screenArea.bottomPx();
  screenHeightPx = () => this.screenArea.heightInPx();
  terminalTopPx = () => this.terminalArea.topPx();
  terminalBottomPx = () => this.terminalArea.bottomPx();
  terminalHeightPx = () => this.terminalArea.heightInPx();
  keyboardTopPx = () => this.keyboardArea.topPx();
  keyboardBottomPx = () => this.keyboardArea.bottomPx();
  keyboardHeightPx = () => this.keyboardArea.heightInPx();
  areaBreakPoints = mobileSlicer([...initialAreaBreakPoints]);

  /////////////////////////////////////////////////////////
  // set viewports
  setScreenBottom = (ratioOrPercent: number | string) => {
    const ratio =
      typeof ratioOrPercent === "string"
        ? strPercentToFloat(ratioOrPercent)
        : ratioOrPercent;
    this.areaBreakPoints[1] = ratio;
    this.screenArea.setBottom(ratio);
    this.terminalArea.setTop(ratio);
  };

  setTerminalTop = this.setScreenBottom;
  setTerminalBottom = (ratioOrPercent: number | string) => {
    const ratio =
      typeof ratioOrPercent === "string"
        ? strPercentToFloat(ratioOrPercent)
        : ratioOrPercent;
    this.areaBreakPoints[2] = ratio;
    this.terminalArea.setBottom(ratio);
    if (isMobile) {
      this.keyboardArea.setTop(ratio);
    }
  };
  setKeyboardTop = this.setTerminalBottom;

  /////////////////////////////////////////////////
  // set animation dst

  onAreaAnimation = {
    screenStart: [] as (() => void)[],
    terminalStart: [] as (() => void)[],
    keyboardStart: [] as (() => void)[],
    screenFinish: [] as (() => void)[],
    terminalFinish: [] as (() => void)[],
    keyboardFinish: [] as (() => void)[],
  };

  setDstScreenBottom = (
    bottom: number | string,
    onStart?: () => void,
    onFinish?: () => void
  ) => {
    this.screenDstArea.setBottom(bottom);
    this.terminalDstArea.setTop(bottom);
    if (onStart) {
      this.onAreaAnimation.screenStart.push(onStart);
    }
    if (onFinish) {
      this.onAreaAnimation.screenFinish.push(onFinish);
    }
  };

  setDstTerminalTop = (
    top: number | string,
    onStart?: () => void,
    onFinish?: () => void
  ) => {
    this.screenDstArea.setBottom(top);
    this.terminalDstArea.setTop(top);
    if (onStart) {
      this.onAreaAnimation.terminalStart.push(onStart);
    }
    if (onFinish) {
      // console.log("setDstTerminalTop : onFinish pushed");
      this.onAreaAnimation.terminalFinish.push(onFinish);
    }
  };

  setDstTerminalBottom = (
    bottom: number | string,
    onStart?: () => void,
    onFinish?: () => void
  ) => {
    console.log({ bottom });
    this.terminalDstArea.setBottom(bottom);
    if (isMobile) {
      this.keyboardDstArea.setTop(bottom);
    }
    if (onStart) {
      this.onAreaAnimation.terminalStart.push(onStart);
    }
    if (onFinish) {
      this.onAreaAnimation.terminalFinish.push(onFinish);
    }
  };

  // will be init on ctor
  commands: typeof defaultCommands = {} as typeof defaultCommands;

  setDstKeyboardTop = this.setDstTerminalBottom;

  /////////////////////////////////////////////////////////

  screenArea: Area;
  terminalArea: Area;
  keyboardArea: Area;

  // animation dst
  screenDstArea: Area;
  terminalDstArea: Area;
  keyboardDstArea: Area;

  areas = () => {
    return mobileSlicer([
      this.screenArea,
      this.terminalArea,
      this.keyboardArea,
    ]);
  };
  dstAreas = () => {
    return mobileSlicer([
      this.screenDstArea,
      this.terminalDstArea,
      this.keyboardDstArea,
    ]);
  };

  prevRenderStyle = {
    fillStyle: "",
  };

  renderScreen() {
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.width, this.screenHeightPx());

    const retval: RenderData = {
      dx: 0,
      dy: this.screenTopPx(),
      data: this.ctx.getImageData(
        0,
        this.screenTopPx(),
        this.width,
        this.screenBottomPx()
      ),
    };
    return retval;
  }

  renderTerminal() {
    this.ctx.fillStyle = s.terminal.backgroundColor;
    this.ctx.fillRect(
      0,
      this.terminalTopPx(),
      this.width,
      this.terminalHeightPx()
    );

    // render prompt
    const font = `${s.terminal.prompt.fontSize}px ${s.terminal.prompt.font}`;
    this.ctx.font = font;
    this.ctx.fillStyle = s.terminal.prompt.color;

    const textBeforeTrailer =
      C.terminalHeader +
      this.nextTerminalState.terminalText.slice(0, this.terminalTrailerPos);
    const measured = this.ctx.measureText(textBeforeTrailer);

    const promptTop =
      this.terminalBottomPx() - s.terminal.padding + this.terminalAreaOffset;

    const defaultTrailerLength = 15;
    const isTrailerAtEnd =
      textBeforeTrailer.length ===
      C.terminalHeader.length + this.nextTerminalState.terminalText.length;
    const trailerLength = isTrailerAtEnd
      ? defaultTrailerLength
      : this.ctx.measureText(
          this.nextTerminalState.terminalText[this.terminalTrailerPos]
        ).width;
    // console.log({ trailerLength });

    if (this.terminalTrailer.length > 0) {
      const promptUnderbarX = measured.width + s.terminal.padding;
      const promptUnderbarY = promptTop + s.terminal.prompt.trailer.yoffset;
      this.ctx.strokeStyle = s.terminal.prompt.trailer.color;
      this.ctx.lineWidth = s.terminal.prompt.trailer.lineWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(promptUnderbarX, promptUnderbarY);
      this.ctx.lineTo(promptUnderbarX + trailerLength, promptUnderbarY);
      this.ctx.stroke();
    }

    this.ctx.strokeStyle = s.terminal.backgroundColor;
    this.ctx.lineWidth = s.terminal.prompt.trailer.promptOffset;
    this.ctx.strokeText(
      C.terminalHeader + this.nextTerminalState.terminalText,
      s.terminal.padding,
      promptTop
    );

    this.ctx.fillText(
      C.terminalHeader + this.nextTerminalState.terminalText,
      s.terminal.padding,
      promptTop
    );

    // this.ctx.fillText(
    //   this.terminalTrailer,
    //   s.terminal.padding + measured.width,
    //   promptTop
    // );

    // render console
    [...this.nextState().consoleHistory].reverse().forEach((prompt, i) => {
      const top = promptTop - 32 * (i + 1);
      const color = s.terminal.prompt.colors[prompt.type];
      const x =
        s.terminal.padding + this.ctx.measureText(C.terminalHeader).width;
      this.ctx.fillStyle = color;
      if (top > this.terminalTopPx()) {
        this.ctx.fillText(prompt.content, x, top);
      }
    });

    const retval: RenderData = {
      dx: 0,
      dy: this.terminalTopPx(),
      data: this.ctx.getImageData(
        0,
        this.terminalTopPx(),
        this.width,
        this.terminalBottomPx()
      ),
    };
    return retval;
  }
  renderKeyboard() {
    // if (!this.prevState().keyboardOpened || this.prevState().keyboardOpening) {
    //   return;
    // }
    const gradient = this.ctx.createLinearGradient(
      0,
      this.keyboardTopPx(),
      0,
      this.canvas.height
    );

    // Add color stops to the gradient
    gradient.addColorStop(0, "white"); // Light blue at the top
    gradient.addColorStop(1, "lightblue"); // White at the bottom
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(
      0,
      this.keyboardTopPx(),
      this.width,
      this.keyboardHeightPx()
    );

    // draw keyboard in boxes
    const gapX = 2;
    const gapY = 4;
    const paddingHorizontal = 2;
    const maxBoxCount = 10;
    const boxW =
      (this.width - 2 * paddingHorizontal - (maxBoxCount - 1) * gapX) /
      maxBoxCount;
    const boxH = boxW * 1.4;
    const boxX = (i: number) => i * (boxW + gapX) + paddingHorizontal;
    const boxY = (i: number) => i * (boxH + gapY) + gapY;

    const drawRoundedBox = (x, y, width, height, cornerRadius) => {
      // const x = 50; // X-coordinate of the top-left corner
      // const y = 50 + this.keyboardArea.topPx(); // Y-coordinate of the top-left corner
      // const width = 200; // Width of the box
      // const height = 100; // Height of the box
      // const cornerRadius = 20; // Radius of the rounded corners

      // Begin the path
      this.ctx.beginPath();

      // Draw the top horizontal line
      this.ctx.moveTo(x + cornerRadius, y);
      this.ctx.lineTo(x + width - cornerRadius, y);

      // Draw the top-right corner
      this.ctx.arcTo(x + width, y, x + width, y + cornerRadius, cornerRadius);

      // Draw the right vertical line
      this.ctx.lineTo(x + width, y + height - cornerRadius);

      // Draw the bottom-right corner
      this.ctx.arcTo(
        x + width,
        y + height,
        x + width - cornerRadius,
        y + height,
        cornerRadius
      );

      // Draw the bottom horizontal line
      this.ctx.lineTo(x + cornerRadius, y + height);

      // Draw the bottom-left corner
      this.ctx.arcTo(x, y + height, x, y + height - cornerRadius, cornerRadius);

      // Draw the left vertical line
      this.ctx.lineTo(x, y + cornerRadius);

      // Draw the top-left corner
      this.ctx.arcTo(x, y, x + cornerRadius, y, cornerRadius);

      // Close the path
      this.ctx.closePath();

      // Fill the rounded box with a color
      this.ctx.fillStyle = "#fff";
      this.ctx.fill();

      // You can also stroke the path if you want an outline
      this.ctx.strokeStyle = "lightblue";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    };
    const drawLetter = (x, y, c) => {
      this.ctx.fillStyle = "black";
      this.ctx.font = "50px Arial";
      const prev = this.ctx.textAlign;
      this.ctx.textAlign = "center";
      this.ctx.fillText(c, x + boxW / 2 - 5, y + boxH / 2 + 5);
      this.ctx.textAlign = prev;
    };

    const drawQWERTYRow = (dstRow: number) => {
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"].forEach((c, i) => {
        const x = boxX(i);
        const y = boxY(dstRow) + this.keyboardTopPx();
        drawRoundedBox(x, y, boxW, boxH, 10);
        drawLetter(x, y, c);
      });
    };
    const drawASDFRow = (dstRow: number) => {
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"].forEach((c, i) => {
        const x = boxX(i) + boxW * 0.5;
        const y = boxY(dstRow) + this.keyboardTopPx();
        drawRoundedBox(x, y, boxW, boxH, 10);
        drawLetter(x, y, c);
      });
    };
    const drawZXCVRow = (dstRow: number) => {
      ["z", "x", "c", "v", "b", "n", "m"].forEach((c, i) => {
        const x = boxX(i) + boxW * 1.5;
        const y = boxY(dstRow) + this.keyboardTopPx();
        drawRoundedBox(x, y, boxW, boxH, 10);
        drawLetter(x, y, c);
      });
    };
    drawQWERTYRow(0);
    drawASDFRow(1);
    drawZXCVRow(2);

    const retval: RenderData = {
      dx: 0,
      dy: this.keyboardTopPx(),
      data: this.ctx.getImageData(
        0,
        this.keyboardTopPx(),
        this.width,
        this.keyboardBottomPx()
      ),
    };
    return retval;
  }

  updateKeyAreas = () => {
    this.keyAreas = [];
    const gapX = 2;
    const gapY = 4;
    const paddingHorizontal = 2;
    const maxBoxCount = 10;
    const boxW =
      (this.width - 2 * paddingHorizontal - (maxBoxCount - 1) * gapX) /
      maxBoxCount;
    const boxH = boxW * 1.4;
    const boxX = (i: number) => i * (boxW + gapX) + paddingHorizontal;
    const boxY = (i: number) => i * (boxH + gapY) + gapY;

    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"].forEach((c, i) => {
      const x = boxX(i);
      const y = boxY(0) + (isMobile && this.keyboardTopPx());
      const w = boxW;
      const h = boxH;
      this.keyAreas.push(new KeyArea(x, y, w, h, c as KeyCode));
    });

    ["a", "s", "d", "f", "g", "h", "j", "k", "l"].forEach((c, i) => {
      const x = boxX(i) + boxW * 0.5;
      const y = boxY(1) + (isMobile && this.keyboardTopPx());
      const w = boxW;
      const h = boxH;
      this.keyAreas.push(new KeyArea(x, y, w, h, c as KeyCode));
    });

    ["z", "x", "c", "v", "b", "n", "m"].forEach((c, i) => {
      const x = boxX(i) + boxW * 1.5;
      const y = boxY(2) + (isMobile && this.keyboardTopPx());
      const w = boxW;
      const h = boxH;
      this.keyAreas.push(new KeyArea(x, y, w, h, c as KeyCode));
    });

    console.log({ keyAreas: this.keyAreas });
  };

  keyAreas: KeyArea[] = [];

  cancelAnimation() {
    if (0 === this.currentAnimation) {
      return;
    }
    cancelAnimationFrame(this.currentAnimation);
  }

  handleAreaAnimation() {
    const dt = this.dt;
    let velocity: number = -1;
    if (this.nextState().keyboardOpening) {
      velocity = this.nextState().keyboardOpenVelocity * this.dt;
    } else if (this.nextState().keyboardClosing) {
      velocity = this.nextState().keyboardCloseVelocity * this.dt;
    }
    if (this.nextState().terminalOpening) {
      velocity = this.nextState().terminalOpenVelocity * this.dt;
    } else if (this.nextState().terminalClosing) {
      velocity = this.nextState().terminalCloseVelocity * this.dt;
    }
    const convergence = 0.1 + velocity;
    const epsilon = 0.1;

    for (let i = 0; i < this.areas().length; i++) {
      const area = this.areas()[i];
      const prevArea = i === 0 ? null : this.areas()[i - 1];
      const nextArea =
        i === this.areas().length - 1 ? null : this.areas()[i + 1];

      const dstArea = this.dstAreas()[i];
      const dstPrevArea = i === 0 ? null : this.dstAreas()[i - 1];
      const dstNextArea =
        i === this.dstAreas().length - 1 ? null : this.dstAreas()[i + 1];
      const dTop = dstArea.topPx() - area.topPx();
      const dBottom = dstArea.bottomPx() - area.bottomPx();

      const topConverges =
        (convergence > Math.abs(dTop) && Math.abs(dTop) > epsilon) ||
        Math.abs(dTop) <= epsilon;
      if (topConverges) {
        prevArea?.setBottom(dstPrevArea.bottomRatio);
        area.setTop(dstArea.topRatio);
      } else {
        const topIncreasing = dTop > 0;
        const distance = (topIncreasing ? 1 : -1) * velocity;
        area.setTop(`${area.topPx() + distance}px`);
        prevArea?.setBottom(`${prevArea.bottomPx() + distance}px`);
      }

      const bottomConverges =
        (convergence > Math.abs(dBottom) && Math.abs(dBottom) > epsilon) ||
        Math.abs(dBottom) <= epsilon;

      if (bottomConverges) {
        nextArea?.setTop(dstNextArea.topRatio);
        area.setBottom(dstArea.bottomRatio);
      } else {
        const bottomIncreasing = dBottom > 0;
        const distance = (bottomIncreasing ? 1 : -1) * velocity;
        area.setBottom(`${area.bottomPx() + distance}px`);
        nextArea?.setTop(`${nextArea.topPx() + distance}px`);
      }

      if (topConverges && bottomConverges) {
        if (this.onAreaAnimation[`${area.type}Finish`].length > 0) {
          // console.log(
          //   `Converges : this.onAreaAnimation[${area.type}Finish]`,
          //   this.onAreaAnimation[`${area.type}Finish`]
          // );
          this.onAreaAnimation[`${area.type}Finish`].forEach((f) => f());
          this.onAreaAnimation[`${area.type}Finish`] = [];
        }
      }
    }
  }

  handleTimewiseAnimation() {
    this.handleAreaAnimation();
  }

  dt: number;
  lastTimestamp: number;
  dtcount = 0;
  run(timestamp?: number) {
    // console.log(this.dt);
    // const nowTimestamp = timestamp ?? this.now();
    // const lastTimestamp = this.lastTimestamp ?? this.startTimestamp;
    const nowTimestamp = timestamp;
    const lastTimestamp = this.lastTimestamp;
    this.dt = nowTimestamp - lastTimestamp;
    this.lastTimestamp = nowTimestamp;
    // if (this.dtcount < 10) {
    //   this.dtcount++;
    //   console.log({ nowTimestamp, lastTimestamp, dt: this.dt });
    // }

    const rerenders: RenderData[] = [];

    if (!isNaN(this.dt)) {
      if (isMobile) {
        rerenders.push(this.renderTerminal());
        rerenders.push(this.renderKeyboard());
        rerenders.push(this.renderScreen());
      } else {
        rerenders.push(this.renderScreen());
        rerenders.push(this.renderTerminal());
      }

      this.handleTimerJobs();
      this.handleDrag();
      this.handleStateChange();
      this.handleTimewiseAnimation();

      if (false) {
        console.log({
          screenAreaBottom: `${myround(this.screenArea.bottomRatio)} ${myround(
            this.screenDstArea.bottomRatio
          )}`,
          terminalAreaTop: `${myround(this.terminalArea.topRatio)} ${myround(
            this.terminalDstArea.topRatio
          )}`,
          terminalAreaBottom: `${myround(
            this.terminalArea.bottomRatio
          )} ${myround(this.terminalDstArea.bottomRatio)}`,
          keyboardAreaTop: `${myround(this.keyboardArea.topRatio)} ${myround(
            this.keyboardDstArea.topRatio
          )}`,
          keyboardAreaBottom: `${myround(
            this.keyboardArea.bottomRatio
          )} ${myround(this.keyboardDstArea.bottomRatio)}`,
        });
      }
    }

    // case #1. rerender respectively
    rerenders.forEach((renderData) => {
      this.ctx.putImageData(renderData.data, renderData.dx, renderData.dy);
    });

    // case #2. pixelate
    // this.pixelate();

    this.currentAnimation = requestAnimationFrame(this.run.bind(this));
  }

  pixelate() {
    const whole = this.ctx.getImageData(0, 0, this.width, this.height);
    // this.ctx.clearRect(0, 0, this.width, this.height);
    const pixelW = 4;
    const pixelH = 4;
    const cols = Math.ceil(this.width / pixelW);
    const rows = Math.ceil(this.height / pixelH);
    type Pixel = {
      col: number;
      row: number;
      color: string;
    };
    const pixels: Pixel[] = [];
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const x = col * pixelW;
        const y = row * pixelH;
        const r = whole.data[(y * this.width + x) * 4];
        const g = whole.data[(y * this.width + x) * 4 + 1];
        const b = whole.data[(y * this.width + x) * 4 + 2];
        const pixel = {
          col,
          row,
          color: `rgb(${r},${g},${b})`,
        };
        // console.log(pixel.color);
        pixels.push(pixel);
      }
    }

    //draw pixles
    pixels.forEach((pixel) => {
      this.ctx.fillStyle = pixel.color;
      this.ctx.fillRect(pixel.col * pixelW, pixel.row * pixelH, pixelW, pixelH);
    });
  }
}

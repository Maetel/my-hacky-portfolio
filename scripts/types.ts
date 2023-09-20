export type KeyCode =
  | "a"
  | "A"
  | "b"
  | "B"
  | "c"
  | "C"
  | "d"
  | "D"
  | "e"
  | "E"
  | "f"
  | "F"
  | "g"
  | "G"
  | "h"
  | "H"
  | "i"
  | "I"
  | "j"
  | "J"
  | "k"
  | "K"
  | "l"
  | "L"
  | "m"
  | "M"
  | "n"
  | "N"
  | "o"
  | "O"
  | "p"
  | "P"
  | "q"
  | "Q"
  | "r"
  | "R"
  | "s"
  | "S"
  | "t"
  | "T"
  | "u"
  | "U"
  | "v"
  | "V"
  | "w"
  | "W"
  | "x"
  | "X"
  | "y"
  | "Y"
  | "z"
  | "Z"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "0"
  | "-"
  | "="
  | "!"
  | "@"
  | "#"
  | "$"
  | "%"
  | "^"
  | "&"
  | "*"
  | "("
  | ")"
  | "_"
  | "+"
  | "["
  | "]"
  | "{"
  | "}"
  | "\\"
  | "|"
  | ";"
  | ":"
  | "'"
  | '"'
  | ","
  | "."
  | "/"
  | "<"
  | ">"
  | "?"
  | "`"
  | "~"
  | "Backspace"
  | "Delete"
  | "Tab"
  | "Enter"
  | "Shift"
  | "Control"
  | "Alt"
  | "Meta"
  | "CapsLock"
  | "Escape"
  | "Space"
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | null;

export const handlableKeyCodes: ReadonlyArray<KeyCode> = [
  "a",
  "A",
  "b",
  "B",
  "c",
  "C",
  "d",
  "D",
  "e",
  "E",
  "f",
  "F",
  "g",
  "G",
  "h",
  "H",
  "i",
  "I",
  "j",
  "J",
  "k",
  "K",
  "l",
  "L",
  "m",
  "M",
  "n",
  "N",
  "o",
  "O",
  "p",
  "P",
  "q",
  "Q",
  "r",
  "R",
  "s",
  "S",
  "t",
  "T",
  "u",
  "U",
  "v",
  "V",
  "w",
  "W",
  "x",
  "X",
  "y",
  "Y",
  "z",
  "Z",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "-",
  "=",
  "!",
  "@",
  "#",
  "$",
  "%",
  "^",
  "&",
  "*",
  "(",
  ")",
  "_",
  "+",
  "[",
  "]",
  "{",
  "}",
  "\\",
  "|",
  ";",
  ":",
  "'",
  '"',
  ",",
  ".",
  "/",
  "<",
  ">",
  "?",
  "`",
  "~",
  "Backspace",
  "Delete",
  "Tab",
  "Enter",
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "Escape",
  "Space",
  " ",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  null,
] as const;

export type InputState = {
  // handle mouse/key events first
  screenFocused: boolean;
  terminalFocused: boolean;
  keyboardFocused: boolean;
  keyboardCode: KeyCode;
  keyCode: KeyCode;
};

export type UIState = {
  // then handle UI related states
  keyboardOpening: boolean;
  keyboardClosing: boolean;
  keyboardOpened: boolean;
  terminalOpening: boolean;
  terminalClosing: boolean;
  terminalOpened: boolean;
};

export type AnimState = {
  keyboardOpenTimestamp: number;
  keyboardOpenVelocity: number;
  keyboardCloseTimestamp: number;
  keyboardCloseVelocity: number;
  terminalCloseVelocity: number;
  terminalOpenVelocity: number;
};

// derived state
export type Prompt = {
  content: string;
  type: "common" | "error" | "success" | "warning" | "info" | "question";
  caller: "terminal" | "system";
};
export type TerminalState = {
  terminalText: string;
  consoleHistory: Prompt[];
  commandHistory: string[];
};

export type State = InputState & UIState & AnimState & TerminalState;
export type AreaType = "screen" | "terminal" | "keyboard" | "none";

export const BreakPoints = {
  screenTop: 0,
  screenBottom: 1,
  terminalTop: 1,
  terminalBottom: 2,
  keyInputTop: 2,
  keyInputBottom: 3,
} as const;

export type RenderData = {
  dx: number;
  dy: number;
  data: ImageData;
};

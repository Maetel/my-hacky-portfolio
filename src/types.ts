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

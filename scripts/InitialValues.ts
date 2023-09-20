import {
  AnimState,
  BreakPoints,
  InputState,
  TerminalState,
  UIState,
} from "./types";

//////////////////////////////
// UI configure

export const initialAreaBreakPoints = [0.0, 0.8, 1.0, 1.0];
export const initialScreenTop =
  initialAreaBreakPoints[BreakPoints["screenTop"]];
export const initialScreenBottom =
  initialAreaBreakPoints[BreakPoints["screenBottom"]];
export const initialTerminalTop =
  initialAreaBreakPoints[BreakPoints["terminalTop"]];
export const initialTerminalBottom =
  initialAreaBreakPoints[BreakPoints["terminalBottom"]];
export const initialKeyInputTop =
  initialAreaBreakPoints[BreakPoints["keyInputTop"]];
export const initialKeyInputBottom =
  initialAreaBreakPoints[BreakPoints["keyInputBottom"]];

//////////////////////////////
// states

export const initialInputStates: InputState = {
  screenFocused: false,
  terminalFocused: false,
  keyboardFocused: false,
  keyboardCode: null,
  keyCode: null,
};

export const initialUIStates: UIState = {
  keyboardOpening: false,
  keyboardClosing: false,
  keyboardOpened: false,
  terminalOpening: false,
  terminalClosing: false,
  terminalOpened: false,
};

export const initialAnimStates: AnimState = {
  keyboardOpenTimestamp: 0,
  keyboardCloseTimestamp: 0,
  keyboardCloseVelocity: 5,
  keyboardOpenVelocity: 4,
  terminalCloseVelocity: 5,
  terminalOpenVelocity: 4,
};

export const initialTerminalStates: TerminalState = {
  terminalText: "",
  consoleHistory: [
    { content: "a", caller: "system", type: "common" },
    { content: "b", caller: "system", type: "common" },
    { content: "c", caller: "system", type: "common" },
    { content: "d", caller: "system", type: "common" },
    { content: "e", caller: "system", type: "common" },
    { content: "f", caller: "system", type: "common" },
    { content: "g", caller: "system", type: "common" },
    { content: "h", caller: "system", type: "common" },
    { content: "i", caller: "system", type: "common" },
    { content: "j", caller: "system", type: "common" },
    { content: "k", caller: "system", type: "common" },
    { content: "l", caller: "system", type: "common" },
    { content: "m", caller: "system", type: "common" },
    { content: "n", caller: "system", type: "common" },
  ],
  commandHistory: [],
};

export class Command {
  name: string;
  type: "proc" | "windowed" = "proc";
  description: string;
  f?: (...args) => any;
  constructor(name: string, description?: string) {
    this.name = name;
    this.description = description;
  }
  run(...args) {
    this.f?.(...args);
  }
  set(f: (...args) => any) {
    this.f = f;
    return this;
  }
}

export const defaultCommands = {
  clear: new Command("clear", "Clear the terminal screen"),
  help: new Command("help"),
  close: new Command("close", "Minimize terminal window"),
};

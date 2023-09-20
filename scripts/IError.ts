export default function reportError(...args: any[]) {
  throw new Error("[MySDK Error] " + args.join(" "));
}

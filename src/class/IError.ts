export default function error(...args: any[]) {
  console.error("[MHP Error] ", args);
  throw new Error("[MHP Error] " + args.join(" "));
}

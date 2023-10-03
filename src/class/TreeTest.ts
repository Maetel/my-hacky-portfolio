import WidgetStyle, { DefaultStyle } from "@/components/WidgetStyle";
import WidgetManager from "@/components/WidgetManager";
import VirtualWidget, { getRootWidget } from "@/components/Widget";
import Tree from "./Tree";
import VDOM from "@/class/VirtualDOM";
const wmgr = WidgetManager;
let addOrder = 0;

export const createRoot = () => {
  // const root = new Widget({
  //   style: {
  //     ...DefaultStyle,
  //     size: {
  //       left: 0,
  //       top: 0,
  //       width: 1,
  //       height: 1,
  //     },
  //     verAlign: "top",
  //     horAlign: "left",
  //     backgroundColor: "#b0b0b0",
  //     visible: true,
  //     zIndex: 0,
  //     cursor: "default",
  //     font: "Arial",
  //     lineHeight: 20,
  //     textAlign: "left",
  //     fontSize: 20,
  //     fontWeight: 400,
  //     fontStyle: "#000000",
  //     color: "#000000",
  //     position: "global",
  //   },
  //   parent: null,
  //   id: "root",
  // });
  // const root = getRootWidget();
  // const w1 = new Widget({
  //   id: "w1",
  //   style: {
  //     position: "global",
  //     size: {
  //       left: "100px",
  //       top: "100px",
  //       width: "100px",
  //       height: "100px",
  //     },
  //     backgroundColor: "#ff0000",
  //     zIndex: 1,
  //   },
  // });
  // const w1 = new Widget({
  //   id: "w1",
  //   style: {
  //     zIndex: 1,
  //   },
  // });
  // w1.addChildren(
  //   new Widget({ id: "w1_1", style: {} }).addChildren(
  //     new Widget({ id: "w1_1_1" }),
  //     new Widget({ id: "w1_1_2" })
  //   ),
  //   new Widget({ id: "w1_2" }).addChildren(
  //     new Widget({ id: "w1_2_1" }),
  //     new Widget({ id: "w1_2_2" })
  //   ),
  //   new Widget({ id: "w1_3" })
  // );
  // const w2 = new Widget({ id: "w2" });
  // w2.addChildren(
  //   new Widget({
  //     id: "w2_1",
  //     style: {
  //       font: "Arial",
  //     },
  //   }).addChildren(
  //     new Widget({ id: "w2_1_3", style: { font: "inherit" } }),
  //     new Widget({ id: "w2_1_1" }),
  //     new Widget({ id: "w2_1_2" })
  //   ),
  //   new Widget({ id: "w2_2" }).addChildren(
  //     new Widget({ id: "w2_2_1" }),
  //     new Widget({ id: "w2_2_2" })
  //   ),
  //   new Widget({ id: "w2_3" })
  // );
  // root.addChildren(w1, w2);
  // return root;
};

export default function testTree() {
  const root = createRoot();
  const speaker = (w: VirtualWidget, nth) => {
    console.log(`[${nth}]`, w.id);
  };
  // console.log("================== 1. BFS ==================");
  // // iterateBFS(root, speaker);
  // Tree.BFS(root, speaker);

  // console.log("================== 2. DFS ==================");
  // Tree.DFS_ChildrenFirst(root, speaker);
  // Tree.DFS_ParentFirst(root, speaker);

  // const w = Tree.find(root, (w) => w.id === "w1_2");
  // console.log(w?.id);

  // Tree.iterate(
  //   root,
  //   (w) => {
  //     console.log(w.id);
  //   },
  //   "DFS_ChildrenFirst"
  // );

  // debugger;
  // const now = Date.now();
  // const vdom = new VDOM(root);
  // const elapsed = Date.now() - now;
  // console.log({ elapsed });
  // vdom.inflate();
}

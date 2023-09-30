import WidgetStyle from "@/components/WidgetStyle";
import WidgetManager from "@/components/WidgetManager";
import StatelessWidget from "@/components/StatelessWidget";
import Tree from "./Tree";
const wmgr = WidgetManager;
let addOrder = 0;

const createTree = () => {
  const root = new StatelessWidget({
    parent: null,
    id: "root",
  });
  const w1 = new StatelessWidget({ id: "w1" });
  w1.addChildren(
    new StatelessWidget({ id: "w1_1" }).addChildren(
      new StatelessWidget({ id: "w1_1_1" }),
      new StatelessWidget({ id: "w1_1_2" })
    ),
    new StatelessWidget({ id: "w1_2" }).addChildren(
      new StatelessWidget({ id: "w1_2_1" }),
      new StatelessWidget({ id: "w1_2_2" })
    ),
    new StatelessWidget({ id: "w1_3" })
  );

  const w2 = new StatelessWidget({ id: "w2" });
  w2.addChildren(
    new StatelessWidget({ id: "w2_1" }).addChildren(
      new StatelessWidget({ id: "w2_1_1" }),
      new StatelessWidget({ id: "w2_1_2" })
    ),
    new StatelessWidget({ id: "w2_2" }).addChildren(
      new StatelessWidget({ id: "w2_2_1" }),
      new StatelessWidget({ id: "w2_2_2" })
    ),
    new StatelessWidget({ id: "w2_3" })
  );

  root.addChildren(w1, w2);
  return root;
};

export default function testTree() {
  const root = createTree();
  const speaker = (w: StatelessWidget, nth) => {
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

  Tree.iterate(
    root,
    (w) => {
      console.log(w.id);
    },
    "DFS_ChildrenFirst"
  );
}

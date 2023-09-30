import Store from "./class/Store";
import StatefulWidget from "./components/StatefulWidget";
import Widget from "./components/Widget";
import WidgetManager, {
  widgetIds,
  widgets,
  wmgr,
} from "./components/WidgetManager";
import WidgetStyle from "./components/WidgetStyle";

export function initWidgets() {
  // console.log("called");
  // const background = new StatelessWidget("background", null, {
  //   size: {
  //     top: 0,
  //     left: 0,
  //     width: 1,
  //     height: 1,
  //   },
  //   backgroundColor: "#dfdfdf",
  // });
  const firstStyle: WidgetStyle = {
    size: {
      left: "100px",
      width: "80% - 100px",
      top: "100px",
      height: "500px",
    },
    padding: "100px 50px 20px 100px",
    display: "flex",
    // flexDirection: "row",
    backgroundColor: "#ff0000",
    borderRadius: 30,
    opacity: 0.9,
    grabbable: true,
    hover: {
      borderColor: "#0000ff",
      borderWidth: 2,
      cursor: "pointer",
    },
    pointerDown: {
      backgroundColor: "#dd0000",
      borderColor: "#00ff00",
      borderWidth: 3,
      cursor: "grabbing",
    },
  };
  const secondStyle: WidgetStyle = {
    size: {
      // left: "20px",
      // width: "50%",
      // bottom: "50px",
      // height: "100px",
    },
    padding: "20px",
    // backgroundColor: "#00ff00",
    fontSize: 30,
    textAlign: "left",
    // backgroundColor: "transparent",
    opacity: 0.5,
    hover: {
      cursor: "pointer",
      backgroundColor: "#005500",
      borderWidth: 3,
      borderColor: "#6666dd",
    },
    pointerDown: {
      backgroundColor: "#005500",
      borderWidth: 3,
      borderColor: "#6666dd",
    },
    // position: "relative",
  };
  const thirdStyle: WidgetStyle = {
    size: {
      // left: "100px",
      // top: 0.3,
      // width: "100px",
      height: "100px",
    },
    textAlign: "left",
    backgroundColor: "#0000ff",
    opacity: 0.5,
    // position: "relative",
  };
  const first = new Widget({
    style: firstStyle,
  });
  first.addChild(
    new StatefulWidget({
      style: secondStyle,
      text: "hi\nhello asdlkmfasld;kf masldfm adsf a;sdlkm famsd fklmads mfsadkmfdasm fadslkmf",

      callbacks: {
        onBeforeCreate: (w) => {
          console.log("onBeforeCreate, w : ", w.id);
        },
        onDestroyWithCleanup: (w, cleanUp) => {
          console.log("Destroy : ", w.id);
          console.log("Clean up in 1sec");
          setTimeout(() => {
            cleanUp();
            console.log("Cleaned");
            Store.rerender();
          }, 1000);
        },
      },
    })
  );
  first.addChild(
    new Widget({
      text: "This is my text",
      style: thirdStyle,
    })
  );
  // const deleteButton = new StatelessWidget({
  //   callbacks: {
  //     onClick: (w) => {
  //       w.style.backgroundColor = "#9933dd";
  //       console.log("w.children : ", w.children);
  //       const child = w.children.at(0);
  //       if (child) {
  //         child.style.visible = !child.style.visible;
  //       }
  //       Store.rerender();
  //     },
  //   },
  //   style: {
  //     size: {
  //       right: 0,
  //       bottom: 0,
  //       width: "100px",
  //       height: "60px",
  //     },
  //     position: "relative",
  //     backgroundColor: "#0000ff",
  //   },
  // }).addChild(
  //   new StatelessWidget({
  //     callbacks: {
  //       onClick: (w) => {
  //         // wmgr.widgets = wmgr.widgets.filter(
  //         //   (widget) => widget.id !== "stls-0"
  //         // );
  //         wmgr.remove("stls-0").then(() => {
  //           console.log("Final then, widgets:", widgetIds());
  //           // Store.rerender();
  //         });
  //       },
  //     },

  //     style: {
  //       visible: false,
  //       size: {
  //         right: 0,
  //         bottom: "200px",
  //         width: "100px",
  //         height: "60px",
  //       },
  //       backgroundColor: "#ffdf0d",
  //     },
  //   })
  // );

  console.log(
    "Widget Ids : ",
    widgets().map((w) => w.id)
  );
}

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
  console.log("initWidgets");
  const w1 = new Widget({
    text: "a b c d e f g h i j k l m n o p q r s t u v w x y z",
    id: "w1",
    style: {
      position: "global",
      size: {
        width: "280px",
        left: "10%",
        top: "100px",
        // width: "300px",
        // height: "300px",
      },
      hover: {
        backgroundColor: "#0000ff55",
        cursor: "pointer",
        borderRadius: 30,
        borderColor: "#0000ff",
        borderWidth: 20,
      },
      pointerDown: {
        backgroundColor: "#0000ffaa",
        cursor: "grabbing",
      },
      // padding: "50px",
      color: "white",
      // borderRadius: 20,
      backgroundColor: "red",
      display: "flex",
      // flexDirection: "row",
      grabbable: true,
    },
  });
  console.log({ w1 });
  const w2 = new Widget({
    parent: w1,
    text: "w2",
    id: "w2",
    style: {
      // size: {
      //   left: "100px",
      //   top: "100px",
      //   width: "300px",
      //   height: "300px",
      // },
      // margin: "10px 0px",
      padding: "50px",
      color: "black",
      // borderRadius: 20,
      backgroundColor: "blue",
    },
  });
  const w3 = new Widget({
    parent: w1,
    text: "w3. lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    id: "w3",
    style: {
      size: {
        right: "20px",
        bottom: "20px",
        width: "250px",
        height: "80px",
      },
      padding: "10px",
      color: "black",
      // position: "relative",
      // borderRadius: 20,
      backgroundColor: "white",
    },
  });

  const w4 = new Widget({
    // text: "a b c d e f g h i j k l m n o p q r s t u v w x y z",
    id: "w4",
    style: {
      position: "global",
      size: {
        left: "100px",
        top: "400px",
        width: "200px",
        // height: "300px",
      },
      // padding: "50px",
      color: "white",
      // borderRadius: 20,
      backgroundColor: "pink",
      display: "flex",
      flexDirection: "row",
      // overflowX: "hidden",
    },
  });
  console.log({ w1 });
  new Widget({
    parent: w4,
    text: "w5",
    id: "w5",
    style: {
      size: {
        //   left: "100px",
        //   top: "100px",
        width: "50px",
        //   height: "300px",
      },
      // margin: "10px 0px",
      // padding: "50px",
      color: "black",
      // borderRadius: 20,
      backgroundColor: "cyan",
      // flex: 1,
    },
  });
  new Widget({
    parent: w4,
    text: "w4. lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    id: "w6",
    style: {
      size: {
        right: "20px",
        bottom: "20px",
        width: "300px",
        height: "100px",
      },
      grabbable: true,
      padding: "10px",
      color: "black",
      // position: "relative",
      // borderRadius: 20,
      backgroundColor: "green",
      // flex: 1,
    },
  });

  const rbButtons = new Widget({
    id: "buttons",
    style: {
      size: {
        right: 0,
        bottom: 0,
        width: "110px",
        // width: "200px",
      },
      position: "global",
      padding: "10px",
      backgroundColor: "lime",
    },
  });

  new Widget({
    id: "toggleNoise",
    text: "Noise [ON]",
    parent: rbButtons,
    style: {
      size: {
        // width: 0.9,
      },
      // position: "absolute",
      padding: "10px",
      backgroundColor: "#46ff83",
      hover: {
        cursor: "pointer",
        backgroundColor: "#46aa83",
      },
      pointerDown: {
        cursor: "pointer",
        backgroundColor: "#308802",
      },
    },
  });
  new Widget({
    parent: rbButtons,
    id: "toggleRuler",
    text: "Ruler [OFF]",
    style: {
      size: {
        // width: 0.9,
      },
      // position: "absolute",
      padding: "10px",
      backgroundColor: "#ff8346",
      hover: {
        cursor: "pointer",
        backgroundColor: "#aa8346",
      },
      pointerDown: {
        cursor: "pointer",
        backgroundColor: "#880230",
      },
    },
  });
  new Widget({
    parent: rbButtons,
    id: "toggleFPS",
    text: "FPS [OFF]",
    style: {
      size: {
        // width: 0.9,
      },
      // position: "absolute",
      padding: "10px",
      backgroundColor: "#8346ff",
      hover: {
        cursor: "pointer",
        backgroundColor: "#8346aa",
      },
      pointerDown: {
        cursor: "pointer",
        backgroundColor: "#023088",
      },
    },
  });
  new Widget({
    parent: rbButtons,
    id: "widgetList",
    text: "",
    style: {},
  });
}
export function _initWidgets() {
  // console.log("called");
  // const background = new StatelessWidget("background", null, {
  //   size: {i
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

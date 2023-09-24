import Store from "./class/Store";
import StatefulWidget from "./components/StatefulWidget";
import StatelessWidget from "./components/StatelessWidget";
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
      left: 0.1,
      width: 0.8,
      top: 0.1,
      height: 0.5,
    },
    backgroundColor: "#ff0000",
    borderRadius: 30,
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
      left: "20px",
      width: "50%",
      bottom: "50px",
      height: "350px",
    },
    backgroundColor: "#00ff00",
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
  };
  const thirdStyle: WidgetStyle = {
    size: {
      left: "100px",
      top: 0.3,
      width: "100px",
      height: 0.4,
    },
    backgroundColor: "#0000ff",
    opacity: 0.5,
  };
  const first = new StatelessWidget({
    style: firstStyle,
  });
  first.addChild(new StatefulWidget({ style: secondStyle }));
  first.children.at(0)?.addChild(new StatelessWidget({ style: thirdStyle }));
  const deleteButton = new StatelessWidget({
    onClick: (w) => {
      w.style.backgroundColor = "#9933dd";
      console.log("w.children : ", w.children);
      const child = w.children.at(0);
      if (child) {
        child.style.visible = !child.style.visible;
      }
      Store.rerender();
    },
    style: {
      size: {
        right: 0,
        bottom: 0,
        width: "100px",
        height: "60px",
      },
      backgroundColor: "#0000ff",
    },
  }).addChild(
    new StatelessWidget({
      onClick: (w) => {
        // wmgr.widgets = wmgr.widgets.filter(
        //   (widget) => widget.id !== "stls-0"
        // );
        wmgr.remove("stls-0").then(() => {
          console.log("Final then, widgets:", widgetIds());
          // Store.rerender();
        });
      },
      style: {
        visible: false,
        size: {
          right: 0,
          bottom: "200px",
          width: "100px",
          height: "60px",
        },
        backgroundColor: "#ffdf0d",
      },
    })
  );
  // console.log({ fid: first.id, sid: second.id });
  // const first = new StatelessWidget("first", null);
  // const second = new StatefulWidget("second", first, {
  //   size: {
  //     left: "100px",
  //     bottom: "100px",
  //     width: "250px",
  //     height: "350px",
  //   },
  //   backgroundColor: "#00ff00",
  //   // backgroundColor: "transparent",
  //   opacity: 0.5,
  // });
  // const third = new StatefulWidget("third", second, {
  //   size: {
  //     left: "100px",
  //     top: 0.3,
  //     width: "100px",
  //     height: 0.4,
  //   },
  //   backgroundColor: "#0000ff",
  //   opacity: 0.5,
  // });
  // WidgetManager.push(background, first, second);
  // WidgetManager.push(first, second, third);
  // WidgetManager.push(first);

  // console.log("Widgets : ", widgets);
  console.log(
    "Widget Ids : ",
    widgets().map((w) => w.id)
  );
}

export default class Store {
  static _store: Map<string | number, any> = new Map();
  static get(key: string | number) {
    const retval = Store._store.get(key);
    if (retval === undefined) {
      throw new Error(`Store.get() : key not found : ${key}`);
    }
    return retval;
  }
  static set(key: string | number, value: any) {
    Store._store.set(key, value);
  }
  static has(key: string | number) {
    return Store._store.has(key);
  }
  static delete(key: string | number) {
    Store._store.delete(key);
  }
  static clear() {
    Store._store.clear();
  }
  static upsert(key: string | number, fn: (value: any) => any) {
    // update
    if (Store.has(key)) {
      const val = fn(Store.get(key));
      Store.set(key, val);
      return val;
    }

    // insert
    const val = fn(null);
    Store.set(key, val);
    return val;
  }

  ////////////////////////////////////////////////////////////////////////
  // Predefined value handlers

  static getNewWidgetAddOrder = (): STORE_WIDGET_ADD_ORDER_TYPE => {
    return Store.upsert(STORE_WIDGET_ADD_ORDER, (val: number) => {
      // console.log("getNewWidgetAddOrder, val: ", val);
      return val === null ? 0 : val + 1;
    });
  };
  static getLastWidgetAddOrder = (): STORE_WIDGET_ADD_ORDER_TYPE => {
    return Store.get(STORE_WIDGET_ADD_ORDER);
  };

  // static get onStatelessChildAdded(): STORE_ON_STLES_CHILD_ADDED_TYPE {
  //   return Store.get(STORE_ON_STLES_CHILD_ADDED);
  // }

  static get onStatelessWidgetCreate(): STORE_ON_STLES_CREATE_TYPE {
    return Store.get(STORE_ON_STLES_CREATE);
  }

  static get sortWidgets(): STORE_SORT_WIDGETS_TYPE {
    return Store.get(STORE_SORT_WIDGETS);
  }

  static get removeWidgetFromList(): STORE_REMOVE_WIDGET_FROM_LIST_TYPE {
    return Store.get(STORE_REMOVE_WIDGET_FROM_LIST);
  }

  static get deleteWidget(): STORE_DELETE_WIDGET_TYPE {
    return Store.get(STORE_DELETE_WIDGET);
  }

  static get rerender(): STORE_RERENDER_TYPE {
    return Store.get(STORE_RERENDER);
  }
}

export const STORE_WIDGET_ADD_ORDER = "STORE_WIDGET_ADD_ORDER" as const;
export type STORE_WIDGET_ADD_ORDER_TYPE = number;
export const STORE_ON_STLES_CREATE = "STORE_ON_STLES_CREATE" as const;
export type STORE_ON_STLES_CREATE_TYPE = (stls) => any;
export const STORE_SORT_WIDGETS = "STORE_SORT_WIDGETS" as const;
export type STORE_SORT_WIDGETS_TYPE = () => any;
export const STORE_DELETE_WIDGET = "STORE_DELETE_WIDGET" as const;
export type STORE_DELETE_WIDGET_TYPE = (widget) => any;
export const STORE_RERENDER = "STORE_RERENDER" as const;
export type STORE_RERENDER_TYPE = () => any;
export const STORE_REMOVE_WIDGET_FROM_LIST =
  "STORE_REMOVE_WIDGET_FROM_LIST" as const;
export type STORE_REMOVE_WIDGET_FROM_LIST_TYPE = (widget) => any;

// export const STORE_ON_STLES_CHILD_ADDED = "STORE_ON_STLES_CHILD_ADDED" as const;
// export type STORE_ON_STLES_CHILD_ADDED_TYPE = (parent, child) => any;

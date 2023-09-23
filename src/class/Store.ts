export default class Store {
  static _store: Map<string | number, any> = new Map();
  static get(key: string | number) {
    return Store._store.get(key);
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
    if (Store.has(key)) {
      Store.set(key, fn(Store.get(key)));
    } else {
      Store.set(key, fn(null));
    }
  }
}

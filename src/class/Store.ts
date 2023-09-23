export default class Store {
  static _store: Map<string | number, any> = new Map();
  static get(key: string | number) {
    return this._store.get(key);
  }
  static set(key: string | number, value: any) {
    this._store.set(key, value);
  }
  static has(key: string | number) {
    return this._store.has(key);
  }
  static delete(key: string | number) {
    this._store.delete(key);
  }
  static clear() {
    this._store.clear();
  }
}

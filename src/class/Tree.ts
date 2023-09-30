export type TreeSearchType = "BFS" | "DFS_ChildrenFirst" | "DFS_ParentFirst";
export default class Tree {
  // return undefined if not found any
  static findAll<T>(
    root: T,
    predicate: (node: T) => boolean,
    type: TreeSearchType = "BFS"
  ): T[] | undefined {
    let found: T[] = [];
    switch (type) {
      case "BFS":
        BFS(root, (w) => {
          if (predicate(w)) {
            found.concat(w);
          }
        });
        break;
      case "DFS_ChildrenFirst":
        DFS_ChildrenFirst(root, (w) => {
          if (predicate(w)) {
            found.concat(w);
          }
        });
        break;
      case "DFS_ParentFirst":
        DFS_ParentFirst(root, (w) => {
          if (predicate(w)) {
            found.concat(w);
          }
        });
        break;
    }
    return found.length > 0 ? found : undefined;
  }

  static find<T>(
    root: T,
    predicate: (node: T) => boolean,
    type: TreeSearchType = "BFS"
  ): T | undefined {
    let stop = false;
    let found = undefined;
    switch (type) {
      case "BFS":
        BFS(root, (w) => {
          if (!stop && predicate(w)) {
            found = w;
            stop = true;
          }
        });
        break;
      case "DFS_ChildrenFirst":
        DFS_ChildrenFirst(root, (w) => {
          if (!stop && predicate(w)) {
            found = w;
            stop = true;
          }
        });
        break;
      case "DFS_ParentFirst":
        DFS_ParentFirst(root, (w) => {
          if (!stop && predicate(w)) {
            found = w;
            stop = true;
          }
        });
        break;
    }
    return found;
  }

  static iterate<T>(
    root: T,
    cb: (node: T, nth?: number) => any,
    type: TreeSearchType = "BFS"
  ) {
    switch (type) {
      case "BFS":
        BFS(root, cb);
        break;
      case "DFS_ChildrenFirst":
        DFS_ChildrenFirst(root, cb);
        break;
      case "DFS_ParentFirst":
        DFS_ParentFirst(root, cb);
        break;
    }
  }

  static removeAll<T>(
    root: T,
    predicate: (node: T) => boolean,
    type: TreeSearchType = "DFS_ChildrenFirst"
  ) {
    Tree.findAll(root, predicate, type)?.forEach((w) => w.delete?.());
  }
}

function BFS<T, U = (val: T, nth?: number) => any>(root: T, cb: U, nth = 0) {
  const queue = [root];
  while (queue.length) {
    const w = queue.shift();
    cb(w, nth++);
    queue.push(...w.children);
  }
}

function DFS_ChildrenFirst<T, U = (val: T, idx: number) => any>(
  root: T,
  cb: U,
  startIdx = 0
) {
  let n = startIdx;
  const dfs = (w: T, nth = 0) => {
    w.children.forEach((child) => {
      dfs(child);
    });
    cb(w, n++);
  };
  dfs(root);
}

function DFS_ParentFirst<T, U = (val: T, idx: number) => any>(
  root: T,
  cb: U,
  startIdx = 0
) {
  let n = startIdx;
  const dfs = (w: T, nth = 0) => {
    cb(w, n++);
    w.children.forEach((child) => {
      dfs(child);
    });
  };
  dfs(root);
}

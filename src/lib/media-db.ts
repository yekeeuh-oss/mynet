const databaseName = "my-diary-media";
const storeName = "blobs";

export const mediaKeys = {
  diaryBackground: "diary-background",
  galleryBackground: "gallery-background",
} as const;

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexeddb-unavailable"));
      return;
    }
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("indexeddb-open"));
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
) {
  return openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        let settled = false;
        const fail = (error: unknown) => {
          if (settled) return;
          settled = true;
          database.close();
          reject(error);
        };
        const transaction = database.transaction(storeName, mode);
        const request = run(transaction.objectStore(storeName));
        request.onsuccess = () => {
          if (settled) return;
          settled = true;
          resolve(request.result);
        };
        request.onerror = () => fail(request.error ?? new Error("indexeddb-request"));
        transaction.oncomplete = () => database.close();
        transaction.onerror = () =>
          fail(transaction.error ?? new Error("indexeddb-transaction"));
      }),
  );
}

export async function putMedia(id: string, dataUrl: string) {
  await withStore("readwrite", (store) => store.put(dataUrl, id));
}

export async function getMedia(id: string) {
  try {
    const value = await withStore<string | undefined>("readonly", (store) =>
      store.get(id),
    );
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

export async function deleteMedia(id: string) {
  try {
    await withStore("readwrite", (store) => store.delete(id));
  } catch {
    /* The picture is already gone, or storage is unavailable. */
  }
}

export function isMediaRef(value: string) {
  return value.startsWith("idb:");
}

export function mediaIdFromRef(value: string) {
  return value.slice(4);
}

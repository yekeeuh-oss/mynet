const databaseName = "my-diary-media";
const databaseVersion = 2;
const storeName = "blobs";
const fileStoreName = "files";

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
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName);
      }
      if (!database.objectStoreNames.contains(fileStoreName)) {
        database.createObjectStore(fileStoreName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("indexeddb-open"));
  });
}

function withStore<T>(
  name: string,
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
        const transaction = database.transaction(name, mode);
        const request = run(transaction.objectStore(name));
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
  await withStore(storeName, "readwrite", (store) => store.put(dataUrl, id));
}

export async function getMedia(id: string) {
  try {
    const value = await withStore<string | undefined>(storeName, "readonly", (store) =>
      store.get(id),
    );
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

export async function deleteMedia(id: string) {
  try {
    await withStore(storeName, "readwrite", (store) => store.delete(id));
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

export function cardSkinMediaId(cardId: string) {
  return `card-skin-${cardId}`;
}

export async function putFile(id: string, file: Blob) {
  await withStore(fileStoreName, "readwrite", (store) => store.put(file, id));
}

export async function getFile(id: string) {
  try {
    const value = await withStore<Blob | undefined>(fileStoreName, "readonly", (store) =>
      store.get(id),
    );
    return value instanceof Blob ? value : null;
  } catch {
    return null;
  }
}

export async function deleteFile(id: string) {
  try {
    await withStore(fileStoreName, "readwrite", (store) => store.delete(id));
  } catch {
    /* The audio file is already gone, or storage is unavailable. */
  }
}

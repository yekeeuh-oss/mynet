const maxEdge = 1600;
const maxCharacters = 1_200_000;

export function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("not-image"));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      reject(new Error("too-large"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("read-failed"));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result.startsWith("data:image/")) {
        reject(new Error("not-image"));
        return;
      }
      void compressDataUrl(result, file.type).then(resolve).catch(() => resolve(result));
    };
    reader.readAsDataURL(file);
  });
}

function compressDataUrl(dataUrl: string, type: string) {
  if (type === "image/svg+xml" || dataUrl.length < maxCharacters) {
    return Promise.resolve(dataUrl);
  }
  return new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
      if (scale === 1 && dataUrl.length < maxCharacters) {
        resolve(dataUrl);
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(dataUrl);
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

export function imageFileFromList(files: FileList | File[] | null) {
  if (!files) return null;
  return [...files].find((file) => file.type.startsWith("image/")) ?? null;
}

export function imageFileFromClipboard(data: DataTransfer | null) {
  if (!data) return null;
  const fromFiles = imageFileFromList(data.files);
  if (fromFiles) return fromFiles;
  for (const item of data.items) {
    if (item.type.startsWith("image/")) return item.getAsFile();
  }
  return null;
}

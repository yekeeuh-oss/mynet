export type CapsuleLetter = {
  id: string;
  title: string;
  unlockAt: string;
  createdAt: string;
  salt: string;
  iv: string;
  ciphertext: string;
};

const capsuleKey = "my-diary.capsules";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: 80000,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function sealLetter(title: string, body: string, unlockAt: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encoded = new TextEncoder().encode(body);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const letter: CapsuleLetter = {
    id: crypto.randomUUID(),
    title: title.trim(),
    unlockAt,
    createdAt: new Date().toISOString(),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(cipher)),
  };
  return letter;
}

export async function openLetter(letter: CapsuleLetter, password: string) {
  const key = await deriveKey(password, base64ToBytes(letter.salt));
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(letter.iv) },
    key,
    base64ToBytes(letter.ciphertext),
  );
  return new TextDecoder().decode(plain);
}

function parseLetter(value: unknown): CapsuleLetter | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.unlockAt !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.salt !== "string" ||
    typeof value.iv !== "string" ||
    typeof value.ciphertext !== "string"
  ) {
    return null;
  }
  return {
    id: value.id,
    title: value.title,
    unlockAt: value.unlockAt,
    createdAt: value.createdAt,
    salt: value.salt,
    iv: value.iv,
    ciphertext: value.ciphertext,
  };
}

export function loadCapsules() {
  try {
    const raw = localStorage.getItem(capsuleKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const letter = parseLetter(item);
      return letter ? [letter] : [];
    });
  } catch {
    return [];
  }
}

export function saveCapsules(letters: CapsuleLetter[]) {
  try {
    localStorage.setItem(capsuleKey, JSON.stringify(letters));
  } catch {
    /* Ignore quota and private-mode failures. */
  }
}

export function countdownLabel(unlockAt: string, now = Date.now()) {
  const remain = new Date(unlockAt).getTime() - now;
  if (remain <= 0) return "可以拆开了";
  const minutes = Math.floor(remain / 60000);
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days} 天 ${hours} 小时`;
  if (hours > 0) return `${hours} 小时 ${mins} 分`;
  return `${Math.max(mins, 1)} 分钟`;
}

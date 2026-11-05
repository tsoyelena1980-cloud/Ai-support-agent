export type KeyValidationStatus =
  | "UNSET"
  | "LEGACY_AIZA_REJECTED"
  | "MALFORMED_AQ_KEY"
  | "VERIFYING_NETWORK"
  | "VALID_ACTIVE"
  | "UNAUTHORIZED_REMOTE";

export interface KeyValidationResult {
  status: KeyValidationStatus;
  maskedKey: string | null;
  errorMessage?: string;
}

const REGEX_LEGACY_AIZA = /^AIza[0-9A-Za-z\-_]{30,}/;
const REGEX_NEW_AQ_KEY = /^AQ\.[0-9A-Za-z\-_\.]{20,}$/;

export const VAULT_STORAGE_KEY = "kitsune_aq_vault_v1";
export const PIN_PATTERN = /^\d{4,8}$/;

export interface VaultRecord {
  cipherTextBase64: string;
  ivBase64: string;
  saltBase64: string;
  createdAt: number;
}

export function validateApiKeyFormat(rawInput: string): KeyValidationResult {
  const trimmed = rawInput.trim();

  if (!trimmed) {
    return { status: "UNSET", maskedKey: null };
  }

  if (trimmed.startsWith("AIza") || REGEX_LEGACY_AIZA.test(trimmed)) {
    return {
      status: "LEGACY_AIZA_REJECTED",
      maskedKey: null,
      errorMessage:
        "Ключи старого формата Standard (AIza...) не поддерживаются с сентября 2026 года. Создайте новый ключ авторизации с префиксом AQ. в Google AI Studio.",
    };
  }

  if (!REGEX_NEW_AQ_KEY.test(trimmed)) {
    return {
      status: "MALFORMED_AQ_KEY",
      maskedKey: null,
      errorMessage:
        'Некорректный формат ключа. Ключ должен начинаться с префикса "AQ." и содержать не менее 23 символов.',
    };
  }

  const masked = `${trimmed.slice(0, 5)}••••${trimmed.slice(-4)}`;
  return { status: "VERIFYING_NETWORK", maskedKey: masked };
}

export function maskApiKey(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (trimmed.length < 9) return "AQ.•";
  return `${trimmed.slice(0, 5)}••••${trimmed.slice(-4)}`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveAesKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 100_000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptApiKey(apiKey: string, pin: string): Promise<VaultRecord> {
  if (!PIN_PATTERN.test(pin)) {
    throw new Error("PIN-код должен состоять из 4–8 цифр.");
  }
  const format = validateApiKeyFormat(apiKey);
  if (format.status !== "VERIFYING_NETWORK") {
    throw new Error(format.errorMessage ?? "Ключ не подходит для хранения.");
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await deriveAesKey(pin, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    new TextEncoder().encode(apiKey.trim()),
  );

  return {
    cipherTextBase64: bytesToBase64(new Uint8Array(cipher)),
    ivBase64: bytesToBase64(iv),
    saltBase64: bytesToBase64(salt),
    createdAt: Date.now(),
  };
}

export async function decryptApiKey(vault: VaultRecord, pin: string): Promise<string> {
  if (!PIN_PATTERN.test(pin)) {
    throw new Error("PIN-код должен состоять из 4–8 цифр.");
  }
  const aesKey = await deriveAesKey(pin, base64ToBytes(vault.saltBase64));
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(vault.ivBase64) as BufferSource },
    aesKey,
    base64ToBytes(vault.cipherTextBase64) as BufferSource,
  );
  return new TextDecoder().decode(plain);
}

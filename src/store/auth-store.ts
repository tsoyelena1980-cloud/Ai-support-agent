import { create } from "zustand";
import {
  decryptApiKey,
  encryptApiKey,
  maskApiKey,
  PIN_PATTERN,
  validateApiKeyFormat,
  VAULT_STORAGE_KEY,
  type KeyValidationStatus,
  type VaultRecord,
} from "@/lib/key-vault";
import { probeApiKey } from "@/lib/gemini-transport";

interface AuthState {
  status: KeyValidationStatus;
  apiKey: string | null;
  maskedKey: string | null;
  errorMessage?: string;
  vaultPresent: boolean;
  setVaultPresent: (value: boolean) => void;
  submitKey: (raw: string, pin?: string) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<void>;
  forgetKey: (eraseVault: boolean) => void;
}

async function activateKey(
  raw: string,
  set: (partial: Partial<AuthState>) => void,
): Promise<boolean> {
  const format = validateApiKeyFormat(raw);
  if (format.status !== "VERIFYING_NETWORK") {
    set({
      status: format.status,
      apiKey: null,
      maskedKey: null,
      errorMessage: format.errorMessage,
    });
    return false;
  }
  set({ status: "VERIFYING_NETWORK", maskedKey: format.maskedKey, errorMessage: undefined, apiKey: null });
  try {
    const status = await probeApiKey(raw.trim());
    if (status < 200 || status >= 300) {
      set({
        status: "UNAUTHORIZED_REMOTE",
        apiKey: null,
        maskedKey: format.maskedKey,
        errorMessage:
          status === 401 || status === 403
            ? "Google AI Studio отклонил ключ. Проверьте, что это новый ключ авторизации AQ."
            : `Проверка ключа завершилась ответом ${status}.`,
      });
      return false;
    }
  } catch {
    set({
      status: "UNAUTHORIZED_REMOTE",
      apiKey: null,
      maskedKey: null,
      errorMessage: "Не удалось связаться с Google. Ключ не отправлялся на сервер ресторана.",
    });
    return false;
  }
  set({
    status: "VALID_ACTIVE",
    apiKey: raw.trim(),
    maskedKey: format.maskedKey ?? maskApiKey(raw),
    errorMessage: undefined,
  });
  return true;
}

export const useAuth = create<AuthState>((set, get) => ({
  status: "UNSET",
  apiKey: null,
  maskedKey: null,
  vaultPresent: false,
  setVaultPresent: (vaultPresent) => set({ vaultPresent }),
  submitKey: async (raw, pin) => {
    const active = await activateKey(raw, set);
    if (!active || !pin) return;
    if (!PIN_PATTERN.test(pin)) {
      set({ errorMessage: "PIN-код должен состоять из 4–8 цифр. Ключ активен только в этой вкладке." });
      return;
    }
    const vault = await encryptApiKey(get().apiKey ?? raw, pin);
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
    set({ vaultPresent: true });
  },
  unlockWithPin: async (pin) => {
    const rawVault = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!rawVault) {
      set({ vaultPresent: false, errorMessage: "Сохранённого ключа нет." });
      return;
    }
    try {
      const vault = JSON.parse(rawVault) as VaultRecord;
      const apiKey = await decryptApiKey(vault, pin);
      await activateKey(apiKey, set);
    } catch {
      set({ errorMessage: "PIN не подошёл или сейф повреждён. Ключ остался зашифрованным." });
    }
  },
  forgetKey: (eraseVault) => {
    if (eraseVault) localStorage.removeItem(VAULT_STORAGE_KEY);
    set({
      status: "UNSET",
      apiKey: null,
      maskedKey: null,
      errorMessage: undefined,
      vaultPresent: eraseVault ? false : get().vaultPresent,
    });
  },
}));

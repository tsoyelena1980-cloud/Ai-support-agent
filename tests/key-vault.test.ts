import assert from "node:assert/strict";
import test from "node:test";
import { decryptApiKey, encryptApiKey, validateApiKeyFormat } from "../src/lib/key-vault";

const AQ_KEY = "AQ.Ab8RN6LEVE_demo_key_padding";

test("TC-01 rejects legacy AIza keys", () => {
  const result = validateApiKeyFormat("AIzaSyD-9981234567890abcdef");
  assert.equal(result.status, "LEGACY_AIZA_REJECTED");
  assert.equal(result.maskedKey, null);
  assert.match(result.errorMessage ?? "", /AQ\./);
});

test("accepts a new AQ. authorization key and masks it", () => {
  const result = validateApiKeyFormat(`  ${AQ_KEY}  `);
  assert.equal(result.status, "VERIFYING_NETWORK");
  assert.equal(result.maskedKey, "AQ.Ab••••ding");
});

test("rejects short and non-AQ secrets", () => {
  assert.equal(validateApiKeyFormat("").status, "UNSET");
  assert.equal(validateApiKeyFormat("AQ.short").status, "MALFORMED_AQ_KEY");
  assert.equal(validateApiKeyFormat("gais_not_a_real_format_123456").status, "MALFORMED_AQ_KEY");
});

test("PIN vault round-trips the key", async () => {
  const vault = await encryptApiKey(AQ_KEY, "2468");
  assert.equal(typeof vault.cipherTextBase64, "string");
  assert.equal(await decryptApiKey(vault, "2468"), AQ_KEY);
  await assert.rejects(() => decryptApiKey(vault, "1357"));
});

import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedOrigin } from "./cors.js";

const localOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
]);

test("autorise les origines locales et les prévisualisations HTTPS Manus", () => {
  assert.equal(isAllowedOrigin(undefined, localOrigins), true);
  assert.equal(isAllowedOrigin("http://localhost:5173", localOrigins), true);
  assert.equal(
    isAllowedOrigin("https://5173-demo.example.manus.computer", localOrigins),
    true,
  );
});

test("refuse les origines externes ou les prévisualisations non sécurisées", () => {
  assert.equal(isAllowedOrigin("https://example.com", localOrigins), false);
  assert.equal(
    isAllowedOrigin("http://5173-demo.example.manus.computer", localOrigins),
    false,
  );
  assert.equal(isAllowedOrigin("invalide", localOrigins), false);
});

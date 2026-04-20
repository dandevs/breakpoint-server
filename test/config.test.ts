import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_PORT, resolveConfiguredPort } from "../src/config";

test("resolveConfiguredPort uses configured valid port", () => {
  const result = resolveConfiguredPort(8080);
  assert.equal(result.port, 8080);
  assert.equal(result.warning, undefined);
});

test("resolveConfiguredPort falls back for non-number", () => {
  const result = resolveConfiguredPort("4567");
  assert.equal(result.port, DEFAULT_PORT);
  assert.ok(result.warning);
});

test("resolveConfiguredPort falls back for invalid ranges", () => {
  const below = resolveConfiguredPort(0);
  const above = resolveConfiguredPort(70000);
  const fraction = resolveConfiguredPort(4567.5);

  assert.equal(below.port, DEFAULT_PORT);
  assert.equal(above.port, DEFAULT_PORT);
  assert.equal(fraction.port, DEFAULT_PORT);
});

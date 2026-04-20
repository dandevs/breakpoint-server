"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const config_1 = require("../src/config");
(0, node_test_1.default)("resolveConfiguredPort uses configured valid port", () => {
    const result = (0, config_1.resolveConfiguredPort)(8080);
    strict_1.default.equal(result.port, 8080);
    strict_1.default.equal(result.warning, undefined);
});
(0, node_test_1.default)("resolveConfiguredPort falls back for non-number", () => {
    const result = (0, config_1.resolveConfiguredPort)("4567");
    strict_1.default.equal(result.port, config_1.DEFAULT_PORT);
    strict_1.default.ok(result.warning);
});
(0, node_test_1.default)("resolveConfiguredPort falls back for invalid ranges", () => {
    const below = (0, config_1.resolveConfiguredPort)(0);
    const above = (0, config_1.resolveConfiguredPort)(70000);
    const fraction = (0, config_1.resolveConfiguredPort)(4567.5);
    strict_1.default.equal(below.port, config_1.DEFAULT_PORT);
    strict_1.default.equal(above.port, config_1.DEFAULT_PORT);
    strict_1.default.equal(fraction.port, config_1.DEFAULT_PORT);
});
//# sourceMappingURL=config.test.js.map
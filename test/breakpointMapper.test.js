"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const breakpointMapper_1 = require("../src/breakpointMapper");
(0, node_test_1.default)("toBreakpointEntries maps line numbers to 1-based", () => {
    const result = (0, breakpointMapper_1.toBreakpointEntries)([
        {
            fsPath: "C:/repo/src/a.ts",
            uri: "file:///C:/repo/src/a.ts",
            zeroBasedLine: 0,
        },
        {
            fsPath: "",
            uri: "vscode-remote://ssh-remote+box/work/b.ts",
            zeroBasedLine: 41,
        },
    ]);
    strict_1.default.deepEqual(result, [
        { filename: "C:/repo/src/a.ts", line_number: 1 },
        {
            filename: "vscode-remote://ssh-remote+box/work/b.ts",
            line_number: 42,
        },
    ]);
});
//# sourceMappingURL=breakpointMapper.test.js.map
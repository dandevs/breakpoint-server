import test from "node:test";
import assert from "node:assert/strict";

import { toBreakpointEntries } from "../src/breakpointMapper";

test("toBreakpointEntries maps line numbers to 1-based", () => {
  const result = toBreakpointEntries([
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

  assert.deepEqual(result, [
    { filename: "C:/repo/src/a.ts", line_number: 1 },
    {
      filename: "vscode-remote://ssh-remote+box/work/b.ts",
      line_number: 42,
    },
  ]);
});

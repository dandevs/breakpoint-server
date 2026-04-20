import { BreakpointEntry } from "./types";

export interface SourceBreakpointLocation {
  fsPath: string;
  uri: string;
  zeroBasedLine: number;
}

export function toBreakpointEntries(
  breakpoints: readonly SourceBreakpointLocation[]
): BreakpointEntry[] {
  return breakpoints
    .map((bp) => ({
      filename: bp.fsPath || bp.uri,
      line_number: bp.zeroBasedLine + 1,
    }))
    .sort((a, b) => {
      if (a.filename === b.filename) {
        return a.line_number - b.line_number;
      }

      return a.filename.localeCompare(b.filename);
    });
}

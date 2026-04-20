import * as http from "http";

import { BreakpointEntry } from "./types";

export const BREAKPOINTS_PATH = "/get-breakpoints";

function normalizePath(urlValue: string | undefined): string | undefined {
  if (!urlValue) {
    return undefined;
  }

  try {
    const pathname = new URL(urlValue, "http://localhost").pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      return pathname.slice(0, -1);
    }

    return pathname;
  } catch {
    return undefined;
  }
}

export function createBreakpointRequestHandler(
  getBreakpoints: () => BreakpointEntry[]
): http.RequestListener {
  return (req, res) => {
    const path = normalizePath(req.url);
    if (path !== BREAKPOINTS_PATH) {
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    if (req.method !== "GET") {
      res.writeHead(405, {
        "Content-Type": "application/json; charset=utf-8",
        Allow: "GET",
      });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(getBreakpoints(), null, 2));
  };
}

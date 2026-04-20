import * as http from "http";

import { BreakpointEntry } from "./types";

export const BREAKPOINTS_PATH = "/get-breakpoints";
export const INFO_PATH = "/info";

export interface ProjectInfo {
  projectName: string | null;
  projectPath: string | null;
}

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

function sendJson(
  res: http.ServerResponse,
  statusCode: number,
  body: unknown
): void {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body, null, 2));
}

function sendError(
  res: http.ServerResponse,
  statusCode: number,
  error: string,
  extraHeaders?: http.OutgoingHttpHeaders
): void {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders,
  });
  res.end(JSON.stringify({ error }));
}

export function createBreakpointRequestHandler(
  getBreakpoints: () => BreakpointEntry[],
  getInfo: () => ProjectInfo
): http.RequestListener {
  return (req, res) => {
    const path = normalizePath(req.url);

    if (req.method !== "GET") {
      sendError(res, 405, "Method not allowed", { Allow: "GET" });
      return;
    }

    if (path === BREAKPOINTS_PATH) {
      sendJson(res, 200, getBreakpoints());
      return;
    }

    if (path === INFO_PATH) {
      sendJson(res, 200, getInfo());
      return;
    }

    sendError(res, 404, "Not found");
  };
}

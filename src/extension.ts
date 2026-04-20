import * as vscode from "vscode";
import * as http from "http";

import { toBreakpointEntries } from "./breakpointMapper";
import { resolveConfiguredPort } from "./config";
import { createBreakpointRequestHandler } from "./httpHandler";
import { BreakpointEntry } from "./types";

let server: http.Server | undefined;
let currentPort: number | undefined;

function getBreakpoints(): BreakpointEntry[] {
  const sourceBreakpoints = vscode.debug.breakpoints
    .filter(
      (bp): bp is vscode.SourceBreakpoint =>
        bp instanceof vscode.SourceBreakpoint
    )
    .map((bp) => ({
      fsPath: bp.location.uri.fsPath,
      uri: bp.location.uri.toString(),
      zeroBasedLine: bp.location.range.start.line,
    }));

  return toBreakpointEntries(sourceBreakpoints);
}

function closeServer(): Promise<void> {
  if (!server) {
    return Promise.resolve();
  }

  const activeServer = server;
  server = undefined;
  currentPort = undefined;

  return new Promise((resolve) => {
    try {
      activeServer.close(() => resolve());
    } catch {
      resolve();
    }
  });
}

function attachRuntimeErrorHandler(targetServer: http.Server, port: number): void {
  targetServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      vscode.window.showErrorMessage(
        `Breakpoint Server: Port ${port} is already in use`
      );
      return;
    }

    vscode.window.showErrorMessage(`Breakpoint Server error: ${err.message}`);
  });
}

function listenOnPort(targetServer: http.Server, port: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const onListening = () => {
      targetServer.off("error", onStartError);
      resolve();
    };

    const onStartError = (err: Error) => {
      targetServer.off("listening", onListening);
      reject(err);
    };

    targetServer.once("listening", onListening);
    targetServer.once("error", onStartError);
    targetServer.listen(port);
  });
}

async function startServer(port: number): Promise<void> {
  const previousServer = server;
  const nextServer = http.createServer(
    createBreakpointRequestHandler(getBreakpoints)
  );

  attachRuntimeErrorHandler(nextServer, port);

  try {
    await listenOnPort(nextServer, port);
  } catch (err) {
    try {
      nextServer.close();
    } catch {
      // No-op.
    }
    throw err;
  }

  server = nextServer;
  currentPort = port;

  if (previousServer) {
    try {
      previousServer.close();
    } catch {
      // No-op.
    }
  }

  vscode.window.showInformationMessage(
    `Breakpoint Server running on port ${port}`
  );
}

export function activate(context: vscode.ExtensionContext) {
  const portSetting = vscode.workspace
    .getConfiguration("breakpointServer")
    .get<number>("port");
  const portResolution = resolveConfiguredPort(portSetting);

  if (portResolution.warning) {
    vscode.window.showWarningMessage(portResolution.warning);
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("breakpointServer.showOutput", async () => {
      const json = JSON.stringify(getBreakpoints(), null, 2);
      const doc = await vscode.workspace.openTextDocument({
        language: "json",
        content: json,
      });
      vscode.window.showTextDocument(doc);
    })
  );

  startServer(portResolution.port).catch((err: NodeJS.ErrnoException) => {
    if (err.code !== "EADDRINUSE") {
      vscode.window.showErrorMessage(
        `Breakpoint Server failed to start: ${err.message}`
      );
    }
  });

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("breakpointServer.port")) {
        return;
      }

      const latestPortSetting = vscode.workspace
        .getConfiguration("breakpointServer")
        .get<number>("port");
      const latestResolution = resolveConfiguredPort(latestPortSetting);

      if (latestResolution.warning) {
        vscode.window.showWarningMessage(latestResolution.warning);
      }

      if (currentPort === latestResolution.port) {
        return;
      }

      startServer(latestResolution.port).catch((err: NodeJS.ErrnoException) => {
        if (err.code !== "EADDRINUSE") {
          vscode.window.showErrorMessage(
            `Breakpoint Server failed to restart: ${err.message}`
          );
        }
      });
    })
  );

  context.subscriptions.push({
    dispose: () => {
      void closeServer();
    },
  });
}

export function deactivate() {
  return closeServer();
}

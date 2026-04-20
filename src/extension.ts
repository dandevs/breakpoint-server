import * as vscode from "vscode";
import * as http from "http";

import { toBreakpointEntries } from "./breakpointMapper";
import { DEFAULT_PORT, resolveConfiguredPort } from "./config";
import {
  createBreakpointRequestHandler,
  ProjectInfo,
} from "./httpHandler";
import { tryListenWithFallback } from "./portFallback";
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

function getProjectInfo(): ProjectInfo {
  return {
    projectName: vscode.workspace.name ?? null,
    projectPath:
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null,
  };
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



async function startServer(basePort: number): Promise<void> {
  await closeServer();

  const nextServer = http.createServer(
    createBreakpointRequestHandler(getBreakpoints, getProjectInfo)
  );

  nextServer.on("error", (err: NodeJS.ErrnoException) => {
    vscode.window.showErrorMessage(`Breakpoint Server error: ${err.message}`);
  });

  let actualPort: number;
  try {
    actualPort = await tryListenWithFallback(nextServer, basePort);
  } catch (err) {
    try {
      nextServer.close();
    } catch {
      // No-op.
    }
    throw err;
  }

  server = nextServer;
  currentPort = actualPort;

  if (actualPort !== basePort) {
    vscode.window.showWarningMessage(
      `Breakpoint Server: Port ${basePort} is in use, using port ${actualPort} instead`
    );
  } else {
    vscode.window.showInformationMessage(
      `Breakpoint Server running on port ${actualPort}`
    );
  }
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

  context.subscriptions.push(
    vscode.commands.registerCommand("breakpointServer.getPort", () => {
      if (currentPort === undefined) {
        vscode.window.showWarningMessage("Breakpoint Server is not running");
        return;
      }
      vscode.window.showInformationMessage(
        `Breakpoint Server is running on port ${currentPort}`
      );
    })
  );

  startServer(portResolution.port).catch((err: NodeJS.ErrnoException) => {
    vscode.window.showErrorMessage(
      `Breakpoint Server failed to start: ${err.message}`
    );
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
        vscode.window.showErrorMessage(
          `Breakpoint Server failed to restart: ${err.message}`
        );
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

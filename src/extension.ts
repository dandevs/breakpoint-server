import * as vscode from "vscode";
import * as http from "http";

let server: http.Server | undefined;

function getBreakpoints() {
  return vscode.debug.breakpoints
    .filter(
      (bp): bp is vscode.SourceBreakpoint =>
        bp instanceof vscode.SourceBreakpoint
    )
    .map((bp) => ({
      filename: bp.location.uri.fsPath,
      line_number: bp.location.range.start.line + 1,
    }));
}

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("breakpointServer");
  const port = config.get<number>("port", 4567);

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

  server = http.createServer((req, res) => {
    if (req.url !== "/get-breakpoints") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(getBreakpoints(), null, 2));
  });

  server.listen(port, () => {
    vscode.window.showInformationMessage(
      `Breakpoint Server running on port ${port}`
    );
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      vscode.window.showErrorMessage(
        `Breakpoint Server: Port ${port} is already in use`
      );
    } else {
      vscode.window.showErrorMessage(`Breakpoint Server error: ${err.message}`);
    }
  });

  context.subscriptions.push({
    dispose: () => {
      server?.close();
    },
  });
}

export function deactivate() {
  server?.close();
}

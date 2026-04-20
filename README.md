# Breakpoint Server

A VS Code extension that serves all editor breakpoints and project info as JSON over HTTP.

## Features

- HTTP server returns all VS Code breakpoints as JSON via `GET /get-breakpoints`
- Project info endpoint via `GET /info` — returns workspace name and path
- Command Palette commands:
  - **Show Breakpoints Output** — opens breakpoints in a new untitled JSON file
  - **Get Breakpoint Server Port** — shows a notification with the current active port
- Configurable port (default: 4567) with auto-fallback when port is in use
- Port changes are applied at runtime without reloading VS Code
- Auto-starts when VS Code opens

## Usage

### HTTP Server

The server starts automatically when VS Code opens. All endpoints are GET-only.

#### Get breakpoints

```bash
curl http://localhost:4567/get-breakpoints
```

Response:

```json
[
  {
    "filepath": "/home/user/projects/app/src/main.c",
    "line_number": 42
  },
  {
    "filepath": "/home/user/projects/app/src/utils.c",
    "line_number": 15
  }
]
```

- **`filepath`** — Absolute file path using forward slashes (`/`) regardless of platform
- **`line_number`** — 1-based (matches what the editor shows in the gutter)

#### Get project info

```bash
curl http://localhost:4567/info
```

Response:

```json
{
  "projectName": "my-app",
  "projectPath": "/home/user/my-app"
}
```

If no workspace is open, both values are `null`. With multiple workspace folders, the first folder is used.

#### Routes

| Route | Method | Response |
|---|---|---|
| `/get-breakpoints` | GET | JSON array of breakpoints |
| `/info` | GET | JSON object with `projectName` and `projectPath` |
| Any other path | Any | `404 Not found` |
| Any route | Non-GET | `405 Method not allowed` |

### Command Palette

- **Show Breakpoints Output** (`Ctrl+Shift+P`) — opens the breakpoint list in a new untitled JSON document
- **Get Breakpoint Server Port** (`Ctrl+Shift+P`) — shows a notification with the port the server is currently listening on

## Multi-Instance Support

If you have multiple VS Code windows open, they can't share the same port. The extension handles this automatically:

1. Tries the configured port (e.g. `4567`)
2. If it's in use, tries `4568`, `4569`, etc. (up to 10 attempts)
3. Shows a warning notification when falling back to an alternate port
4. Use **Get Breakpoint Server Port** to check which port any given instance is using

The configured port becomes the "preferred starting port" — each VS Code instance scans upward from it.

## Configuration

| Setting | Default | Description |
|---|---|---|
| `breakpointServer.port` | `4567` | Preferred starting port (auto-fallback if in use) |

Port values must be whole numbers from `1` to `65535`. Invalid values fall back to `4567`.

Set via VS Code Settings or `settings.json`:

```json
{
  "breakpointServer.port": 8080
}
```

Changes take effect immediately — no reload required.

## API

The extension uses the `vscode.debug.breakpoints` API to read all breakpoints set in the editor.

- Returns source breakpoints (file + line)
- Uses file path when available, falls back to URI
- Paths are absolute and normalized to forward slashes (`/`)
- Output is sorted by filepath, then line number

## Development

```bash
npm install
npm run compile
```

Press F5 in VS Code to launch the Extension Development Host.

### Build .vsix

```bash
npm run build
```

This compiles TypeScript and packages the extension into a `.vsix` file.

### Run tests

```bash
npm run test
```

### One-click tests in VS Code

- Open Run and Debug (`Ctrl+Shift+D`)
- Select **Run Unit Tests**
- Press F5

This runs all Node-based unit tests in the integrated terminal.

## License

[MIT](LICENSE)

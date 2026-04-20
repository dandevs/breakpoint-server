# Breakpoint Server

A VS Code extension that serves all editor breakpoints as JSON over HTTP.

## Features

- HTTP server returns all VS Code breakpoints as JSON via `GET /get-breakpoints`
- Command Palette command: **Show Breakpoints Output** — opens breakpoints in a new untitled JSON file
- Configurable port (default: 4567)
- Port changes are applied at runtime without reloading VS Code
- Auto-starts when VS Code opens

## Usage

### HTTP Server

The server starts automatically when VS Code opens. Send a GET request:

```bash
curl http://localhost:4567/get-breakpoints
```

Response:

```json
[
  {
    "filename": "C:\\Projects\\app\\src\\main.ts",
    "line_number": 42
  },
  {
    "filename": "C:\\Projects\\app\\src\\utils.ts",
    "line_number": 15
  }
]
```

Line numbers are **1-based** (matching what the editor shows in the gutter).

#### Other routes

| Route | Method | Response |
|---|---|---|
| `/get-breakpoints` | GET | JSON array of breakpoints |
| `/get-breakpoints` | POST, PUT, etc. | `405 Method not allowed` |
| Any other path | Any | `404 Not found` |

### Command Palette

Open the Command Palette (`Ctrl+Shift+P`) and run **Show Breakpoints Output** to open the breakpoint list in a new untitled JSON document.

## Configuration

| Setting | Default | Description |
|---|---|---|
| `breakpointServer.port` | `4567` | Port the HTTP server listens on |

Port values must be whole numbers from `1` to `65535`. Invalid values fall back to `4567`.

Set via VS Code Settings or `settings.json`:

```json
{
  "breakpointServer.port": 8080
}
```

## API

The extension uses the `vscode.debug.breakpoints` API to read all breakpoints set in the editor.

- Returns source breakpoints (file + line)
- Uses file path when available and falls back to URI
- Output is sorted by filename, then line number

Example output:

```json
[
  {
    "filename": "C:\\repo\\src\\a.ts",
    "line_number": 3
  },
  {
    "filename": "C:\\repo\\src\\b.ts",
    "line_number": 14
  }
]
```

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

### Install from .vsix

```bash
code --install-extension breakpoint-server-0.0.1.vsix
```

## License

[MIT](LICENSE)

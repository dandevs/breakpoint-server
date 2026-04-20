# Breakpoint Server

A VS Code extension that exposes all editor breakpoints as JSON over HTTP.

## Features

- HTTP server returns all VS Code breakpoints as JSON on any GET request
- Configurable port (default: 4567)
- Command Palette command: **Show Breakpoints Output** — opens breakpoints in a new untitled JSON file

## Usage

### HTTP Server

Start the Extension Development Host (F5 or **Debug: Start Debugging**). The server starts automatically.

```bash
curl http://localhost:4567
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

### Command Palette

Open the Command Palette (`Ctrl+Shift+P`) and run **Show Breakpoints Output**.

## Configuration

| Setting | Default | Description |
|---|---|---|
| `breakpointServer.port` | `4567` | Port the HTTP server listens on |

## Development

```bash
npm install
npm run compile
```

Press F5 in VS Code to launch the Extension Development Host.

export const DEFAULT_PORT = 4567;

export interface PortResolution {
  port: number;
  warning?: string;
}

export function resolveConfiguredPort(rawPort: unknown): PortResolution {
  if (
    typeof rawPort !== "number" ||
    !Number.isInteger(rawPort) ||
    rawPort < 1 ||
    rawPort > 65535
  ) {
    return {
      port: DEFAULT_PORT,
      warning:
        "Invalid breakpointServer.port setting. Falling back to default port 4567.",
    };
  }

  return { port: rawPort };
}

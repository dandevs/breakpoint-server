import * as http from "http";

export const MAX_PORT_ATTEMPTS = 10;

export type ListenFn = (server: http.Server, port: number) => Promise<void>;

export function listenOnPort(
  targetServer: http.Server,
  port: number
): Promise<void> {
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

function addrInUse(): NodeJS.ErrnoException {
  const err: NodeJS.ErrnoException = new Error("EADDRINUSE");
  err.code = "EADDRINUSE";
  return err;
}

export async function tryListenWithFallback(
  targetServer: http.Server,
  basePort: number,
  listen: ListenFn = listenOnPort
): Promise<number> {
  for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt++) {
    const port = basePort + attempt;
    try {
      await listen(targetServer, port);
      return port;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "EADDRINUSE") {
        throw err;
      }
    }
  }

  throw new Error(
    `Could not find an available port (tried ${basePort}-${basePort + MAX_PORT_ATTEMPTS - 1})`
  );
}

export { addrInUse };

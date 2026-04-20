import test from "node:test";
import assert from "node:assert/strict";
import * as http from "http";

import {
  tryListenWithFallback,
  MAX_PORT_ATTEMPTS,
  addrInUse,
  type ListenFn,
} from "../src/portFallback";

function stubListen(
  blockedPorts: Set<number>
): ListenFn {
  return (_server: http.Server, port: number) => {
    if (blockedPorts.has(port)) {
      return Promise.reject(addrInUse());
    }
    return Promise.resolve();
  };
}

test("tryListenWithFallback returns basePort when nothing is blocked", async () => {
  const server = http.createServer(() => {});
  try {
    const port = await tryListenWithFallback(server, 5000, stubListen(new Set()));
    assert.equal(port, 5000);
  } finally {
    server.close();
  }
});

test("tryListenWithFallback skips one blocked port", async () => {
  const server = http.createServer(() => {});
  try {
    const port = await tryListenWithFallback(
      server,
      5000,
      stubListen(new Set([5000]))
    );
    assert.equal(port, 5001);
  } finally {
    server.close();
  }
});

test("tryListenWithFallback skips multiple blocked ports", async () => {
  const blocked = new Set([5000, 5001, 5002]);
  const server = http.createServer(() => {});
  try {
    const port = await tryListenWithFallback(server, 5000, stubListen(blocked));
    assert.equal(port, 5003);
  } finally {
    server.close();
  }
});

test("tryListenWithFallback throws when all MAX_PORT_ATTEMPTS ports are blocked", async () => {
  const allBlocked = new Set<number>();
  for (let i = 0; i < MAX_PORT_ATTEMPTS; i++) {
    allBlocked.add(5000 + i);
  }

  const server = http.createServer(() => {});
  try {
    await assert.rejects(
      () => tryListenWithFallback(server, 5000, stubListen(allBlocked)),
      (err: Error) => {
        assert.match(
          err.message,
          /Could not find an available port \(tried 5000-5009\)/
        );
        return true;
      }
    );
  } finally {
    server.close();
  }
});

test("tryListenWithFallback re-throws non-EADDRINUSE errors immediately", async () => {
  const boom: ListenFn = () => {
    const err: NodeJS.ErrnoException = new Error("EPERM");
    err.code = "EPERM";
    return Promise.reject(err);
  };

  const server = http.createServer(() => {});
  try {
    await assert.rejects(
      () => tryListenWithFallback(server, 5000, boom),
      (err: NodeJS.ErrnoException) => {
        assert.equal(err.code, "EPERM");
        return true;
      }
    );
  } finally {
    server.close();
  }
});

test("tryListenWithFallback integrates with real listenOnPort", async () => {
  const server = http.createServer(() => {});
  try {
    const port = await tryListenWithFallback(server, 5000);
    assert.equal(port, 5000);
    const addr = server.address() as import("net").AddressInfo;
    assert.equal(addr.port, 5000);
  } finally {
    server.close();
  }
});

import test from "node:test";
import assert from "node:assert/strict";

import * as http from "http";

import {
  BREAKPOINTS_PATH,
  createBreakpointRequestHandler,
} from "../src/httpHandler";

function requestJson(
  method: string,
  path: string,
  port: number
): Promise<{
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

test("handler serves breakpoints on GET /get-breakpoints", async (t) => {
  const data = [{ filename: "C:/a.ts", line_number: 3 }];
  const server = http.createServer(createBreakpointRequestHandler(() => data));

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  t.after(() =>
    new Promise<void>((resolve) => {
      server.close(() => resolve());
    })
  );

  const address = server.address();
  assert.ok(address && typeof address !== "string");

  const response = await requestJson("GET", BREAKPOINTS_PATH, address.port);
  assert.equal(response.statusCode, 200);
  assert.match(
    response.headers["content-type"] ?? "",
    /application\/json; charset=utf-8/
  );
  assert.deepEqual(JSON.parse(response.body), data);
});

test("handler supports query string and trailing slash", async (t) => {
  const data = [{ filename: "C:/a.ts", line_number: 1 }];
  const server = http.createServer(createBreakpointRequestHandler(() => data));

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  t.after(() =>
    new Promise<void>((resolve) => {
      server.close(() => resolve());
    })
  );

  const address = server.address();
  assert.ok(address && typeof address !== "string");

  const response = await requestJson(
    "GET",
    `${BREAKPOINTS_PATH}/?pretty=true`,
    address.port
  );
  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), data);
});

test("handler returns 405 on non-GET and sets Allow header", async (t) => {
  const server = http.createServer(createBreakpointRequestHandler(() => []));

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  t.after(() =>
    new Promise<void>((resolve) => {
      server.close(() => resolve());
    })
  );

  const address = server.address();
  assert.ok(address && typeof address !== "string");

  const response = await requestJson("POST", BREAKPOINTS_PATH, address.port);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.allow, "GET");
  assert.deepEqual(JSON.parse(response.body), { error: "Method not allowed" });
});

test("handler returns 404 for unknown path", async (t) => {
  const server = http.createServer(createBreakpointRequestHandler(() => []));

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  t.after(() =>
    new Promise<void>((resolve) => {
      server.close(() => resolve());
    })
  );

  const address = server.address();
  assert.ok(address && typeof address !== "string");

  const response = await requestJson("GET", "/wrong", address.port);
  assert.equal(response.statusCode, 404);
  assert.deepEqual(JSON.parse(response.body), { error: "Not found" });
});

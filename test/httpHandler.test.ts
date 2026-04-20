import test from "node:test";
import assert from "node:assert/strict";

import * as http from "http";

import {
  BREAKPOINTS_PATH,
  INFO_PATH,
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

function withServer(
  handler: http.RequestListener,
  fn: (port: number) => Promise<void>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Failed to get server address")));
        return;
      }

      fn(address.port)
        .then(() => {
          server.close(() => resolve());
        })
        .catch((err) => {
          server.close(() => reject(err));
        });
    });
  });
}

const defaultInfo = () => ({
  projectName: "breakpoint-server",
  projectPath: "C:/repo/breakpoint-server",
});

test("handler serves breakpoints on GET /get-breakpoints", async () => {
  const data = [{ filepath: "C:/a.ts", line_number: 3 }];
  const handler = createBreakpointRequestHandler(() => data, defaultInfo);

  await withServer(handler, async (port) => {
    const response = await requestJson("GET", BREAKPOINTS_PATH, port);
    assert.equal(response.statusCode, 200);
    assert.match(
      response.headers["content-type"] ?? "",
      /application\/json; charset=utf-8/
    );
    assert.deepEqual(JSON.parse(response.body), data);
  });
});

test("handler supports query string and trailing slash", async () => {
  const data = [{ filepath: "C:/a.ts", line_number: 1 }];
  const handler = createBreakpointRequestHandler(() => data, defaultInfo);

  await withServer(handler, async (port) => {
    const response = await requestJson(
      "GET",
      `${BREAKPOINTS_PATH}/?pretty=true`,
      port
    );
    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body), data);
  });
});

test("handler returns 405 on non-GET and sets Allow header", async () => {
  const handler = createBreakpointRequestHandler(() => [], defaultInfo);

  await withServer(handler, async (port) => {
    const response = await requestJson("POST", BREAKPOINTS_PATH, port);
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.allow, "GET");
    assert.deepEqual(JSON.parse(response.body), {
      error: "Method not allowed",
    });
  });
});

test("handler returns 404 for unknown path", async () => {
  const handler = createBreakpointRequestHandler(() => [], defaultInfo);

  await withServer(handler, async (port) => {
    const response = await requestJson("GET", "/wrong", port);
    assert.equal(response.statusCode, 404);
    assert.deepEqual(JSON.parse(response.body), { error: "Not found" });
  });
});

test("handler serves project info on GET /info", async () => {
  const info = { projectName: "my-app", projectPath: "/home/user/my-app" };
  const handler = createBreakpointRequestHandler(() => [], () => info);

  await withServer(handler, async (port) => {
    const response = await requestJson("GET", INFO_PATH, port);
    assert.equal(response.statusCode, 200);
    assert.match(
      response.headers["content-type"] ?? "",
      /application\/json; charset=utf-8/
    );
    assert.deepEqual(JSON.parse(response.body), info);
  });
});

test("handler returns null info when no workspace", async () => {
  const info = { projectName: null, projectPath: null };
  const handler = createBreakpointRequestHandler(() => [], () => info);

  await withServer(handler, async (port) => {
    const response = await requestJson("GET", INFO_PATH, port);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body), info);
  });
});

test("handler returns 405 on POST /info", async () => {
  const handler = createBreakpointRequestHandler(() => [], defaultInfo);

  await withServer(handler, async (port) => {
    const response = await requestJson("POST", INFO_PATH, port);
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.allow, "GET");
  });
});

test("handler supports /info with trailing slash and query", async () => {
  const info = { projectName: "test", projectPath: "/test" };
  const handler = createBreakpointRequestHandler(() => [], () => info);

  await withServer(handler, async (port) => {
    const response = await requestJson("GET", "/info/?v=1", port);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body), info);
  });
});

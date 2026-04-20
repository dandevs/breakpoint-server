"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const http = __importStar(require("http"));
const httpHandler_1 = require("../src/httpHandler");
function requestJson(method, path, port) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: "127.0.0.1",
            port,
            path,
            method,
        }, (res) => {
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
                resolve({
                    statusCode: res.statusCode ?? 0,
                    headers: res.headers,
                    body: Buffer.concat(chunks).toString("utf8"),
                });
            });
        });
        req.on("error", reject);
        req.end();
    });
}
(0, node_test_1.default)("handler serves breakpoints on GET /get-breakpoints", async (t) => {
    const data = [{ filename: "C:/a.ts", line_number: 3 }];
    const server = http.createServer((0, httpHandler_1.createBreakpointRequestHandler)(() => data));
    await new Promise((resolve) => {
        server.listen(0, "127.0.0.1", () => resolve());
    });
    t.after(() => new Promise((resolve) => {
        server.close(() => resolve());
    }));
    const address = server.address();
    strict_1.default.ok(address && typeof address !== "string");
    const response = await requestJson("GET", httpHandler_1.BREAKPOINTS_PATH, address.port);
    strict_1.default.equal(response.statusCode, 200);
    strict_1.default.match(response.headers["content-type"] ?? "", /application\/json; charset=utf-8/);
    strict_1.default.deepEqual(JSON.parse(response.body), data);
});
(0, node_test_1.default)("handler supports query string and trailing slash", async (t) => {
    const data = [{ filename: "C:/a.ts", line_number: 1 }];
    const server = http.createServer((0, httpHandler_1.createBreakpointRequestHandler)(() => data));
    await new Promise((resolve) => {
        server.listen(0, "127.0.0.1", () => resolve());
    });
    t.after(() => new Promise((resolve) => {
        server.close(() => resolve());
    }));
    const address = server.address();
    strict_1.default.ok(address && typeof address !== "string");
    const response = await requestJson("GET", `${httpHandler_1.BREAKPOINTS_PATH}/?pretty=true`, address.port);
    strict_1.default.equal(response.statusCode, 200);
    strict_1.default.deepEqual(JSON.parse(response.body), data);
});
(0, node_test_1.default)("handler returns 405 on non-GET and sets Allow header", async (t) => {
    const server = http.createServer((0, httpHandler_1.createBreakpointRequestHandler)(() => []));
    await new Promise((resolve) => {
        server.listen(0, "127.0.0.1", () => resolve());
    });
    t.after(() => new Promise((resolve) => {
        server.close(() => resolve());
    }));
    const address = server.address();
    strict_1.default.ok(address && typeof address !== "string");
    const response = await requestJson("POST", httpHandler_1.BREAKPOINTS_PATH, address.port);
    strict_1.default.equal(response.statusCode, 405);
    strict_1.default.equal(response.headers.allow, "GET");
    strict_1.default.deepEqual(JSON.parse(response.body), { error: "Method not allowed" });
});
(0, node_test_1.default)("handler returns 404 for unknown path", async (t) => {
    const server = http.createServer((0, httpHandler_1.createBreakpointRequestHandler)(() => []));
    await new Promise((resolve) => {
        server.listen(0, "127.0.0.1", () => resolve());
    });
    t.after(() => new Promise((resolve) => {
        server.close(() => resolve());
    }));
    const address = server.address();
    strict_1.default.ok(address && typeof address !== "string");
    const response = await requestJson("GET", "/wrong", address.port);
    strict_1.default.equal(response.statusCode, 404);
    strict_1.default.deepEqual(JSON.parse(response.body), { error: "Not found" });
});
//# sourceMappingURL=httpHandler.test.js.map
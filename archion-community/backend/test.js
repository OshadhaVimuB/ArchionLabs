const http = require("http");

// ---------------------------------------------------------------------------
// Minimal test runner (no external dependencies)
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Helper – make an HTTP request to the local Express server
// ---------------------------------------------------------------------------
function request(method, path, { body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "127.0.0.1",
      port: 5000,
      path,
      method,
      headers: { ...headers },
    };

    if (body) {
      const data = JSON.stringify(body);
      opts.headers["Content-Type"] = "application/json";
      opts.headers["Content-Length"] = Buffer.byteLength(data);
    }

    const req = http.request(opts, (res) => {
      let chunks = "";
      res.on("data", (d) => (chunks += d));
      res.on("end", () => {
        let json;
        try {
          json = JSON.parse(chunks);
        } catch {
          json = chunks;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
async function runTests() {
  console.log("\n  Archion Community — Backend Tests\n");

  // GET /templates
  await test("GET /templates returns paginated list", async () => {
    const res = await request("GET", "/templates");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.templates), "templates should be an array");
    assert(typeof res.data.total === "number", "total should be a number");
  });

  await test("GET /templates?page=1 accepts page param", async () => {
    const res = await request("GET", "/templates?page=1");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.templates), "templates should be an array");
  });

  // GET /templates/:id (non-existent)
  await test("GET /templates/:id returns 404 for missing template", async () => {
    const res = await request("GET", "/templates/99999999");
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  // DELETE /templates/:id (no auth → 401)
  await test("DELETE /templates/:id without auth returns 401", async () => {
    const res = await request("DELETE", "/templates/1");
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // POST /upload-model (no auth → 401)
  await test("POST /upload-model without auth returns 401", async () => {
    const res = await request("POST", "/upload-model");
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // Summary
  console.log(`\n  ${passed} passing, ${failed} failing\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test runner failed:", err.message);
  process.exit(1);
});

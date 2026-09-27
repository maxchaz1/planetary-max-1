// src/index.ts
// Portal‑OS v11 — Worker Router

import { Hono } from "hono";
import { kernelStub } from "./kernel/stub";

const api = new Hono();

// ------------------------------------------------------------
// Timeline Route
// ------------------------------------------------------------
api.post("/portal/timeline", async (c) => {
  const body = await c.req.json();

  const stub = kernelStub(c.env);
  const res = await stub.fetch(
    new Request("https://portal/api/portal/timeline", {
      method: "POST",
      body: JSON.stringify({
        id: crypto.randomUUID(),
        lane: "portal:timeline",
        payload: body,
        identity: "introspection",
      }),
    })
  );

  return c.json(await res.json());
});

// ------------------------------------------------------------
// Replay Route
// ------------------------------------------------------------
api.post("/portal/replay", async (c) => {
  const body = await c.req.json();

  const stub = kernelStub(c.env);
  const res = await stub.fetch(
    new Request("https://portal/api/portal/replay", {
      method: "POST",
      body: JSON.stringify({
        id: crypto.randomUUID(),
        lane: "portal:replay",
        payload: body,
        identity: "introspection",
      }),
    })
  );

  return c.json(await res.json());
});

// ------------------------------------------------------------
// Canon Route
// ------------------------------------------------------------
api.post("/portal/canon", async (c) => {
  const body = await c.req.json();

  const stub = kernelStub(c.env);
  const res = await stub.fetch(
    new Request("https://portal/api/portal/canon", {
      method: "POST",
      body: JSON.stringify({
        id: crypto.randomUUID(),
        lane: "portal:canon",
        payload: body,
        identity: "introspection",
      }),
    })
  );

  return c.json(await res.json());
});

export default api;
export { PortalKernel } from "./do/PortalKernel";
export { new_sqlite_classes } from "./do/new_sqlite_classes";


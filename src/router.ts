// planetary-max/src/router.ts
// Portal‑OS v12 — Worker Router + Phase‑12 Kernel Dispatch

import type { KernelEnvelope } from "./contracts";
import { PortalKernel } from "./do/PortalKernel";

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    // Only POST envelopes are accepted
    if (request.method !== "POST") {
      return Response.json(
        {
          ok: false,
          error: {
            code: "INVALID_METHOD",
            message: "Portal‑OS router only accepts POST envelopes",
          },
        },
        { status: 405 }
      );
    }

    let envelope: KernelEnvelope;
    try {
      envelope = await request.json();
    } catch {
      return Response.json(
        {
          ok: false,
          error: {
            code: "INVALID_ENVELOPE",
            message: "Envelope must be valid JSON",
          },
        },
        { status: 400 }
      );
    }

    // Durable Object routing
    const id = env.PORTAL_KERNEL.idFromName("kernel");
    const stub = env.PORTAL_KERNEL.get(id);

    return stub.fetch(request);
  },
};

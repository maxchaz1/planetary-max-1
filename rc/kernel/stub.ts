// src/kernel/stub.ts
// Portal‑OS v11 — Kernel Stub (Durable Object binding + fetch wrapper)

export function kernelStub(env: any): DurableObjectStub {
  const id = env.PORTAL_KERNEL.idFromName("PORTAL-KERNEL");
  return env.PORTAL_KERNEL.get(id);
}

export interface DurableObjectStub {
  fetch(request: Request): Promise<Response>;
}

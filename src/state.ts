// planetary-max/src/state.ts
// Portal‑OS v12 — Kernel State Envelope + Phase‑12 Quantum Entropy

import type { JsonObject } from "./contracts";
import type { PlanetaryState } from "./planetary";

// ------------------------------------------------------------
// KernelStateEnvelope — top-level state returned to clients
// ------------------------------------------------------------
export interface KernelStateEnvelope {
  ok: boolean;

  // Identity lane
  identity?: {
    id: string;
    echo: JsonObject;
  };

  // Windows lane
  windows?: {
    action: string;
    window: string | null;
  };

  // SIM lane
  sim?: {
    mode: string;
    echo: JsonObject;
  };

  // Umbrella lane
  umbrella?: {
    mode: string;
    echo: JsonObject;
  };

  // Portal lane
  portal?: JsonObject;

  // Portal timeline
  timeline?: JsonObject;

  // Portal diff
  diff?: JsonObject;

  // Portal replay
  replay?: JsonObject;

  // Phase‑12 planetary substrate
  planetary?: PlanetaryState;
}

// ------------------------------------------------------------
// toKernelStateEnvelope — normalize DO responses
// ------------------------------------------------------------
export function toKernelStateEnvelope(obj: JsonObject): KernelStateEnvelope {
  return {
    ok: obj.ok ?? true,

    identity: obj.identity
      ? {
          id: obj.id ?? "",
          echo: obj.echo ?? {},
        }
      : undefined,

    windows: obj.window
      ? {
          action: obj.action ?? "noop",
          window: obj.window ?? null,
        }
      : undefined,

    sim: obj.sim
      ? {
          mode: obj.sim.mode ?? "single",
          echo: obj.sim.echo ?? {},
        }
      : undefined,

    umbrella: obj.governance
      ? {
          mode: obj.governance.mode ?? "strict",
          echo: obj.governance.echo ?? {},
        }
      : undefined,

    portal: obj.surface ?? undefined,
    timeline: obj.timeline ?? undefined,
    diff: obj.diff ?? undefined,
    replay: obj.replay ?? undefined,

    // Phase‑12 planetary substrate
    planetary: obj.planetary ?? undefined,
  };
}

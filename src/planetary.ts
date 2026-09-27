//
// Portal‑OS Planetary Substrate
// Planetary nodes + substrate + quantum + governance
//

import type { JsonObject } from "./contracts";

/**
 * PlanetaryNodeSnapshot
 *
 * Represents a single planetary node in the MAX‑Planetary substrate.
 */
export type PlanetaryNodeSnapshot = {
  id: string;
  identity: {
    id: string;
    signature: string;
  };
  substrate: JsonObject;
  quantum: JsonObject;
};

/**
 * PlanetaryState
 *
 * Full planetary substrate state.
 */
export interface PlanetaryState {
  globalTick: number;
  nodes: any[];
  identities: Record<string, any>;
  substrate: Record<string, any>;
  quantum: Record<string, any>;
  canon: Record<string, any>;
  governance: Record<string, any>;
  advisories: any[];
  synchronizedAt: number;
  packetSignature: string;

  // Phase 12 — Quantum Entropy Fields
  quantumEntropy: number;
  entropyGradient: number[];
  coherenceField: number[];
  entanglementGraph: Record<string, string[]>;
  signatureMap: Record<string, string>;
  entropyTick: number;
}

export function createEmptyPlanetaryState(): PlanetaryState {
  return {
    globalTick: 0,
    nodes: [],
    identities: {},
    substrate: {},
    quantum: {},
    canon: {},
    governance: {},
    advisories: [],
    synchronizedAt: Date.now(),
    packetSignature: "EMPTY",
  };
}

/**
 * beeSimEnvelope
 *
 * Public planetary simulation envelope for /sim.
 */
export function beeSimEnvelope(): JsonObject {
  return {
    ok: true,
    service: "PLANETARY-SIM",
    tick: 0,
    swarm: [],
    substrate: {},
    quantum: {},
    meta: {
      mode: "planetary",
      version: "1.0",
    },
  };
}

/**
 * toPlanetaryEnvelope
 *
 * Converts internal planetary state into a public JSON envelope.
 */
export function toPlanetaryEnvelope(state: PlanetaryState): JsonObject {
  return {
    ok: true,
    service: "PLANETARY-STATE",
    globalTick: state.globalTick,
    nodes: state.nodes,
    identities: state.identities,
    substrate: state.substrate,
    quantum: state.quantum,
    canon: state.canon,
    governance: state.governance,
    advisories: state.advisories,
    synchronizedAt: state.synchronizedAt,
    packetSignature: state.packetSignature,
  };
}

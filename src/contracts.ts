// planetary-max/src/contracts.ts
// Portal‑OS v12 — Core Contracts + Phase‑12 Compatibility

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue;
}

// ------------------------------------------------------------
// Kernel Envelope — POST-only contract for PortalKernel DO
// ------------------------------------------------------------
export interface KernelEnvelope {
  id: string;               // client-generated request ID
  lane: string;             // kernel lane (identity, windows, sim, portal, etc.)
  identity: string;         // identity string (user, agent, system)
  payload: JsonObject;      // lane-specific payload
}

// ------------------------------------------------------------
// Bindings — Cloudflare Worker environment bindings
// ------------------------------------------------------------
export interface Bindings {
  PLANETARY_MODE?: string;          // sim lane
  UMBRELLA_ENFORCEMENT?: string;    // umbrella lane

  // Durable Object namespaces
  PORTAL_KERNEL?: DurableObjectNamespace;

  // Phase‑12 planetary substrate (optional future bindings)
  PLANETARY_SEED?: string;
  QUANTUM_SEED?: string;
  CANON_SEED?: string;
}

// ------------------------------------------------------------
// Portal Surface Envelope
// ------------------------------------------------------------
export interface PortalPanelEnvelope {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export interface PortalSurfaceEnvelope {
  panels: PortalPanelEnvelope[];
}

// ------------------------------------------------------------
// Portal Timeline Envelope
// ------------------------------------------------------------
export interface PortalTimelineEventEnvelope {
  id: string;
  timestamp: number;
  action: string;
  panel: string | null;
  payload: JsonObject;
}

export interface PortalTimelineEnvelope {
  events: PortalTimelineEventEnvelope[];
}

// ------------------------------------------------------------
// Portal Diff Envelope
// ------------------------------------------------------------
export interface PortalDiffEnvelope {
  from: string;
  to: string;
  changes: JsonObject[];
}

// ------------------------------------------------------------
// Planetary Envelope — Phase‑12 Quantum Entropy Compatible
// ------------------------------------------------------------
export interface PlanetaryEnvelope {
  globalTick: number;
  nodes: JsonObject[];
  identities: Record<string, JsonObject>;
  substrate: JsonObject;
  quantum: JsonObject;
  canon: JsonObject;
  governance: JsonObject;
  advisories: JsonObject[];
  synchronizedAt: number;
  packetSignature: string;

  // Phase‑12 Quantum Entropy Fields
  quantumEntropy: number;
  entropyGradient: number[];
  coherenceField: number[];
  entanglementGraph: Record<string, string[]>;
  signatureMap: Record<string, string>;
  entropyTick: number;
}

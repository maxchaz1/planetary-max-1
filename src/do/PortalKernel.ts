// planetary-max/src/do/PortalKernel.ts
// Portal‑OS v12 — Strict Mode Kernel + Phase‑12 Quantum Entropy + Replay

import type { DurableObjectState } from "@cloudflare/workers-types";
import type { Bindings, KernelEnvelope, JsonObject } from "../contracts";

import {
  createEmptyPortalSurfaceState,
  openPanel,
  closePanel,
  movePanel,
  resizePanel,
  togglePanel,
  toPortalEnvelope,
  type PortalSurfaceState,
} from "./PortalSurface";

import {
  createEmptyPortalTimeline,
  addTimelineEvent,
  toPortalTimelineEnvelope,
  type PortalTimeline,
  type PortalTimelineEvent,
} from "./PortalTimeline";

import {
  computePortalDiff,
  toPortalDiffEnvelope,
} from "./PortalTimelineDiff";

// Phase‑12 planetary substrate
import {
  type PlanetaryState,
  toPlanetaryEnvelope,
} from "../planetary";

// ------------------------------------------------------------
// Identity + governance types
// ------------------------------------------------------------

interface IdentityContext {
  subject: string;
  roles: string[];
  claims: Record<string, unknown>;
}

// ------------------------------------------------------------
// PortalKernel Durable Object
// ------------------------------------------------------------

export class PortalKernel {
  state: DurableObjectState;
  env: Bindings;

  planetary: PlanetaryState;

  constructor(state: DurableObjectState, env: Bindings) {
    this.state = state;
    this.env = env;

    this.planetary = {
      globalTick: 0,
      nodes: [],
      identities: {},
      substrate: {},
      quantum: {},
      canon: {},
      governance: {},
      advisories: [],
      synchronizedAt: Date.now(),
      packetSignature: "EMPTY-PACKET",

      quantumEntropy: 0,
      entropyGradient: [],
      coherenceField: [],
      entanglementGraph: {},
      signatureMap: {},
      entropyTick: 0,
    };
  }

  // ------------------------------------------------------------
  // ⭐ Strict Envelope Validation (Phase‑12)
  // ------------------------------------------------------------
  private validateEnvelopeStrict(envelope: KernelEnvelope) {
    const required = ["id", "lane", "op", "payload"];
    for (const field of required) {
      if (!(field in envelope)) {
        return {
          ok: false,
          error: {
            code: "STRICT_ENVELOPE_MISSING_FIELD",
            message: `Envelope missing required field: ${field}`,
          },
        };
      }
    }

    if (typeof envelope.id !== "string") {
      return {
        ok: false,
        error: {
          code: "STRICT_ENVELOPE_INVALID_ID",
          message: "Envelope.id must be a string",
        },
      };
    }

    if (typeof envelope.lane !== "string") {
      return {
        ok: false,
        error: {
          code: "STRICT_ENVELOPE_INVALID_LANE",
          message: "Envelope.lane must be a string",
        },
      };
    }

    if (typeof envelope.op !== "string") {
      return {
        ok: false,
        error: {
          code: "STRICT_ENVELOPE_INVALID_OP",
          message: "Envelope.op must be a string",
        },
      };
    }

    if (typeof envelope.payload !== "object" || envelope.payload === null) {
      return {
        ok: false,
        error: {
          code: "STRICT_ENVELOPE_INVALID_PAYLOAD",
          message: "Envelope.payload must be a JSON object",
        },
      };
    }

    if (envelope.meta && typeof envelope.meta !== "object") {
      return {
        ok: false,
        error: {
          code: "STRICT_ENVELOPE_INVALID_META",
          message: "Envelope.meta must be a JSON object",
        },
      };
    }

    if (envelope.identity && typeof envelope.identity !== "string") {
      return {
        ok: false,
        error: {
          code: "STRICT_ENVELOPE_INVALID_IDENTITY",
          message: "Envelope.identity must be a string when present",
        },
      };
    }

    const allowedLanes = new Set([
      "identity",
      "windows",
      "sim",
      "umbrella",
      "portal",
      "portal:timeline",
      "portal:diff",
      "portal:replay",
      "planetary",
      "planetary:tick",
      "planetary:entropy",
    ]);

    if (!allowedLanes.has(envelope.lane)) {
      return {
        ok: false,
        error: {
          code: "STRICT_ENVELOPE_UNKNOWN_LANE",
          message: `Unknown or disallowed lane: ${envelope.lane}`,
        },
      };
    }

    return { ok: true };
  }

  // ------------------------------------------------------------
  // ⭐ Phase‑12 Quantum Entropy Computation
  // ------------------------------------------------------------
  private computeQuantumEntropy(): void {
    const nodes = this.planetary.nodes;

    const divergence = nodes.map((n) => n.divergence ?? 0);
    const signatureDrift = nodes.map((n) => n.signatureDrift ?? 0);
    const coherenceLoss = nodes.map((n) => n.coherenceLoss ?? 0);

    const avgNodeDivergence =
      divergence.reduce((a, b) => a + b, 0) / (divergence.length || 1);

    const avgSignatureDrift =
      signatureDrift.reduce((a, b) => a + b, 0) / (signatureDrift.length || 1);

    const avgCoherenceLoss =
      coherenceLoss.reduce((a, b) => a + b, 0) / (coherenceLoss.length || 1);

    const entanglementInstability =
      Object.keys(this.planetary.entanglementGraph).length * 0.01;

    const substrateNoise = Math.random() * 0.05;

    this.planetary.quantumEntropy =
      (avgNodeDivergence +
        avgSignatureDrift +
        avgCoherenceLoss +
        entanglementInstability +
        substrateNoise) / 5;

    this.planetary.entropyGradient = divergence;
    this.planetary.coherenceField = coherenceLoss;
    this.planetary.entropyTick++;
  }

  // ------------------------------------------------------------
  // ⭐ Phase‑12 planetary tick loop
  // ------------------------------------------------------------
  private planetaryTick(): void {
    this.planetary.globalTick++;
    this.computeQuantumEntropy();
    this.planetary.synchronizedAt = Date.now();
  }

  // ------------------------------------------------------------
  // ⭐ JWT decode helper (no verification, just parsing)
  // ------------------------------------------------------------
  private decodeJwt(token: string): Record<string, unknown> | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    try {
      const payload = parts[1];
      const padded = payload.padEnd(
        payload.length + (4 - (payload.length % 4)) % 4,
        "="
      );
      const json = atob(padded);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  // ------------------------------------------------------------
  // ⭐ Identity verification (Phase‑12 strict JWT)
  // ------------------------------------------------------------
  private async verifyIdentity(
    identityToken?: string
  ): Promise<IdentityContext | null> {
    if (!identityToken) return null;

    const decoded = this.decodeJwt(identityToken);
    if (!decoded) {
      throw new Error("Identity: invalid JWT structure");
    }

    const issuer = decoded["iss"];
    const audience = decoded["aud"];
    const subject = decoded["sub"];
    const exp = decoded["exp"];

    if (typeof issuer !== "string" || issuer !== this.env.IDENTITY_JWT_ISSUER) {
      throw new Error("Identity: invalid issuer");
    }

    if (
      typeof audience !== "string" ||
      audience !== this.env.IDENTITY_JWT_AUDIENCE
    ) {
      throw new Error("Identity: invalid audience");
    }

    if (typeof subject !== "string" || !subject.length) {
      throw new Error("Identity: missing subject");
    }

    if (typeof exp !== "number" || Date.now() / 1000 >= exp) {
      throw new Error("Identity: token expired");
    }

    const roles = Array.isArray(decoded["roles"])
      ? (decoded["roles"] as string[])
      : [];

    this.planetary.identities[subject] = {
      roles,
      claims: decoded,
    };

    return {
      subject,
      roles,
      claims: decoded,
    };
  }

  // ------------------------------------------------------------
  // ⭐ Governance signature verification (Phase‑12)
  // ------------------------------------------------------------
  private async verifyGovernanceSignature(packet: JsonObject): Promise<void> {
    const secret = this.env.GOVERNANCE_SECRET;
    if (!secret) throw new Error("UmbrellaStrict: missing governance secret");

    const signature = packet.signature;
    if (typeof signature !== "string") {
      throw new Error("UmbrellaStrict: governance packet missing signature");
    }

    if (this.planetary.signatureMap[signature]) {
      throw new Error("UmbrellaStrict: governance packet replay detected");
    }

    const issuedAt = packet.issuedAt;
    const expiresAt = packet.expiresAt;

    if (typeof issuedAt !== "number" || typeof expiresAt !== "number") {
      throw new Error("UmbrellaStrict: governance packet missing timestamps");
    }

    const now = Date.now();
    if (now < issuedAt || now > expiresAt) {
      throw new Error("UmbrellaStrict: governance packet expired");
    }

    const scope = packet.scope;
    if (typeof scope !== "string") {
      throw new Error("UmbrellaStrict: governance packet missing scope");
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const data = encoder.encode(`${issuedAt}:${expiresAt}:${scope}`);
    const sigBytes = Uint8Array.from(atob(signature), (c) =>
      c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, data);
    if (!valid) {
      throw new Error("UmbrellaStrict: invalid governance signature");
    }

    this.planetary.signatureMap[signature] = true;
  }

  // ------------------------------------------------------------
  // ⭐ UmbrellaStrict governance (Phase‑12 strict)
  // ------------------------------------------------------------
  private async enforceUmbrellaStrict(
    lane: string,
    op: string | undefined,
    identity: IdentityContext | null,
    payload: JsonObject
  ): Promise<void> {
    const mode = this.env.UMBRELLA_ENFORCEMENT ?? "strict";
    if (mode !== "strict") return;

    if (lane !== "identity" && !identity) {
      throw new Error("UmbrellaStrict: identity required");
    }

    if (
      (lane === "portal:replay" || lane === "portal:diff") &&
      (!identity || !identity.roles.includes("planetary-operator"))
    ) {
      throw new Error("UmbrellaStrict: operator role required");
    }

    const highImpactOps = ["mutate", "reset", "fork", "inject", "entropy"];
    if (lane.startsWith("planetary") && op && highImpactOps.includes(op)) {
      const governance = payload.governance;
      if (!governance || typeof governance !== "object") {
        throw new Error("UmbrellaStrict: governance packet required");
      }

      await this.verifyGovernanceSignature(governance);

      if (!identity!.roles.includes("planetary-governor")) {
        throw new Error("UmbrellaStrict: governor role required");
      }

      this.planetary.advisories.push({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        op,
        scope: (governance as any).scope,
        issuedBy: identity!.subject,
      });
    }
  }

  // ------------------------------------------------------------
  // Main fetch handler (strict mode)
  // ------------------------------------------------------------
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return Response.json(
        {
          ok: false,
          error: {
            code: "INVALID_METHOD",
            message: "Kernel only accepts POST envelopes",
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
            message: "Kernel envelope must be valid JSON",
          },
        },
        { status: 400 }
      );
    }

    const strictCheck = this.validateEnvelopeStrict(envelope);
    if (!strictCheck.ok) {
      return Response.json(
        {
          ok: false,
          error: strictCheck.error,
        },
        { status: 400 }
      );
    }

    const { id, lane, payload, identity: identityToken, op } = envelope;

    let identityCtx: IdentityContext | null = null;
    try {
      identityCtx = await this.verifyIdentity(identityToken);
      await this.enforceUmbrellaStrict(lane, op, identityCtx, payload);
    } catch (err) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "UMBRELLA_STRICT_VIOLATION",
            message:
              err instanceof Error ? err.message : "Umbrella strict violation",
          },
        },
        { status: 403 }
      );
    }

    switch (lane) {
      case "identity":
        return this.handleIdentity(id, identityToken ?? "", payload);

      case "windows":
        return this.handleWindows(id, identityToken ?? "", payload);

      case "sim":
        return this.handleSim(id, identityToken ?? "", payload);

      case "umbrella":
        return this.handleUmbrella(id, identityToken ?? "", payload);

      case "portal":
        return this.handlePortal(id, identityToken ?? "", payload);

      case "portal:timeline":
        return this.handlePortalTimeline();

      case "portal:diff":
        return this.handlePortalDiff(payload);

      case "portal:replay":
        return this.handlePortalReplay(payload);

      case "planetary":
        return Response.json(toPlanetaryEnvelope(this.planetary));

      case "planetary:tick":
        this.planetaryTick();
        return Response.json({
          ok: true,
          lane: "planetary:tick",
          tick: this.planetary.globalTick,
          entropy: this.planetary.quantumEntropy,
        });

      case "planetary:entropy":
        return Response.json({
          ok: true,
          lane: "planetary:entropy",
          entropy: this.planetary.quantumEntropy,
          gradient: this.planetary.entropyGradient,
          coherence: this.planetary.coherenceField,
          entanglement: this.planetary.entanglementGraph,
          signatures: this.planetary.signatureMap,
          tick: this.planetary.entropyTick,
        });

      default:
        return Response.json(
          {
            ok: false,
            error: {
              code: "INVALID_LANE",
              message: `Unknown kernel lane: ${lane}`,
            },
          },
          { status: 400 }
        );
    }
  }

  // ------------------------------------------------------------
  // Storage helpers
  // ------------------------------------------------------------
  async loadSurface(): Promise<PortalSurfaceState> {
    return (
      (await this.state.storage.get("portal:surface")) ??
      createEmptyPortalSurfaceState()
    );
  }

  async saveSurface(surface: PortalSurfaceState) {
    await this.state.storage.put("portal:surface", surface);
  }

  async loadTimeline(): Promise<PortalTimeline> {
    return (
      (await this.state.storage.get("portal:timeline")) ??
      createEmptyPortalTimeline()
    );
  }

  async saveTimeline(timeline: PortalTimeline) {
    await this.state.storage.put("portal:timeline", timeline);
  }

  // ------------------------------------------------------------
  // Identity lane
  // ------------------------------------------------------------
  async handleIdentity(
    id: string,
    identity: string,
    payload: JsonObject
  ): Promise<Response> {
    return Response.json({
      ok: true,
      lane: "identity",
      id,
      identity,
      echo: payload,
    });
  }

  // ------------------------------------------------------------
  // Windows lane
  // ------------------------------------------------------------
  async handleWindows(
    id: string,
    identity: string,
    payload: JsonObject
  ): Promise<Response> {
    const action = payload.action ?? "noop";

    switch (action) {
      case "open":
      case "close":
        return Response.json({
          ok: true,
          lane: "windows",
          id,
          identity,
          action,
          window: payload.window ?? null,
        });

      default:
        return Response.json(
          {
            ok: false,
            error: {
              code: "WINDOWS_INVALID_ACTION",
              message: `Unknown windows action: ${action}`,
            },
          },
          { status: 400 }
        );
    }
  }

  // ------------------------------------------------------------
  // SIM lane
  // ------------------------------------------------------------
  async handleSim(
    id: string,
    identity: string,
    payload: JsonObject
  ): Promise<Response> {
    return Response.json({
      ok: true,
      lane: "sim",
      id,
      identity,
      sim: {
        mode: this.env.PLANETARY_MODE ?? "single",
        echo: payload,
      },
    });
  }

  // ------------------------------------------------------------
  // Umbrella lane
  // ------------------------------------------------------------
  async handleUmbrella(
    id: string,
    identity: string,
    payload: JsonObject
  ): Promise<Response> {
    const mode = this.env.UMBRELLA_ENFORCEMENT ?? "strict";

    return Response.json({
      ok: true,
      lane: "umbrella",
      id,
      identity,
      governance: {
        mode,
        echo: payload,
      },
    });
  }

  // ------------------------------------------------------------
  // Portal lane (interactive + timeline)
  // ------------------------------------------------------------
  async handlePortal(
    id: string,
    identity: string,
    payload: JsonObject
  ): Promise<Response> {
    const action = payload.action ?? "noop";

    let surface = await this.loadSurface();
    let timeline = await this.loadTimeline();

    const recordEvent = (panel: string | null) => {
      const event: PortalTimelineEvent = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        action,
        panel,
        payload,
      };
      timeline = addTimelineEvent(timeline, event);
      this.saveTimeline(timeline);
    };

    switch (action) {
      case "open": {
        const panel = {
          id: payload.panel,
          title: payload.title ?? payload.panel,
          x: payload.x ?? 100,
          y: payload.y ?? 100,
          width: payload.width ?? 300,
          height: payload.height ?? 200,
          visible: true,
        };

        surface = openPanel(surface, panel);
        await this.saveSurface(surface);

        recordEvent(panel.id);

        return Response.json({
          ok: true,
          lane: "portal",
          id,
          identity,
          action,
          panel,
          surface: toPortalEnvelope(surface),
          timeline: toPortalTimelineEnvelope(timeline),
        });
      }

      case "close": {
        surface = closePanel(surface, payload.panel);
        await this.saveSurface(surface);

        recordEvent(payload.panel);

        return Response.json({
          ok: true,
          lane: "portal",
          id,
          identity,
          action,
          panel: payload.panel,
          surface: toPortalEnvelope(surface),
          timeline: toPortalTimelineEnvelope(timeline),
        });
      }

      case "move": {
        surface = movePanel(surface, payload.panel, payload.x, payload.y);
        await this.saveSurface(surface);

        recordEvent(payload.panel);

        return Response.json({
          ok: true,
          lane: "portal",
          id,
          identity,
          action,
          panel: payload.panel,
          surface: toPortalEnvelope(surface),
          timeline: toPortalTimelineEnvelope(timeline),
        });
      }

      case "resize": {
        surface = resizePanel(
          surface,
          payload.panel,
          payload.width,
          payload.height
        );
        await this.saveSurface(surface);

        recordEvent(payload.panel);

        return Response.json({
          ok: true,
          lane: "portal",
          id,
          identity,
          action,
          panel: payload.panel,
          surface: toPortalEnvelope(surface),
          timeline: toPortalTimelineEnvelope(timeline),
        });
      }

      case "toggle": {
        surface = togglePanel(surface, payload.panel, payload.visible);
        await this.saveSurface(surface);

        recordEvent(payload.panel);

        return Response.json({
          ok: true,
          lane: "portal",
          id,
          identity,
          action,
          panel: payload.panel,
          surface: toPortalEnvelope(surface),
          timeline: toPortalTimelineEnvelope(timeline),
        });
      }

      default:
        return Response.json(
          {
            ok: false,
            error: {
              code: "PORTAL_INVALID_ACTION",
              message: `Unknown portal action: ${action}`,
            },
          },
          { status: 400 }
        );
    }
  }

  // ------------------------------------------------------------
  // Portal Timeline read
  // ------------------------------------------------------------
  async handlePortalTimeline(): Promise<Response> {
    const timeline = await this.loadTimeline();
    return Response.json(toPortalTimelineEnvelope(timeline));
  }

  // ------------------------------------------------------------
  // Portal Diff lane
  // ------------------------------------------------------------
  async handlePortalDiff(payload: JsonObject): Promise<Response> {
    const fromId = payload.from;
    const toId = payload.to;

    const timeline = await this.loadTimeline();

    const eventFrom = timeline.events.find((e) => e.id === fromId);
    const eventTo = timeline.events.find((e) => e.id === toId);

    if (!eventFrom || !eventTo) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "PORTAL_DIFF_EVENT_NOT_FOUND",
            message: "One or both timeline events not found",
          },
        },
        { status: 404 }
      );
    }

    const surfaceBefore = await this.replaySurfaceUntil(fromId);
    const surfaceAfter = await this.replaySurfaceUntil(toId);

    const diff = computePortalDiff(
      surfaceBefore,
      surfaceAfter,
      eventFrom,
      eventTo
    );

    return Response.json(toPortalDiffEnvelope(diff));
  }

  // ------------------------------------------------------------
  // ⭐ Replay engine lane
  // ------------------------------------------------------------
  async handlePortalReplay(payload: JsonObject): Promise<Response> {
    const eventId = payload.eventId ?? null;

    const timeline = await this.loadTimeline();
    const surface = await this.replaySurfaceUntil(eventId);

    return Response.json({
      ok: true,
      lane: "portal:replay",
      eventId,
      surface: toPortalEnvelope(surface),
    });
  }

  // ------------------------------------------------------------
  // Replay engine core
  // ------------------------------------------------------------
  async replaySurfaceUntil(eventId: string | null): Promise<PortalSurfaceState> {
    const timeline = await this.loadTimeline();
    let surface = createEmptyPortalSurfaceState();

    for (const event of timeline.events) {
      const { action, panel, payload } = event;

      switch (action) {
        case "open":
          surface = openPanel(surface, {
            id: panel!,
            title: payload.title ?? panel,
            x: payload.x ?? 100,
            y: payload.y ?? 100,
            width: payload.width ?? 300,
            height: payload.height ?? 200,
            visible: true,
          });
          break;

        case "close":
          surface = closePanel(surface, panel!);
          break;

        case "move":
          surface = movePanel(surface, panel!, payload.x, payload.y);
          break;

        case "resize":
          surface = resizePanel(
            surface,
            panel!,
            payload.width,
            payload.height
          );
          break;

        case "toggle":
          surface = togglePanel(surface, panel!, payload.visible);
          break;
      }

      if (eventId && event.id === eventId) break;
    }

    return surface;
  }
}

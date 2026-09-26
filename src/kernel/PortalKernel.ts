// src/kernel/PortalKernel.ts
// Portal‑OS v11 — Kernel (Envelope Dispatch + Modal Lanes)

import { DurableObjectState } from "@cloudflare/workers-types";
import { JsonObject } from "../contracts";

import {
  loadTimeline,
  saveTimeline,
  appendTimelineEvent,
} from "../do/PortalTimeline";

import {
  replaySurface,
} from "../do/PortalReplay";

import {
  loadCanon,
  saveCanon,
  canonizeEvent,
  appendCanon,
} from "../do/PortalCanon";

export class PortalKernel {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(req: Request): Promise<Response> {
    const body = await req.json();
    const lane = body.lane;
    const payload = body.payload ?? {};

    switch (lane) {
      case "portal:timeline":
        return this.handlePortalTimeline(payload);

      case "portal:replay":
        return this.handlePortalReplay(payload);

      case "portal:canon":
        return this.handlePortalCanon(payload);

      default:
        return Response.json({
          ok: false,
          error: `Unknown lane: ${lane}`,
        });
    }
  }

  // ------------------------------------------------------------
  // Timeline Lane
  // ------------------------------------------------------------
  async handlePortalTimeline(payload: JsonObject): Promise<Response> {
    const timeline = await loadTimeline(this.state);

    const event = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action: payload.action,
      panel: payload.panel ?? null,
      payload,
    };

    appendTimelineEvent(timeline, event);
    await saveTimeline(this.state, timeline);

    return Response.json({
      ok: true,
      lane: "portal:timeline",
      event,
    });
  }

  // ------------------------------------------------------------
  // Replay Lane
  // ------------------------------------------------------------
  async handlePortalReplay(payload: JsonObject): Promise<Response> {
    const eventId = payload.eventId ?? null;

    const timeline = await loadTimeline(this.state);
    const surface = replaySurface(timeline, eventId);

    return Response.json({
      ok: true,
      lane: "portal:replay",
      eventId,
      surface,
    });
  }

  // ------------------------------------------------------------
  // Canon Lane
  // ------------------------------------------------------------
  async handlePortalCanon(payload: JsonObject): Promise<Response> {
    const eventId = payload.eventId;

    const timeline = await loadTimeline(this.state);
    const event = timeline.events.find((e) => e.id === eventId);

    if (!event) {
      return Response.json({
        ok: false,
        error: "Event not found",
      });
    }

    const canon = await loadCanon(this.state);
    const entry = canonizeEvent(event);
    appendCanon(canon, entry);
    await saveCanon(this.state, canon);

    return Response.json({
      ok: true,
      lane: "portal:canon",
      entry,
    });
  }
}

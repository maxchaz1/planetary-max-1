// src/do/PortalCanon.ts
// Portal‑OS v11 — Canon Integration Substrate

import type { PortalTimelineEvent } from "./PortalTimeline";

export type PortalCanonEntry = {
  id: string;
  timestamp: number;
  action: string;
  panel?: string;
  payload: Record<string, unknown>;
  meaning: string; // canonical meaning
};

export type PortalCanon = {
  entries: PortalCanonEntry[];
};

export function createEmptyCanon(): PortalCanon {
  return { entries: [] };
}

export function canonizeEvent(event: PortalTimelineEvent): PortalCanonEntry {
  return {
    id: event.id,
    timestamp: event.timestamp,
    action: event.action,
    panel: event.panel,
    payload: event.payload,
    meaning: deriveMeaning(event),
  };
}

function deriveMeaning(event: PortalTimelineEvent): string {
  switch (event.action) {
    case "open":
      return `Panel ${event.panel} was opened`;
    case "close":
      return `Panel ${event.panel} was closed`;
    case "move":
      return `Panel ${event.panel} moved to (${event.payload.x}, ${event.payload.y})`;
    case "resize":
      return `Panel ${event.panel} resized to ${event.payload.width}x${event.payload.height}`;
    case "toggle":
      return `Panel ${event.panel} visibility set to ${event.payload.visible}`;
    default:
      return `Unknown action ${event.action}`;
  }
}

export function appendCanon(
  canon: PortalCanon,
  entry: PortalCanonEntry
): PortalCanon {
  canon.entries.push(entry);
  return canon;
}

// portal-os-console/src/components/PlanetaryModePanel.tsx
// Portal‑OS v12 — Planetary Mode Panel + Phase‑12 Quantum Entropy

import React, { useEffect, useState } from "react";

export default function PlanetaryModePanel() {
  const [planetary, setPlanetary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch planetary envelope
  async function fetchPlanetary() {
    setLoading(true);

    const res = await fetch("/kernel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        lane: "planetary",
        identity: "console",
        payload: {},
      }),
    });

    const data = await res.json();
    setPlanetary(data);
    setLoading(false);
  }

  // Trigger planetary tick
  async function tickPlanetary() {
    const res = await fetch("/kernel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        lane: "planetary:tick",
        identity: "console",
        payload: {},
      }),
    });

    await fetchPlanetary();
  }

  // Fetch on mount
  useEffect(() => {
    fetchPlanetary();
  }, []);

  if (loading || !planetary) {
    return (
      <div style={{ padding: "1rem" }}>
        <h2>Planetary Mode</h2>
        <p>Loading planetary substrate…</p>
      </div>
    );
  }

  const p = planetary;

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Planetary Mode</h2>

      <button onClick={tickPlanetary} style={{ marginBottom: "1rem" }}>
        Tick Planetary
      </button>

      <section>
        <h3>Global Tick</h3>
        <p>{p.globalTick}</p>
      </section>

      <section>
        <h3>Quantum Entropy</h3>
        <p>Entropy: {p.quantumEntropy.toFixed(6)}</p>
        <p>Entropy Tick: {p.entropyTick}</p>
      </section>

      <section>
        <h3>Entropy Gradient</h3>
        <pre>{JSON.stringify(p.entropyGradient, null, 2)}</pre>
      </section>

      <section>
        <h3>Coherence Field</h3>
        <pre>{JSON.stringify(p.coherenceField, null, 2)}</pre>
      </section>

      <section>
        <h3>Entanglement Graph</h3>
        <pre>{JSON.stringify(p.entanglementGraph, null, 2)}</pre>
      </section>

      <section>
        <h3>Signature Map</h3>
        <pre>{JSON.stringify(p.signatureMap, null, 2)}</pre>
      </section>

      <section>
        <h3>Raw Planetary Envelope</h3>
        <pre>{JSON.stringify(p, null, 2)}</pre>
      </section>
    </div>
  );
}

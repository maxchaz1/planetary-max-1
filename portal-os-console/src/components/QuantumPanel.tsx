// portal-os-console/src/components/QuantumPanel.tsx
// Portal‑OS v12 — Quantum Panel (Phase‑12 Quantum Entropy Visualizer)

import React, { useEffect, useState } from "react";

export default function QuantumPanel() {
  const [quantum, setQuantum] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch quantum entropy envelope
  async function fetchQuantum() {
    setLoading(true);

    const res = await fetch("/kernel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        lane: "planetary:entropy",
        identity: "console",
        payload: {},
      }),
    });

    const data = await res.json();
    setQuantum(data);
    setLoading(false);
  }

  // Trigger planetary tick (which updates entropy)
  async function tickQuantum() {
    await fetch("/kernel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        lane: "planetary:tick",
        identity: "console",
        payload: {},
      }),
    });

    await fetchQuantum();
  }

  // Fetch on mount
  useEffect(() => {
    fetchQuantum();
  }, []);

  if (loading || !quantum) {
    return (
      <div style={{ padding: "1rem" }}>
        <h2>Quantum Substrate</h2>
        <p>Loading quantum envelope…</p>
      </div>
    );
  }

  const q = quantum;

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Quantum Substrate</h2>

      <button onClick={tickQuantum} style={{ marginBottom: "1rem" }}>
        Tick Quantum
      </button>

      <section>
        <h3>Quantum Entropy</h3>
        <p>Entropy: {q.entropy.toFixed(6)}</p>
        <p>Entropy Tick: {q.tick}</p>
      </section>

      <section>
        <h3>Entropy Gradient</h3>
        <pre>{JSON.stringify(q.gradient, null, 2)}</pre>
      </section>

      <section>
        <h3>Coherence Field</h3>
        <pre>{JSON.stringify(q.coherence, null, 2)}</pre>
      </section>

      <section>
        <h3>Entanglement Graph</h3>
        <pre>{JSON.stringify(q.entanglement, null, 2)}</pre>
      </section>

      <section>
        <h3>Signature Map</h3>
        <pre>{JSON.stringify(q.signatures, null, 2)}</pre>
      </section>

      <section>
        <h3>Raw Quantum Envelope</h3>
        <pre>{JSON.stringify(q, null, 2)}</pre>
      </section>
    </div>
  );
}

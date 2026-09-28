// PortalKernel.ts — Phase-12 RES-Shell Kernel
// Architecture: RES-proof projection of AFA/MAX
// Runtime: Cloudflare Workers + Hono
// Mode: Strict envelopes, phase engine, governance, identity

import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { jwtVerify } from 'hono/utils/jwt';
import { HTTPException } from 'hono/http-exception';
import { atob, crypto } from 'cloudflare:workers';

export type Env = {
  PORTAL_JWT_SECRET: string;
};

export type PortalPhaseId =
  | 'BOOT'
  | 'IDENTITY'
  | 'GOVERNANCE'
  | 'SIMULATION'
  | 'OBSERVATION'
  | 'SHUTDOWN';

export type EnvelopeKind =
  | 'REQUEST'
  | 'EVENT'
  | 'STATE'
  | 'ERROR'
  | 'CONTROL';

export interface PortalEnvelope<TPayload = unknown> {
  id: string;
  kind: EnvelopeKind;
  phase: PortalPhaseId;
  actor?: string;
  timestamp: string;
  payload: TPayload;
  trace?: string[];
}

export interface IdentityContext {
  subjectId: string;
  roles: string[];
  claims: Record<string, unknown>;
}

export interface GovernanceDecision {
  allowed: boolean;
  reason?: string;
  policyId?: string;
}

export interface PhaseTransition {
  from: PortalPhaseId;
  to: PortalPhaseId;
  reason: string;
}

export interface PortalResponse<TPayload = unknown> {
  envelope: PortalEnvelope<TPayload>;
  transitions?: PhaseTransition[];
}

// ---------- Utility: Strict Envelope Construction ----------

function nowIso(): string {
  return new Date().toISOString();
}

function newEnvelope<TPayload>(
  kind: EnvelopeKind,
  phase: PortalPhaseId,
  payload: TPayload,
  actor?: string,
  trace?: string[]
): PortalEnvelope<TPayload> {
  return {
    id: crypto.randomUUID(),
    kind,
    phase,
    actor,
    timestamp: nowIso(),
    payload,
    trace: trace ?? [],
  };
}

function appendTrace(
  envelope: PortalEnvelope,
  label: string
): PortalEnvelope {
  return {
    ...envelope,
    trace: [...(envelope.trace ?? []), label],
  };
}

// ---------- Identity: JWT Enforcement (Projection Only) ----------

async function resolveIdentity(
  c: any
): Promise<IdentityContext | null> {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return null;

  try {
    const secret = c.env.PORTAL_JWT_SECRET;
    const payload = await jwtVerify(token, secret);
    return {
      subjectId: String(payload.sub ?? 'unknown'),
      roles: Array.isArray(payload.roles) ? payload.roles.map(String) : [],
      claims: payload,
    };
  } catch {
    return null;
  }
}

// ---------- Governance: UmbrellaStrict Projection ----------

function evaluateGovernance(
  envelope: PortalEnvelope,
  identity: IdentityContext | null
): GovernanceDecision {
  const phase = envelope.phase;

  if (phase === 'BOOT') {
    return { allowed: true, policyId: 'BOOT-OPEN' };
  }

  if (!identity) {
    return {
      allowed: false,
      reason: 'Identity required',
      policyId: `${phase}-IDENTITY-REQUIRED`,
    };
  }

  const hasRole = (role: string) => identity.roles.includes(role);

  switch (phase) {
    case 'IDENTITY':
      return { allowed: true, policyId: 'IDENTITY-ANY' };
    case 'GOVERNANCE':
      return {
        allowed: hasRole('admin'),
        reason: hasRole('admin') ? undefined : 'Admin role required',
        policyId: 'GOVERNANCE-ADMIN',
      };
    case 'SIMULATION':
      return {
        allowed: hasRole('sim-actor'),
        reason: hasRole('sim-actor') ? undefined : 'sim-actor role required',
        policyId: 'SIMULATION-ACTOR',
      };
    case 'OBSERVATION':
      return {
        allowed: hasRole('observer') || hasRole('admin'),
        reason:
          hasRole('observer') || hasRole('admin')
            ? undefined
            : 'observer or admin role required',
        policyId: 'OBSERVATION-ACCESS',
      };
    case 'SHUTDOWN':
      return {
        allowed: hasRole('admin'),
        reason: hasRole('admin') ? undefined : 'Admin role required',
        policyId: 'SHUTDOWN-ADMIN',
      };
    default:
      return {
        allowed: false,
        reason: 'Unknown phase',
        policyId: 'UNKNOWN-PHASE',
      };
  }
}

// ---------- Phase Engine: Strict, Projection-Only ----------

function nextPhase(
  current: PortalPhaseId,
  envelope: PortalEnvelope
): PhaseTransition | null {
  switch (current) {
    case 'BOOT':
      return {
        from: 'BOOT',
        to: 'IDENTITY',
        reason: 'System boot complete; identity required',
      };
    case 'IDENTITY':
      return {
        from: 'IDENTITY',
        to: 'GOVERNANCE',
        reason: 'Identity resolved; governance evaluation',
      };
    case 'GOVERNANCE':
      return {
        from: 'GOVERNANCE',
        to: 'SIMULATION',
        reason: 'Governance passed; simulation allowed',
      };
    case 'SIMULATION':
      return {
        from: 'SIMULATION',
        to: 'OBSERVATION',
        reason: 'Simulation step complete; observation phase',
      };
    case 'OBSERVATION':
      return {
        from: 'OBSERVATION',
        to: 'SHUTDOWN',
        reason: 'Observation complete; shutdown sequence',
      };
    case 'SHUTDOWN':
      return null;
    default:
      return null;
  }
}

// ---------- Simulation / Behavior Projections ----------

interface SimulationInput {
  scenario: string;
  parameters: Record<string, unknown>;
}

interface SimulationOutput {
  scenario: string;
  result: Record<string, unknown>;
}

function runSimulation(
  envelope: PortalEnvelope<SimulationInput>
): SimulationOutput {
  const { scenario, parameters } = envelope.payload;

  return {
    scenario,
    result: {
      status: 'ok',
      processedAt: nowIso(),
      parameters,
    },
  };
}

// ---------- Error Envelope ----------

function errorEnvelope(
  phase: PortalPhaseId,
  message: string,
  actor?: string,
  trace?: string[]
): PortalEnvelope<{ message: string }> {
  return newEnvelope('ERROR', phase, { message }, actor, trace);
}

// ---------- Hono App / Worker Entrypoint ----------

const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
  const identity = await resolveIdentity(c);
  c.set('identity', identity);
  await next();
});

app.post('/portal/simulate', async (c) => {
  const identity = c.get('identity') as IdentityContext | null;

  let bootEnv = newEnvelope<SimulationInput>(
    'REQUEST',
    'BOOT',
    await c.req.json(),
    identity?.subjectId
  );
  bootEnv = appendTrace(bootEnv, 'BOOT');

  const identityTransition = nextPhase('BOOT', bootEnv);
  if (!identityTransition) {
    throw new HTTPException(500, { message: 'Invalid phase transition from BOOT' });
  }

  let identityEnv: PortalEnvelope<SimulationInput> = {
    ...bootEnv,
    phase: identityTransition.to,
  };
  identityEnv = appendTrace(identityEnv, 'IDENTITY');

  const govTransition = nextPhase(identityEnv.phase, identityEnv);
  if (!govTransition) {
    throw new HTTPException(500, { message: 'Invalid phase transition from IDENTITY' });
  }

  let govEnv: PortalEnvelope<SimulationInput> = {
    ...identityEnv,
    phase: govTransition.to,
  };
  govEnv = appendTrace(govEnv, 'GOVERNANCE');

  const decision = evaluateGovernance(govEnv, identity);
  if (!decision.allowed) {
    const errEnv = errorEnvelope(
      govEnv.phase,
      decision.reason ?? 'Governance denied',
      identity?.subjectId,
      govEnv.trace
    );
    return c.json<PortalResponse<{ message: string }>>(
      {
        envelope: errEnv,
        transitions: [identityTransition, govTransition],
      },
      403
    );
  }

  const simTransition = nextPhase(govEnv.phase, govEnv);
  if (!simTransition) {
    throw new HTTPException(500, { message: 'Invalid phase transition from GOVERNANCE' });
  }

  let simEnv: PortalEnvelope<SimulationInput> = {
    ...govEnv,
    phase: simTransition.to,
  };
  simEnv = appendTrace(simEnv, 'SIMULATION');

  const simOutput = runSimulation(simEnv);

  const obsTransition = nextPhase(simEnv.phase, simEnv);
  if (!obsTransition) {
    throw new HTTPException(500, { message: 'Invalid phase transition from SIMULATION' });
  }

  let obsEnv: PortalEnvelope<SimulationOutput> = {
    ...simEnv,
    phase: obsTransition.to,
    payload: simOutput,
  };
  obsEnv = appendTrace(obsEnv, 'OBSERVATION');

  const shutTransition = nextPhase(obsEnv.phase, obsEnv);

  const transitions: PhaseTransition[] = [
    identityTransition,
    govTransition,
    simTransition,
    obsTransition,
  ];
  if (shutTransition) transitions.push(shutTransition);

  const finalEnv: PortalEnvelope<SimulationOutput> = shutTransition
    ? {
        ...obsEnv,
        phase: shutTransition.to,
        trace: appendTrace(obsEnv, 'SHUTDOWN').trace,
      }
    : obsEnv;

  const response: PortalResponse<SimulationOutput> = {
    envelope: finalEnv,
    transitions,
  };

  return c.json(response, 200);
});

app.get('/portal/health', (c) => {
  const env = newEnvelope('STATE', 'BOOT', { status: 'ok', phase: 'BOOT' });
  return c.json<PortalResponse<{ status: string; phase: string }>>({
    envelope: env,
  });
});

export default app;

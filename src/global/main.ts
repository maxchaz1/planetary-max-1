import { PortalKernel } from '../kernel/PortalKernel';

export interface Env {
  MAX_OS_VERSION: string;
  PORTAL_OS_PHASE: string;
  UMBRELLA_ENFORCEMENT: string;
  IDENTITY_JWT_ISSUER: string;
  IDENTITY_JWT_AUDIENCE: string;
  IDENTITY_JWT_SECRET: string;
}

const kernel = new PortalKernel();

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // If your MAX‑OS‑1 kernel already has a request handler:
    return kernel.handle(request, env, ctx);
  },
};

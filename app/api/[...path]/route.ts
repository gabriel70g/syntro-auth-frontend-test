import type { NextRequest } from 'next/server';
import { isSafeMethod, isSameOriginRequest } from '@server/csrf';
import { bffError } from '@server/envelope';
import { proxyToBackend } from '@server/proxy-handler';
import { matchRoute, toBackendPath } from '@server/routes';

/**
 * Why: BFF. El navegador solo habla con este origen; el servidor de Next llama a SyntroAuth server-to-server
 * con las credenciales guardadas en cookies HttpOnly. Solo pasan las rutas de `src/server/routes.ts`.
 */

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    const { path } = await ctx.params;
    const backendPath = toBackendPath(path);
    const rule = backendPath ? matchRoute(req.method, backendPath) : null;
    if (!backendPath || !rule) return bffError(404, 'NOT_FOUND', 'Ruta no disponible.');
    if (!isSafeMethod(req.method) && !isSameOriginRequest(req)) {
        return bffError(403, 'CSRF_REJECTED', 'Pedido rechazado: el origen no está permitido.');
    }
    return proxyToBackend(req, backendPath, rule);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

import type { NextRequest } from 'next/server';
import { writeSession } from '@server/cookies';
import { isSameOriginRequest } from '@server/csrf';
import { bffError, bffOk } from '@server/envelope';
import { publicClaims } from '@server/jwt-claims';
import { sessionExpired } from '@server/proxy-handler';
import { resolveAccess } from '@server/session';

/**
 * Why: la UI necesita saber quién está (rol, empresa, vencimiento) sin tener el token. GET devuelve los claims
 * públicos; POST fuerza un refresh (p. ej. después de crear la empresa, para que el token lleve el tenant nuevo).
 */

async function respond(req: NextRequest, forceRefresh: boolean) {
    const session = await resolveAccess(req, { forceRefresh });
    if (session.kind === 'unavailable') {
        return bffError(503, 'SESSION_UNAVAILABLE', 'No se pudo validar la sesión. Probá de nuevo en unos segundos.');
    }
    if (session.kind === 'none') return sessionExpired();

    const res = bffOk(publicClaims(session.access));
    if (session.rotated) writeSession(res, session.rotated);
    return res;
}

export async function GET(req: NextRequest) {
    return respond(req, false);
}

export async function POST(req: NextRequest) {
    if (!isSameOriginRequest(req)) return bffError(403, 'CSRF_REJECTED', 'Pedido rechazado: el origen no está permitido.');
    return respond(req, true);
}

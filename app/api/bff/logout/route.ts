import type { NextRequest } from 'next/server';
import { callBackend, clientHeaders } from '@server/backend';
import { COOKIE, clearCookie, clearSession } from '@server/cookies';
import { isSameOriginRequest } from '@server/csrf';
import { bffError, bffOk } from '@server/envelope';

/**
 * Why: revoca el refresh en el backend y borra las cookies. Las cookies se borran aunque el backend no
 * responda: la sesión de este navegador termina igual.
 */
export async function POST(req: NextRequest) {
    if (!isSameOriginRequest(req)) return bffError(403, 'CSRF_REJECTED', 'Pedido rechazado: el origen no está permitido.');

    const refresh = req.cookies.get(COOKIE.refresh)?.value;
    const access = req.cookies.get(COOKIE.access)?.value;
    if (refresh) {
        await callBackend('/api/auth/logout', {
            method: 'POST',
            headers: {
                ...clientHeaders(req),
                'content-type': 'application/json',
                ...(access ? { authorization: `Bearer ${access}` } : {}),
            },
            body: JSON.stringify({ refreshToken: refresh }),
        });
    }

    const res = bffOk({ message: 'Sesión cerrada' });
    clearSession(res);
    clearCookie(res, COOKIE.link);
    return res;
}

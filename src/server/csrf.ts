import type { NextRequest } from 'next/server';
import { appOrigin } from '@server/config';

/**
 * Why: con la sesión en cookies, otro sitio podría disparar pedidos con ellas (CSRF). `SameSite=Lax` frena el
 * POST cross-site, pero no alcanza como única barrera. Se exige que el pedido venga del mismo origen:
 * `Sec-Fetch-Site` (lo manda todo navegador moderno y no se puede falsificar desde JS) o, si no está, `Origin`.
 * Sin ninguno de los dos, se rechaza.
 */

export function isSafeMethod(method: string): boolean {
    return method === 'GET' || method === 'HEAD';
}

export function isSameOriginRequest(req: NextRequest): boolean {
    const site = req.headers.get('sec-fetch-site');
    if (site) return site === 'same-origin';

    const origin = req.headers.get('origin');
    if (!origin) return false;
    return origin === (appOrigin() ?? req.nextUrl.origin);
}

import { authenticatedFetch } from '@common/api/clients/http.helpers';
import type { JwtPayload } from '@common/lib/jwt';

/**
 * Why: quién está logueado (rol, empresa, vencimiento) sin tener el token: el BFF devuelve solo los claims públicos.
 */

export async function getSessionClaims(): Promise<JwtPayload | null> {
    const res = await authenticatedFetch('/api/bff/session', { method: 'GET' });
    if (!res.ok || typeof res.body !== 'object' || res.body === null) return null;
    const data = (res.body as { data?: unknown }).data;
    return typeof data === 'object' && data !== null && typeof (data as { sub?: unknown }).sub === 'string'
        ? (data as JwtPayload)
        : null;
}

/** Fuerza un refresh (p. ej. para que el token lleve la empresa recién creada). */
export async function renewSession(): Promise<boolean> {
    const res = await authenticatedFetch('/api/bff/session', { method: 'POST', body: '{}' });
    return res.ok;
}

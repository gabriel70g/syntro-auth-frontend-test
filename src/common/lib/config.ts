/**
 * Why: Config y headers base; sin lógica de negocio.
 */

export const API_URL =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
    'https://syntroauth-production.up.railway.app';

export const DEFAULT_TENANT_ID =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_TENANT_ID) ||
    'a0000000-0000-0000-0000-000000000001';

/** Why: Envía/recibe la cookie HttpOnly del refresh cuando el front y la API son orígenes distintos (CORS + credenciales). */
export const API_FETCH_CREDENTIALS: RequestCredentials = 'include';

export function getRedirectUri(): string {
    if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_REDIRECT_URI) {
        return `${process.env.NEXT_PUBLIC_REDIRECT_URI}/auth/callback`;
    }
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/auth/callback`;
    }
    return 'http://localhost:3000/auth/callback';
}

export function getDefaultHeaders(): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        'X-Tenant-Id': DEFAULT_TENANT_ID,
    };
}

export function mergeHeaders(
    base: Record<string, string>,
    extra: Record<string, string | undefined>
): Record<string, string> {
    const out = { ...base };
    for (const [k, v] of Object.entries(extra)) {
        if (v !== undefined) out[k] = v;
    }
    return out;
}

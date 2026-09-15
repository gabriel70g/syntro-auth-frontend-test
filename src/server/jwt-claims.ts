/**
 * Why: el BFF lee los claims para decidir la UI (rol, vencimiento, qué mostrar en la sesión). No valida la
 * firma: el token llegó del backend por TLS y vive en una cookie HttpOnly. La autorización la aplica el backend.
 */

export type Claims = Record<string, unknown>;

/** Claims que el navegador puede ver. Nunca el token. */
const PUBLIC_CLAIMS = [
    'sub', 'email', 'tenant_id', 'role', 'jti', 'sid', 'acr', 'amr', 'auth_time', 'step_up_exp', 'pv', 'exp', 'iss', 'aud',
] as const;

export function decodeClaims(token: string): Claims | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
        const parsed: unknown = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as Claims) : null;
    } catch {
        return null;
    }
}

/** Segundos hasta `exp`; null si el token no trae `exp` legible. */
export function secondsToExpiry(token: string, nowMs: number = Date.now()): number | null {
    const exp = decodeClaims(token)?.exp;
    return typeof exp === 'number' ? exp - Math.floor(nowMs / 1000) : null;
}

export function roleOf(token: string): string | undefined {
    const role = decodeClaims(token)?.role;
    return typeof role === 'string' ? role : undefined;
}

export function publicClaims(token: string): Claims {
    const claims = decodeClaims(token) ?? {};
    const out: Claims = {};
    for (const key of PUBLIC_CLAIMS) {
        if (claims[key] !== undefined) out[key] = claims[key];
    }
    return out;
}

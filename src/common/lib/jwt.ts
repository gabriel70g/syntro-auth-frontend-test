export interface JwtPayload {
    sub: string;
    email?: string;
    normalized_email?: string;
    tenant_id?: string;
    exp?: number;
    iat?: number;
    iss?: string;
    aud?: string;
    role?: string;
    /** JWT id (PEN-3 grado bancario). Único por token, usado para denylist. */
    jti?: string;
    /** Session id server-side (PEN-2). Atado a binding IP/UA en user_sessions. */
    sid?: string;
    /** Authentication Context Class Reference (PEN-1). "low" o "high". */
    acr?: string;
    /** Authentication Methods References (PEN-1). Array: pwd, totp, mfa, oauth, etc. */
    amr?: string[];
    /** Unix timestamp del momento en que el user se autenticó (PEN-1). */
    auth_time?: number;
    /** Unix timestamp hasta cuándo dura el acr=high (PEN-1 step-up, ~5min). */
    step_up_exp?: number;
    /** Permissions version per-app (PEN-5). Opt-in via header X-App-Id. */
    pv?: number;
    [key: string]: unknown;
}

/**
 * Why: Leer claims del JWT en cliente (la firma valida el backend).
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payloadBase64 = parts[1];
        const padded = payloadBase64.replaceAll('-', '+').replaceAll('_', '/');
        const payloadJson = atob(padded);
        return JSON.parse(payloadJson) as JwtPayload;
    } catch {
        return null;
    }
}

export function formatExpiry(exp: number): string {
    const date = new Date(exp * 1000);
    return date.toLocaleString('es-AR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

/**
 * Formatea un timestamp Unix relativo a "ahora" (ej: "hace 3 min", "en 5 min").
 * Útil para auth_time y step_up_exp donde la distancia temporal es lo informativo.
 */
export function formatRelative(unixSeconds: number): string {
    const diffSec = Math.round(unixSeconds - Date.now() / 1000);
    const abs = Math.abs(diffSec);
    const future = diffSec >= 0;

    const fmt = (n: number, unit: string) =>
        future ? `en ${n} ${unit}` : `hace ${n} ${unit}`;

    if (abs < 60) return fmt(abs, 'seg');
    if (abs < 3600) return fmt(Math.round(abs / 60), 'min');
    if (abs < 86400) return fmt(Math.round(abs / 3600), 'h');
    return fmt(Math.round(abs / 86400), 'días');
}

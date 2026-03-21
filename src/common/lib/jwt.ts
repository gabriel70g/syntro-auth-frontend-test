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

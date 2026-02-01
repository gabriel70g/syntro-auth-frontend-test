/**
 * Utilidades para decodificar JWT (solo el payload, que es público).
 * La firma se valida en el backend; aquí solo leemos claims para mostrar en UI.
 */

export interface JwtPayload {
    sub: string;
    email?: string;
    normalized_email?: string;
    tenant_id?: string;
    exp: number;
    iat?: number;
    iss?: string;
    aud?: string;
    [key: string]: unknown;
}

/**
 * Decodifica el payload de un JWT sin verificar la firma.
 * El payload es Base64URL y es público; la seguridad está en la firma (validada en el backend).
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

/**
 * Formatea un timestamp Unix a fecha legible.
 */
export function formatExpiry(exp: number): string {
    const date = new Date(exp * 1000);
    return date.toLocaleString('es-AR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

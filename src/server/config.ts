/**
 * Why: configuración del BFF. Vive solo en el servidor de Next: nada de acá entra al bundle del navegador.
 */

const PRODUCTION_API_URL = 'https://syntroauth-production.up.railway.app';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Base del backend. En Railway conviene la red privada (`SYNTROAUTH_API_URL`). */
export function backendBaseUrl(): string {
    const raw = process.env.SYNTROAUTH_API_URL || process.env.NEXT_PUBLIC_API_URL || PRODUCTION_API_URL;
    return raw.replace(/\/+$/, '');
}

/** Nombre de la cookie de refresh que emite el backend (`Auth:RefreshCookie:CookieName`). */
export function backendRefreshCookieName(): string {
    return process.env.SYNTROAUTH_REFRESH_COOKIE || 'syntroauth_refresh';
}

/**
 * Origen público del front, para el `redirect_uri` de OAuth y las redirecciones.
 * ❌ NEVER derivarlo del header Host: lo controla quien hace el pedido.
 * Sin `APP_ORIGIN` en producción devuelve null y OAuth falla cerrado.
 */
export function appOrigin(): string | null {
    const raw = process.env.APP_ORIGIN;
    if (raw) {
        try {
            return new URL(raw).origin;
        } catch {
            return null;
        }
    }
    return process.env.NODE_ENV === 'production' ? null : 'http://localhost:3000';
}

export function defaultTenantId(): string {
    return process.env.NEXT_PUBLIC_TENANT_ID || 'a0000000-0000-0000-0000-000000000001';
}

export function uuidOrNull(value: string | null | undefined): string | null {
    return value && UUID.test(value) ? value : null;
}

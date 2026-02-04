/**
 * Configuración centralizada - Demo/Maqueta SyntroAuth
 * 
 * Todas las constantes de configuración en un solo lugar.
 * Evita duplicación y facilita mantenimiento.
 * 
 * Variables de entorno tienen prioridad sobre defaults.
 * Formato: NEXT_PUBLIC_* para que Next.js las exponga al cliente.
 */

/**
 * URL del backend SyntroAuth
 * Default: Railway producción
 * Override: NEXT_PUBLIC_API_URL
 */
export const API_URL = 
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
    'https://syntroauth-production.up.railway.app';

/**
 * Tenant ID para multi-tenant
 * Default: Tenant de fábrica de SyntroAuth
 * Override: NEXT_PUBLIC_TENANT_ID
 * 
 * IMPORTANTE: Requerido para OAuth porque el backend no sabe
 * a qué tenant asignar usuarios que vienen de proveedores externos.
 */
export const DEFAULT_TENANT_ID = 
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_TENANT_ID) ||
    'a0000000-0000-0000-0000-000000000001';

/**
 * Redirect URI para OAuth callbacks
 * Prioridad:
 * 1. NEXT_PUBLIC_REDIRECT_URI (Railway/producción)
 * 2. window.location.origin (cliente)
 * 3. localhost (fallback solo para build time)
 */
export function getRedirectUri(): string {
    // Prioridad 1: Variable de entorno (Railway/producción)
    if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_REDIRECT_URI) {
        return `${process.env.NEXT_PUBLIC_REDIRECT_URI}/auth/callback`;
    }

    // Prioridad 2: window.location (cliente)
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/auth/callback`;
    }

    // Fallback: solo para SSR/build time (no debería ejecutarse en runtime)
    return 'http://localhost:3000/auth/callback';
}

/**
 * Headers comunes para requests al backend
 * Incluye X-Tenant-Id requerido para multi-tenant
 */
export function getDefaultHeaders(): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        'X-Tenant-Id': DEFAULT_TENANT_ID,
    };
}

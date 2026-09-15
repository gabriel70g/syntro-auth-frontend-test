import { getDefaultHeaders, mergeHeaders } from '@common/lib/config';

/**
 * Why: Parseo JSON tolerante para capa HTTP.
 */
export async function readJsonSafe(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

export interface HttpResult {
    readonly ok: boolean;
    readonly status: number;
    readonly body: unknown;
}

function errorCodeOf(body: unknown): string | null {
    if (typeof body !== 'object' || body === null) return null;
    const error = (body as { error?: { code?: unknown } }).error;
    return typeof error?.code === 'string' ? error.code : null;
}

/**
 * Why: todo pedido va al BFF del mismo origen. Las credenciales viajan en cookies HttpOnly que este código no
 * puede leer; el refresh lo hace el servidor. status 0 = no hubo respuesta (red).
 */
export async function bffFetch(path: string, init: RequestInit = {}): Promise<HttpResult> {
    try {
        const res = await fetch(path, {
            ...init,
            credentials: 'same-origin',
            headers: mergeHeaders(getDefaultHeaders(), (init.headers as Record<string, string> | undefined) ?? {}),
        });
        return { ok: res.ok, status: res.status, body: await readJsonSafe(res) };
    } catch {
        return { ok: false, status: 0, body: null };
    }
}

/** Si la sesión venció (el servidor ya no pudo refrescarla), vuelve al login. */
export function redirectIfSessionExpired(status: number, body: unknown): void {
    if (status === 401 && errorCodeOf(body) === 'SESSION_EXPIRED' && typeof window !== 'undefined') {
        // Navegación completa a propósito: descarta todo el estado de la pantalla.
        window.location.assign(new URL('/login', window.location.origin));
    }
}

/** Pedido que necesita sesión. */
export async function authenticatedFetch(path: string, init: RequestInit = {}): Promise<HttpResult> {
    const result = await bffFetch(path, init);
    redirectIfSessionExpired(result.status, result.body);
    return result;
}

import { isIP } from 'node:net';
import type { NextRequest } from 'next/server';
import { backendBaseUrl, backendRefreshCookieName, uuidOrNull } from '@server/config';

/**
 * Why: única salida del servidor de Next hacia SyntroAuth (server-to-server, sin CORS ni `Origin`).
 * Reenvía lo que el backend usa para el rate limit, el binding de sesión y la auditoría: el User-Agent del
 * navegador (`X-Original-User-Agent`) y su IP (`X-Forwarded-For`). El backend los acepta solo si el pedido llega
 * por la red privada de Railway (`SYNTROAUTH_API_URL`; `ClientContextMiddleware` en syntroAuth).
 */

const TIMEOUT_MS = 15_000;

export function clientHeaders(req: NextRequest): Record<string, string> {
    const out: Record<string, string> = { accept: 'application/json' };
    const tenant = uuidOrNull(req.headers.get('x-tenant-id'));
    if (tenant) out['x-tenant-id'] = tenant;
    const ua = req.headers.get('user-agent');
    if (ua) {
        out['user-agent'] = ua;
        out['x-original-user-agent'] = ua;
    }
    // La IP la pone el borde de Railway en `X-Real-IP`. El `X-Forwarded-For` entrante no: lo escribe el cliente.
    const clientIp = singleIp(req.headers.get('x-real-ip'));
    if (clientIp) out['x-forwarded-for'] = clientIp;
    return out;
}

/** Una sola IP válida, o null (ausente, varias o basura). */
function singleIp(value: string | null): string | null {
    const ip = value?.trim() ?? '';
    return isIP(ip) ? ip : null;
}

/** null = el backend no respondió (red, timeout). El que llama decide el código de error. */
export async function callBackend(
    path: string,
    init: { method: string; headers: Record<string, string>; body?: string | null },
): Promise<Response | null> {
    try {
        return await fetch(`${backendBaseUrl()}${path}`, {
            method: init.method,
            headers: init.headers,
            body: init.body ?? undefined,
            redirect: 'manual',
            cache: 'no-store',
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
    } catch {
        return null;
    }
}

export async function readJson(res: Response): Promise<unknown> {
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

/**
 * El backend manda el refresh en `Set-Cookie` y no en el JSON (`IncludeRefreshTokenInJsonBody` es false por
 * defecto). ASP.NET codifica el valor con `Uri.EscapeDataString`.
 */
export function refreshFromSetCookie(res: Response): { value: string; maxAge: number | null } | null {
    const name = backendRefreshCookieName();
    for (const line of res.headers.getSetCookie()) {
        const [pair, ...attributes] = line.split(';');
        const eq = pair.indexOf('=');
        if (eq < 0 || pair.slice(0, eq).trim() !== name) continue;

        const value = decodeURIComponent(pair.slice(eq + 1).trim());
        if (!value) return null;
        const maxAgeAttribute = attributes.map((a) => a.trim()).find((a) => a.toLowerCase().startsWith('max-age='));
        const maxAge = maxAgeAttribute ? Number(maxAgeAttribute.slice('max-age='.length)) : null;
        if (maxAge !== null && (!Number.isFinite(maxAge) || maxAge <= 0)) return null;
        return { value, maxAge };
    }
    return null;
}
